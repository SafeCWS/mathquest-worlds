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
import { isIP } from 'node:net'

export const CODE_TTL_MS = 10 * 60 * 1000
export const MAX_WRONG_TRIES = 5
export const RESEND_COOLDOWN_MS = 60 * 1000
export const MAX_SENDS_PER_HOUR = 5
export const SEND_WINDOW_MS = 60 * 60 * 1000
const MAX_EMAIL_LENGTH = 254

/** Hard cap on challenges; at the cap the OLDEST entry is evicted, listed or not. */
export const MAX_CHALLENGE_ENTRIES = 500
/**
 * Cap on per-email send logs (same blind LRU). 10x the challenge cap on
 * purpose: the send log carries the per-email 5-sends/hour cap, and evicting
 * it early is what would let a flood reset a real email's send budget.
 * Entries are a few timestamps each, so 5000 stays well under 1 MB.
 */
export const MAX_SEND_LOG_ENTRIES = 5000
/** Per client IP: code requests per rolling hour, across all emails. */
export const IP_MAX_REQUESTS_PER_HOUR = 10
/** Per client IP: failed verifies per rolling window, across all emails. */
export const IP_MAX_FAILED_VERIFIES = 10
export const IP_VERIFY_WINDOW_MS = 10 * 60 * 1000
/** Cap on tracked client IPs per pool (oldest evicted). */
export const MAX_IP_ENTRIES = 5000

export type RequestResult =
  | { status: 'sent'; code: string; expiresAt: number }
  /** Unlisted but well-formed email: a decoy was stored, nothing is sent. */
  | { status: 'decoy'; expiresAt: number }
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
  /** Decoy for an unlisted email: random hash, can never match. */
  decoy: boolean
}

interface SendLog {
  sends: number[]
  decoy: boolean
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

function wellFormedEmail(email: string): boolean {
  return !!email && email.length <= MAX_EMAIL_LENGTH && email.includes('@')
}

export type IpSource = 'true-client-ip' | 'cf-connecting-ip' | 'x-forwarded-for-rightmost' | 'none'

/**
 * THE one place that decides which header identifies the client for the
 * per-IP limits (security review 2026-10-22). Trusted sources only, in order:
 *   1. true-client-ip     — set by Cloudflare (Enterprise / Managed Transform)
 *   2. cf-connecting-ip   — set by Cloudflare on every proxied request
 *   3. RIGHT-MOST x-forwarded-for hop — the one appended by Render's proxy.
 *      The left-most hop is whatever the client sent, so it is never used.
 * Each candidate must pass node:net isIP; an invalid one falls through.
 * No usable IP ⇒ { ip: null }: the per-IP limits are SKIPPED for that request
 * (never a shared 'unknown' bucket an attacker could fill); the per-email
 * 5-try / 5-send / cooldown rules still apply.
 *
 * !! MUST BE CONFIRMED ON RENDER AFTER DEPLOY (G4): read the one-time
 * `[otp] ip_source=…` log line to see which header is actually populated. If
 * the service is not behind Cloudflare, a client could send its own
 * true-client-ip / cf-connecting-ip; in that case drop sources 1–2 here.
 */
export function resolveClientIp(headers: Headers | undefined | null): { ip: string | null; source: IpSource } {
  const valid = (v: string | null | undefined) => {
    const t = (v ?? '').trim()
    return t.length <= 45 && isIP(t) !== 0 ? t : null
  }
  const tci = valid(headers?.get('true-client-ip'))
  if (tci) return { ip: tci, source: 'true-client-ip' }
  const cf = valid(headers?.get('cf-connecting-ip'))
  if (cf) return { ip: cf, source: 'cf-connecting-ip' }
  const hops = (headers?.get('x-forwarded-for') ?? '').split(',')
  const last = valid(hops[hops.length - 1])
  if (last) return { ip: last, source: 'x-forwarded-for-rightmost' }
  return { ip: null, source: 'none' }
}

const IP_SOURCE_LOGGED = Symbol.for('mathquest.otpIpSourceLogged')

/** resolveClientIp + a one-time log of the SOURCE (never the IP value). */
export function clientIpFrom(headers: Headers | undefined | null): string | null {
  const { ip, source } = resolveClientIp(headers)
  const g = globalThis as typeof globalThis & { [IP_SOURCE_LOGGED]?: boolean }
  if (!g[IP_SOURCE_LOGGED]) {
    g[IP_SOURCE_LOGGED] = true
    console.info(`[otp] ip_source=${source}`)
  }
  return ip
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
    if (wellFormedEmail(email)) out.add(email)
  }
  return out
}

