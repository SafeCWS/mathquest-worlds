/**
 * otpStore — email one-time-code challenges for MathQuest Worlds sign-in.
 *
 * Ported unchanged in behaviour from the approved G1.5 prototype
 * (mathquest-worlds-big-mult-otp, lib/otp/otpStore.ts), plus the L99 expiry
 * sweep and the NODE_ENV=test code hook. Pure TypeScript with node:crypto
 * only — no Next, no NextAuth, no mailer — so it is unit-tested with
 * node:test. NEVER import this from middleware.ts or anything the Edge
 * middleware loads (node:crypto is not available there).
 *
 * Rules:
 *   - 6-digit code, crypto.randomInt(0, 1_000_000), zero-padded.
 *   - Only a keyed SHA-256 (HMAC-SHA256, per-process random key, bound to the
 *     email) of the code is stored, never the code itself.
 *   - Expires 10 minutes after it was sent (expired AT 10:00, valid at 9:59.999).
 *   - 5 wrong tries burn the code; it then fails even with the right digits.
 *   - Single use: deleted on success.
 *   - 60 s resend cooldown; max 5 sends per rolling hour per email.
 *   - A new request replaces any prior code (and resets its tries).
 *   - Email normalised lowercase + trim everywhere.
 *   - Constant-time compare (crypto.timingSafeEqual on two 32-byte digests).
 *
 * Storage is an in-process Map. That is safe ONLY because the service runs a
 * single instance (numInstances: 1). A restart just means "ask for a new code".
 *
 * Concurrency: every public method is synchronous — there is no await between
 * reading a challenge and writing it back, so two simultaneous verifies on the
 * single Node event loop cannot both pass, and a burn cannot be raced.
 *
 * The send log is kept SEPARATE from the challenge, so a successful sign-in
 * (which deletes the challenge) does not reset the hourly send cap.
 */
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

export const CODE_TTL_MS = 10 * 60 * 1000
export const MAX_WRONG_TRIES = 5
export const RESEND_COOLDOWN_MS = 60 * 1000
export const MAX_SENDS_PER_HOUR = 5
export const SEND_WINDOW_MS = 60 * 60 * 1000
const MAX_EMAIL_LENGTH = 254

export type RequestResult =
  | { status: 'sent'; code: string; expiresAt: number }
  | { status: 'not-allowed' }
  | { status: 'cooldown'; retryInSec: number }
  | { status: 'rate-limited'; retryInSec: number }

export type VerifyResult =
  | { ok: true; email: string }
  | { ok: false; reason: 'expired' | 'wrong' | 'burned' | 'none'; triesLeft?: number }

interface Challenge {
  codeHash: Buffer
  expiresAt: number
  tries: number
}

export interface OtpStoreOptions {
  /** Clock in epoch ms. Injected for tests. */
  now?: () => number
  /** Returns an integer in [0, 1_000_000). Injected for tests. */
  randomCode?: () => number
  /** HMAC key. Defaults to 32 random bytes per process. */
  hashKey?: Buffer
}

export function normalizeEmail(raw: unknown): string {
  return String(raw ?? '').toLowerCase().trim()
}

/**
 * Parse SIMPLE_AUTH_USERS (same shape the real auth.ts reads:
 * `[{"email": "...", "password": "..."}]`). Password is ignored — only the
 * email list matters for OTP. Malformed JSON, a non-array, or junk entries
 * yield an empty / partial set; this never throws.
 */
export function parseAllowlist(json: string | undefined | null): Set<string> {
  const out = new Set<string>()
  if (!json || !json.trim()) return out
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return out
  }
  if (!Array.isArray(parsed)) return out
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue
    const email = normalizeEmail((entry as { email?: unknown }).email)
    if (email && email.length <= MAX_EMAIL_LENGTH && email.includes('@')) out.add(email)
  }
  return out
}

export class OtpStore {
  private readonly challenges = new Map<string, Challenge>()
  private readonly sendLog = new Map<string, number[]>()
  private readonly now: () => number
  private readonly randomCode: () => number
  private readonly hashKey: Buffer

  constructor(opts: OtpStoreOptions = {}) {
    this.now = opts.now ?? Date.now
    this.randomCode = opts.randomCode ?? (() => randomInt(0, 1_000_000))
    this.hashKey = opts.hashKey ?? randomBytes(32)
  }

  private hash(email: string, code: string): Buffer {
    return createHmac('sha256', this.hashKey).update(`${email}\n${code}`).digest()
  }

  /** Sends within the rolling hour, pruned in place. */
  private recentSends(email: string, t: number): number[] {
    const sends = (this.sendLog.get(email) ?? []).filter((s) => t - s < SEND_WINDOW_MS)
    if (sends.length) this.sendLog.set(email, sends)
    else this.sendLog.delete(email)
    return sends
  }