/** Rolling-window timestamps per key, pruned on read, insertion-order capped. */
function recentIn(map: Map<string, number[]>, key: string, t: number, windowMs: number): number[] {
  const hits = (map.get(key) ?? []).filter((s) => t - s < windowMs)
  if (hits.length) map.set(key, hits)
  else map.delete(key)
  return hits
}

function pushCapped(map: Map<string, number[]>, key: string, hits: number[], t: number, cap: number): void {
  map.delete(key) // re-insert at the end: Map order = least recently touched first
  map.set(key, [...hits, t])
  while (map.size > cap) {
    const oldest = map.keys().next().value
    if (oldest === undefined) break
    map.delete(oldest)
  }
}

/**
 * ANTI-ENUMERATION (security review 2026-10-22, finding 1): a well-formed
 * email that is NOT on the family list gets a DECOY challenge with the same
 * shape — random hash that can never match, same expiry, same tries counter,
 * same cooldown / hourly accounting — and no mail. verifyCode then walks the
 * identical path, so wrong_N / burned / expired / none and the request
 * cooldown / cap answer the same for listed and unlisted addresses.
 * Memory: at most MAX_CHALLENGE_ENTRIES challenges (and MAX_SEND_LOG_ENTRIES
 * send logs), evicted by a single blind LRU — oldest first, listed or not,
 * so eviction reveals nothing. RESIDUAL (accepted, same class as below): a
 * distributed flood of >500 fresh requests can evict a real pending code;
 * the family member then gets "none" and simply asks for a new code.
 *
 * LOCKOUT DoS (finding 2): per trusted client IP (resolveClientIp), ≤ 10 code requests per hour across
 * all emails and ≤ 10 failed verifies per 10 minutes. Once an IP is over the
 * verify limit its attempts are refused WITHOUT touching the email's 5
 * tries, and answer "burned" so it cannot probe. RESIDUAL RISK (accepted for
 * this family app): a distributed attacker who knows a family email can, from
 * ≥ 5 IPs, still burn the current code, and from enough IPs exhaust that
 * email's 5 sends/hour — locking that email out for ≤ 1 hour. No data is
 * exposed; the family waits or uses another listed address.
 */