  requestCode(rawEmail: unknown, allowlist: ReadonlySet<string>): RequestResult {
    const email = normalizeEmail(rawEmail)
    if (!email || email.length > MAX_EMAIL_LENGTH || !allowlist.has(email)) {
      return { status: 'not-allowed' } // stores nothing, counts nothing
    }
    const t = this.now()
    const sends = this.recentSends(email, t)

    if (sends.length >= MAX_SENDS_PER_HOUR) {
      const oldest = sends[0]
      return { status: 'rate-limited', retryInSec: Math.ceil((oldest + SEND_WINDOW_MS - t) / 1000) }
    }
    const last = sends[sends.length - 1]
    if (last !== undefined && t - last < RESEND_COOLDOWN_MS) {
      return { status: 'cooldown', retryInSec: Math.ceil((last + RESEND_COOLDOWN_MS - t) / 1000) }
    }

    const n = this.randomCode()
    if (!Number.isInteger(n) || n < 0 || n >= 1_000_000) {
      throw new RangeError('randomCode must return an integer in [0, 1_000_000)')
    }
    const code = String(n).padStart(6, '0')
    const expiresAt = t + CODE_TTL_MS
    // Replaces any prior code for this email: old digits stop working, tries reset.
    this.challenges.set(email, { codeHash: this.hash(email, code), expiresAt, tries: 0 })
    this.sendLog.set(email, [...sends, t])
    return { status: 'sent', code, expiresAt }
  }

  verifyCode(rawEmail: unknown, rawCode: unknown): VerifyResult {
    const email = normalizeEmail(rawEmail)
    const challenge = email ? this.challenges.get(email) : undefined
    if (!challenge) return { ok: false, reason: 'none' }

    if (challenge.tries >= MAX_WRONG_TRIES) return { ok: false, reason: 'burned' }
    if (this.now() >= challenge.expiresAt) {
      this.challenges.delete(email)
      return { ok: false, reason: 'expired' }
    }

    // Tolerate "123 456" / "123-456" pasted from mail; anything else that is
    // not exactly 6 digits is still hashed and compared, so it counts as a try.
    const code = String(rawCode ?? '').replace(/[\s-]/g, '')
    const candidate = this.hash(email, code)
    const match = timingSafeEqual(candidate, challenge.codeHash) && /^\d{6}$/.test(code)

    if (match) {
      this.challenges.delete(email) // single use
      return { ok: true, email }
    }
    challenge.tries += 1
    const triesLeft = MAX_WRONG_TRIES - challenge.tries
    return triesLeft <= 0
      ? { ok: false, reason: 'burned', triesLeft: 0 }
      : { ok: false, reason: 'wrong', triesLeft }
  }

  /**
   * L99: drop expired challenges (burned ones included — they stay until
   * expiry so a burned code keeps answering "burned", not "none") and send
   * logs whose every send is older than the rolling hour. Returns how many
   * map entries were removed. Bounded memory for a long-lived process.
   */
  sweepExpired(): number {
    const t = this.now()
    let removed = 0
    for (const [email, c] of this.challenges) {
      if (t >= c.expiresAt) {
        this.challenges.delete(email)
        removed++
      }
    }
    for (const email of [...this.sendLog.keys()]) {
      if (this.recentSends(email, t).length === 0) removed++
    }
    return removed
  }

  /** Test/diagnostic helper — never exposed over HTTP. */
  hasChallenge(rawEmail: unknown): boolean {
    return this.challenges.has(normalizeEmail(rawEmail))
  }

  /** Test/diagnostic helper — total stored entries (challenges + send logs). */
  size(): { challenges: number; sendLogs: number } {
    return { challenges: this.challenges.size, sendLogs: this.sendLog.size }
  }
}

export const SWEEP_INTERVAL_MS = 60 * 1000

/**
 * Playwright hook: a fixed code source, ONLY when NODE_ENV is 'test' or
 * 'development' AND OTP_TEST_CODE is exactly 6 digits. Anything else
 * (production, unset, typos) returns undefined and the store uses
 * crypto.randomInt.
 *
 * Why 'development' too: Next inlines process.env.NODE_ENV at compile time —
 * "development" under `next dev` (the Playwright webServer), "production"
 * under `next build`. A literal === 'test' could therefore never fire for
 * Playwright, while a production build compiles the caller below to
 * `{NODE_ENV:"production", …}`, so this hook is dead code on Render whatever
 * env vars the service carries (verified in .next/server/chunks at build).
 * Takes the env as an argument so the guard itself is unit-tested.
 */
const TEST_HOOK_NODE_ENVS: ReadonlySet<string> = new Set(['test', 'development'])

export function resolveTestCodeSource(env: {
  NODE_ENV?: string
  OTP_TEST_CODE?: string
}): (() => number) | undefined {
  if (!env.NODE_ENV || !TEST_HOOK_NODE_ENVS.has(env.NODE_ENV)) return undefined
  const raw = env.OTP_TEST_CODE ?? ''
  if (!/^\d{6}$/.test(raw)) return undefined
  const n = Number(raw)
  return () => n
}

/**
 * Process-wide singleton for the route handlers. Pinned on globalThis so the
 * Next dev server's module reloads (HMR) do not silently drop live codes, and
 * so the sweep interval is started exactly once per process.
 */
const GLOBAL_KEY = Symbol.for('mathquest.otpStore')
type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: OtpStore }

export function getOtpStore(): OtpStore {
  const g = globalThis as GlobalWithStore
  if (!g[GLOBAL_KEY]) {
    const store = new OtpStore({
      randomCode: resolveTestCodeSource({
        NODE_ENV: process.env.NODE_ENV,
        OTP_TEST_CODE: process.env.OTP_TEST_CODE,
      }),
    })
    const timer = setInterval(() => store.sweepExpired(), SWEEP_INTERVAL_MS)
    timer.unref?.() // never keeps the process (or a test run) alive
    g[GLOBAL_KEY] = store
  }
  return g[GLOBAL_KEY]
}