export class OtpStore {
  private readonly challenges = new Map<string, Challenge>()
  private readonly sendLog = new Map<string, SendLog>()
  private readonly ipRequests = new Map<string, number[]>()
  private readonly ipFailures = new Map<string, number[]>()
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
    const log = this.sendLog.get(email)
    const sends = (log?.sends ?? []).filter((s) => t - s < SEND_WINDOW_MS)
    if (log && sends.length) log.sends = sends
    else this.sendLog.delete(email)
    return sends
  }

  /**
   * Blind LRU: evict the OLDEST entries (Map insertion order = creation
   * order, since every write deletes then re-inserts) until there is room.
   * Deliberately ignores decoy vs real, so eviction cannot reveal which
   * emails are listed.
   */
  private static evictOldest<V>(map: Map<string, V>, cap: number): void {
    while (map.size >= cap) {
      const oldest = map.keys().next().value
      if (oldest === undefined) break
      map.delete(oldest)
    }
  }

  /** `clientIp` null ⇒ no trusted client IP: per-IP limits skipped, per-email rules apply. */
  requestCode(rawEmail: unknown, allowlist: ReadonlySet<string>, clientIp: string | null = null): RequestResult {
    const t = this.now()
    if (clientIp) {
      const ipHits = recentIn(this.ipRequests, clientIp, t, SEND_WINDOW_MS)
      if (ipHits.length >= IP_MAX_REQUESTS_PER_HOUR) {
        return { status: 'rate-limited', retryInSec: Math.ceil((ipHits[0] + SEND_WINDOW_MS - t) / 1000) }
      }
      pushCapped(this.ipRequests, clientIp, ipHits, t, MAX_IP_ENTRIES)
    }

    const email = normalizeEmail(rawEmail)
    if (!wellFormedEmail(email)) return { status: 'not-allowed' } // stores nothing
    const decoy = !allowlist.has(email)
    const sends = this.recentSends(email, t)

    if (sends.length >= MAX_SENDS_PER_HOUR) {
      const oldest = sends[0]
      return { status: 'rate-limited', retryInSec: Math.ceil((oldest + SEND_WINDOW_MS - t) / 1000) }
    }
    const last = sends[sends.length - 1]
    if (last !== undefined && t - last < RESEND_COOLDOWN_MS) {
      return { status: 'cooldown', retryInSec: Math.ceil((last + RESEND_COOLDOWN_MS - t) / 1000) }
    }

    const expiresAt = t + CODE_TTL_MS
    let code = ''
    let codeHash: Buffer
    if (decoy) {
      codeHash = randomBytes(32) // an HMAC output that no input can be expected to produce
    } else {
      const n = this.randomCode()
      if (!Number.isInteger(n) || n < 0 || n >= 1_000_000) {
        throw new RangeError('randomCode must return an integer in [0, 1_000_000)')
      }
      code = String(n).padStart(6, '0')
      codeHash = this.hash(email, code)
    }
    // Replaces any prior code for this email: old digits stop working, tries reset.
    this.challenges.delete(email)
    OtpStore.evictOldest(this.challenges, MAX_CHALLENGE_ENTRIES)
    this.challenges.set(email, { codeHash, expiresAt, tries: 0, decoy })
    this.sendLog.delete(email)
    OtpStore.evictOldest(this.sendLog, MAX_SEND_LOG_ENTRIES)
    this.sendLog.set(email, { sends: [...sends, t], decoy })
    return decoy ? { status: 'decoy', expiresAt } : { status: 'sent', code, expiresAt }
  }

  /** `clientIp` null ⇒ no trusted client IP: per-IP limit skipped, per-email 5 tries apply. */
  verifyCode(rawEmail: unknown, rawCode: unknown, clientIp: string | null = null): VerifyResult {
    const t = this.now()
    const failures = clientIp ? recentIn(this.ipFailures, clientIp, t, IP_VERIFY_WINDOW_MS) : []
    // Over-limit IP: refused before the challenge is even looked at, so the
    // email's tries are untouched. Same outward code as a real burn.
    if (clientIp && failures.length >= IP_MAX_FAILED_VERIFIES) return { ok: false, reason: 'burned' }

    const result = this.check(normalizeEmail(rawEmail), rawCode, t)
    if (clientIp && !result.ok) pushCapped(this.ipFailures, clientIp, failures, t, MAX_IP_ENTRIES)
    return result
  }

  private check(email: string, rawCode: unknown, t: number): VerifyResult {
    const challenge = email ? this.challenges.get(email) : undefined
    if (!challenge) return { ok: false, reason: 'none' }

    if (challenge.tries >= MAX_WRONG_TRIES) return { ok: false, reason: 'burned' }
    if (t >= challenge.expiresAt) {
      this.challenges.delete(email)
      return { ok: false, reason: 'expired' }
    }

    // Tolerate "123 456" / "123-456" pasted from mail; anything else that is
    // not exactly 6 digits is still hashed and compared, so it counts as a try.
    // Decoys take this same path (hash + compare + tries).
    const code = String(rawCode ?? '').replace(/[\s-]/g, '')
    const candidate = this.hash(email, code)
    const match =
      timingSafeEqual(candidate, challenge.codeHash) && /^\d{6}$/.test(code) && !challenge.decoy

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
   * L99: drop expired challenges (decoys and burned ones included — burned
   * ones stay until expiry so they keep answering "burned", not "none"), send
   * logs whose every send is older than the rolling hour, and stale IP
   * windows. Returns how many map entries were removed.
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
    for (const ip of [...this.ipRequests.keys()]) {
      if (recentIn(this.ipRequests, ip, t, SEND_WINDOW_MS).length === 0) removed++
    }
    for (const ip of [...this.ipFailures.keys()]) {
      if (recentIn(this.ipFailures, ip, t, IP_VERIFY_WINDOW_MS).length === 0) removed++
    }
    return removed
  }

  /** Test/diagnostic helper — never exposed over HTTP. */
  hasChallenge(rawEmail: unknown): boolean {
    return this.challenges.has(normalizeEmail(rawEmail))
  }

  /** Test/diagnostic helper — stored per-email entries (challenges + send logs). */
  size(): { challenges: number; sendLogs: number } {
    return { challenges: this.challenges.size, sendLogs: this.sendLog.size }
  }

  /** Test/diagnostic helper — tracked client IPs per pool. */
  ipSize(): { requests: number; failures: number } {
    return { requests: this.ipRequests.size, failures: this.ipFailures.size }
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
