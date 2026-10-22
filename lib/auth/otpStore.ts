/**
 * otpStore — email one-time-code challenges for MathQuest Worlds sign-in.
 *
 * Ported from the approved G1.5 prototype (mathquest-worlds-big-mult-otp,
 * lib/otp/otpStore.ts), then hardened through three security-review rounds
 * (2026-10-22). Pure TypeScript with node:crypto / node:net only — no Next,
 * no NextAuth, no mailer — so it is unit-tested with node:test. NEVER import
 * this from middleware.ts or anything the Edge middleware loads.
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
 *   - Constant-time compare (crypto.timingSafeEqual on two 32-byte digests),
 *     and exactly one HMAC on EVERY verify path, including "no challenge".
 *
 * Anti-enumeration (operator decision 2026-10-22): the sign-in surface exposes
 * ONE failure ('invalid', see signInErrors.ts) — no tries-left, no reason —
 * so a caller cannot tell a listed from an unlisted email. The reasons below
 * are internal only.
 *
 * Memory: challenges and send logs are keyed ONLY by allowlisted emails (an
 * unlisted email stores nothing), so both maps are bounded by the allowlist
 * size and real entries are NEVER evicted — no flood can drop a real code or
 * reset a real email's send cap. Only the per-IP rate-limit maps are capped
 * (oldest evicted): under a flood of >MAX_IP_ENTRIES distinct IPs that
 * weakens rate limiting, never touches a code.
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
import { normalizeEmail, parseAllowlist, wellFormedEmail } from './allowlist'

export { normalizeEmail, parseAllowlist }

export const CODE_TTL_MS = 10 * 60 * 1000
export const MAX_WRONG_TRIES = 5
export const RESEND_COOLDOWN_MS = 60 * 1000
export const MAX_SENDS_PER_HOUR = 5
export const SEND_WINDOW_MS = 60 * 60 * 1000

/** Per client IP: code requests per rolling hour, across all emails. */
export const IP_MAX_REQUESTS_PER_HOUR = 10
/** Per client IP: failed verifies per rolling window, across all emails. */
export const IP_MAX_FAILED_VERIFIES = 10
export const IP_VERIFY_WINDOW_MS = 10 * 60 * 1000
/** Cap on tracked client IPs per rate-limit pool (oldest evicted; codes unaffected). */
export const MAX_IP_ENTRIES = 5000

/**
 * Escalating per-email lock (operator decision 2026-10-22). Per allowlisted
 * email, only WRONG GUESSES against live codes count. Every
 * MAX_DAILY_FAILURES of them within a rolling DAILY_FAILURE_WINDOW_MS
 * triggers the next step of LOCK_LADDER_MS: 1st lock 1 h, 2nd 4 h, 3rd and
 * later 24 h. The count resets at each lock. The ladder returns to step 1
 * after LADDER_RESET_MS with no lock in force or triggered, measured from the
 * last lock's END (so a 24 h lock is never followed by a cheap 1 h one). The
 * family gets ONE notice per lock. All maps keyed by allowlisted emails only;
 * never evicted.
 */
export const MAX_DAILY_FAILURES = 30
export const DAILY_FAILURE_WINDOW_MS = 24 * 60 * 60 * 1000
export const LOCK_LADDER_MS: readonly number[] = [1, 4, 24].map((h) => h * 60 * 60 * 1000)
export const LADDER_RESET_MS = 24 * 60 * 60 * 1000

export type RequestResult =
  | { status: 'sent'; code: string; expiresAt: number }
  | { status: 'not-allowed' }
  | { status: 'cooldown'; retryInSec: number }
  | { status: 'rate-limited'; retryInSec: number }
  /** Allowlisted email under a failure lock (1 h / 4 h / 24 h ladder): no code is minted. */
  | { status: 'locked'; until: number }

/** Internal only — the sign-in surface collapses every failure to 'invalid'. */
export type VerifyResult =
  | { ok: true; email: string }
  | { ok: false; reason: 'expired' | 'wrong' | 'burned' | 'none' | 'locked'; triesLeft?: number }

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
  /**
   * Called ONCE each time an email enters a failure lock. Must not throw or
   * block (getOtpStore fires the notice mail detached).
   */
  onLock?: (email: string, until: number) => void
}

export type IpSource = 'cf-connecting-ip' | 'x-forwarded-for-rightmost' | 'none'

function validIp(v: string | null | undefined): string | null {
  const t = (v ?? '').trim()
  return t.length <= 45 && isIP(t) !== 0 ? t : null
}

function rightmost(v: string | null | undefined): string | null {
  const hops = (v ?? '').split(',')
  return validIp(hops[hops.length - 1])
}

/**
 * THE one place that decides which header identifies the client for the
 * per-IP limits.
 *
 * mathquest-worlds.onrender.com sits in Render's Cloudflare zone (security
 * review 2026-10-22: CNAME …cdn.cloudflare.net, `server: cloudflare`,
 * cf-ray). So:
 *   - DEFAULT: `cf-connecting-ip` — Cloudflare overwrites it on every
 *     request, so a client cannot choose it. Exactly one IP, no lists.
 *   - The right-most X-Forwarded-For hop may be a SHARED Cloudflare edge IP
 *     (unrelated clients would pool into one bucket); it is used only when
 *     TRUSTED_IP_HEADER=x-forwarded-for-rightmost.
 *   - `true-client-ip` is NEVER read (client-settable without Enterprise).
 * TRUSTED_IP_HEADER accepts only `cf-connecting-ip` or
 * `x-forwarded-for-rightmost`; any other value is ignored (default).
 *
 * No usable IP ⇒ { ip: null }: the per-IP limits are SKIPPED for that request
 * (never a shared bucket); the per-email rules still apply.
 *
 * !! CONFIRM ON RENDER AFTER DEPLOY (G4): read the one-time
 * `[otp] ip_source=… headers_present=… xff_rightmost_equals_cf_connecting_ip=…`
 * log line (names and a boolean only, never values).
 */
export function resolveClientIp(
  headers: Headers | undefined | null,
  trustedHeader?: string,
): { ip: string | null; source: IpSource } {
  const mode = (trustedHeader ?? '').trim().toLowerCase()
  if (mode === 'x-forwarded-for-rightmost') {
    const ip = rightmost(headers?.get('x-forwarded-for'))
    return ip ? { ip, source: 'x-forwarded-for-rightmost' } : { ip: null, source: 'none' }
  }
  const ip = validIp(headers?.get('cf-connecting-ip'))
  return ip ? { ip, source: 'cf-connecting-ip' } : { ip: null, source: 'none' }
}

const IP_SOURCE_LOGGED = Symbol.for('mathquest.otpIpSourceLogged')
const OBSERVED_HEADERS = ['true-client-ip', 'cf-connecting-ip', 'x-forwarded-for'] as const

/** Names of the candidate headers present + one boolean. Never a value. */
export function describeIpHeaders(headers: Headers | undefined | null): string {
  const present = OBSERVED_HEADERS.filter((h) => headers?.has(h)).join(',') || '(none)'
  const cf = validIp(headers?.get('cf-connecting-ip'))
  const xr = rightmost(headers?.get('x-forwarded-for'))
  return `headers_present=${present} xff_rightmost_equals_cf_connecting_ip=${!!cf && cf === xr}`
}

/**
 * resolveClientIp with TRUSTED_IP_HEADER from the env, plus a one-time log of
 * the source, the candidate header NAMES present and whether the right-most
 * XFF hop equals cf-connecting-ip — so G4 can confirm the choice.
 */
export function clientIpFrom(headers: Headers | undefined | null): string | null {
  const { ip, source } = resolveClientIp(headers, process.env.TRUSTED_IP_HEADER)
  const g = globalThis as typeof globalThis & { [IP_SOURCE_LOGGED]?: boolean }
  if (!g[IP_SOURCE_LOGGED]) {
    g[IP_SOURCE_LOGGED] = true
    console.info(`[otp] ip_source=${source} ${describeIpHeaders(headers)}`)
  }
  return ip
}

/** Rolling-window timestamps per key, pruned on read. */
function recentIn(map: Map<string, number[]>, key: string, t: number, windowMs: number): number[] {
  const hits = (map.get(key) ?? []).filter((s) => t - s < windowMs)
  if (hits.length) map.set(key, hits)
  else map.delete(key)
  return hits
}

/** Append a hit; IP maps only — oldest key evicted past the cap. */
function pushCapped(map: Map<string, number[]>, key: string, hits: number[], t: number, cap: number): void {
  map.delete(key)
  map.set(key, [...hits, t])
  while (map.size > cap) {
    const oldest = map.keys().next().value
    if (oldest === undefined) break
    map.delete(oldest)
  }
}

/**
 * LOCKOUT DoS: per trusted client IP (resolveClientIp — cf-connecting-ip), ≤ 10 code requests per
 * hour across all emails and ≤ 10 failed verifies per 10 minutes. Once an IP
 * is over the verify limit its attempts are refused WITHOUT touching the
 * email's 5 tries.
 *
 * RESIDUAL RISK (accepted, escalating lock per operator 2026-10-22): a
 * SINGLE attacker who knows a family email can lock NEW sign-ins for that
 * email and keep renewing the lock — 1 h the first time, 4 h the second,
 * then 24 h each time while the attack continues. Each lock takes 30 wrong
 * guesses against live codes (>= 6 requested codes, which the 5-sends/hour
 * cap and the per-IP limits stretch over more than an hour), but one IP is
 * enough. Existing sessions are unaffected (only new sign-ins are blocked),
 * the family gets ONE notice email per lock, and no data is exposed. Shorter
 * effects: burning the current code, or using up the email's 5 sends/hour.
 */
export class OtpStore {
  /** Keyed ONLY by allowlisted emails. */
  private readonly challenges = new Map<string, Challenge>()
  /** Keyed ONLY by allowlisted emails. */
  private readonly sendLog = new Map<string, number[]>()
  /** Keyed ONLY by allowlisted emails (a real challenge must have existed). */
  private readonly dailyFailures = new Map<string, number[]>()
  /** Keyed ONLY by allowlisted emails: lock end, epoch ms. */
  private readonly lockouts = new Map<string, number>()
  /** Keyed ONLY by allowlisted emails: ladder step of the last lock and when it ends. */
  private readonly ladder = new Map<string, { step: number; lastLockEnd: number }>()
  private readonly ipRequests = new Map<string, number[]>()
  private readonly ipFailures = new Map<string, number[]>()
  private readonly now: () => number
  private readonly randomCode: () => number
  private readonly hashKey: Buffer
  private readonly onLock?: (email: string, until: number) => void
  /** Compared against when there is no challenge, so every path does the same work. */
  private readonly dummyHash: Buffer

  constructor(opts: OtpStoreOptions = {}) {
    this.now = opts.now ?? Date.now
    this.randomCode = opts.randomCode ?? (() => randomInt(0, 1_000_000))
    this.hashKey = opts.hashKey ?? randomBytes(32)
    this.dummyHash = randomBytes(32)
    this.onLock = opts.onLock
  }

  private isLocked(email: string, t: number): boolean {
    const until = this.lockouts.get(email)
    if (until === undefined) return false
    if (t < until) return true
    this.lockouts.delete(email)
    return false
  }

  /** A failed verify against a REAL challenge (so `email` is allowlisted). */
  private recordDailyFailure(email: string, t: number): void {
    const hits = recentIn(this.dailyFailures, email, t, DAILY_FAILURE_WINDOW_MS)
    hits.push(t)
    this.dailyFailures.set(email, hits)
    if (hits.length >= MAX_DAILY_FAILURES && !this.isLocked(email, t)) {
      const prev = this.ladder.get(email)
      const step = prev && t - prev.lastLockEnd < LADDER_RESET_MS ? prev.step + 1 : 0
      const until = t + LOCK_LADDER_MS[Math.min(step, LOCK_LADDER_MS.length - 1)]
      this.lockouts.set(email, until)
      this.ladder.set(email, { step, lastLockEnd: until })
      this.dailyFailures.delete(email) // the next step needs a fresh 30
      this.challenges.delete(email) // the pending code dies with the lock
      try {
        this.onLock?.(email, until)
      } catch {
        // a notifier failure must never change the sign-in outcome
      }
    }
  }

  protected hash(email: string, code: string): Buffer {
    return createHmac('sha256', this.hashKey).update(`${email}\n${code}`).digest()
  }

  /** Sends within the rolling hour, pruned in place. */
  private recentSends(email: string, t: number): number[] {
    return recentIn(this.sendLog, email, t, SEND_WINDOW_MS)
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
    // Unlisted or malformed: store NOTHING (no challenge, no send log).
    if (!wellFormedEmail(email) || !allowlist.has(email)) return { status: 'not-allowed' }
    if (this.isLocked(email, t)) return { status: 'locked', until: this.lockouts.get(email) as number }

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

  /** `clientIp` null ⇒ no trusted client IP: per-IP limit skipped, per-email 5 tries apply. */
  verifyCode(rawEmail: unknown, rawCode: unknown, clientIp: string | null = null): VerifyResult {
    const t = this.now()
    const email = normalizeEmail(rawEmail)
    // Tolerate "123 456" / "123-456" pasted from mail; anything else that is
    // not exactly 6 digits is still hashed and compared, so it counts as a try.
    const code = String(rawCode ?? '').replace(/[\s-]/g, '')
    // Constant work: exactly one HMAC + one constant-time compare on EVERY
    // path (over-limit IP, no challenge, burned, expired, wrong, right).
    const candidate = this.hash(email, code)
    const challenge = email ? this.challenges.get(email) : undefined
    const equal = timingSafeEqual(candidate, challenge?.codeHash ?? this.dummyHash)

    const failures = clientIp ? recentIn(this.ipFailures, clientIp, t, IP_VERIFY_WINDOW_MS) : []
    const fail = (r: VerifyResult): VerifyResult => {
      if (clientIp) pushCapped(this.ipFailures, clientIp, failures, t, MAX_IP_ENTRIES)
      return r
    }
    // Over-limit IP: refused before the challenge is touched, so the email's
    // tries are untouched.
    if (clientIp && failures.length >= IP_MAX_FAILED_VERIFIES) return { ok: false, reason: 'burned' }
    // Failure lock: refused, not counted again (one notice per lock).
    if (email && this.isLocked(email, t)) return fail({ ok: false, reason: 'locked' })

    if (!challenge) return fail({ ok: false, reason: 'none' })
    // Burned / expired: refused, NOT counted toward the 24 h lock — only a
    // real guess against a live code counts (review: lockout amplification).
    if (challenge.tries >= MAX_WRONG_TRIES) return fail({ ok: false, reason: 'burned' })
    if (t >= challenge.expiresAt) {
      this.challenges.delete(email)
      return fail({ ok: false, reason: 'expired' })
    }
    if (equal && /^\d{6}$/.test(code)) {
      this.challenges.delete(email) // single use
      return { ok: true, email }
    }
    // The ONLY place a daily failure is counted: a wrong guess against a live,
    // unexpired, not-yet-burned code — at most MAX_WRONG_TRIES per issued code,
    // so MAX_DAILY_FAILURES needs >= 6 codes, which the 5-sends/hour cap
    // stretches over more than an hour.
    challenge.tries += 1
    const triesLeft = MAX_WRONG_TRIES - challenge.tries
    this.recordDailyFailure(email, t)
    return fail(triesLeft <= 0 ? { ok: false, reason: 'burned', triesLeft: 0 } : { ok: false, reason: 'wrong', triesLeft })
  }

  /**
   * L99: drop expired challenges (burned ones stay until expiry), send logs
   * whose every send is older than the rolling hour, and stale IP windows.
   * Returns how many map entries were removed.
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
    const prune = (map: Map<string, number[]>, windowMs: number) => {
      for (const key of [...map.keys()]) if (recentIn(map, key, t, windowMs).length === 0) removed++
    }
    prune(this.sendLog, SEND_WINDOW_MS)
    prune(this.dailyFailures, DAILY_FAILURE_WINDOW_MS)
    for (const [email, until] of this.lockouts) {
      if (t >= until) {
        this.lockouts.delete(email)
        removed++
      }
    }
    for (const [email, l] of this.ladder) {
      if (t - l.lastLockEnd >= LADDER_RESET_MS) {
        this.ladder.delete(email)
        removed++
      }
    }
    prune(this.ipRequests, SEND_WINDOW_MS)
    prune(this.ipFailures, IP_VERIFY_WINDOW_MS)
    return removed
  }

  /**
   * Invariant check (tests / diagnostics): every key in the code and
   * send-log maps is on the allowlist. Throws otherwise.
   */
  assertBoundedBy(allowlist: ReadonlySet<string>): void {
    for (const key of [
      ...this.challenges.keys(),
      ...this.sendLog.keys(),
      ...this.dailyFailures.keys(),
      ...this.lockouts.keys(),
      ...this.ladder.keys(),
    ]) {
      if (!allowlist.has(key)) throw new Error('otpStore invariant: an entry is not on the allowlist')
    }
  }

  /** Test/diagnostic helper — never exposed over HTTP. */
  hasChallenge(rawEmail: unknown): boolean {
    return this.challenges.has(normalizeEmail(rawEmail))
  }

  /** Test/diagnostic helper — stored per-email entries (challenges + send logs). */
  size(): { challenges: number; sendLogs: number } {
    return { challenges: this.challenges.size, sendLogs: this.sendLog.size }
  }

  /** Test/diagnostic helper — failures counted toward the 24 h lock for one email. */
  dailyFailureCount(rawEmail: unknown): number {
    const email = normalizeEmail(rawEmail)
    return recentIn(this.dailyFailures, email, this.now(), DAILY_FAILURE_WINDOW_MS).length
  }

  /** Test/diagnostic helper — per-email failure windows and active locks. */
  lockSize(): { dailyFailures: number; lockouts: number; ladder: number } {
    return { dailyFailures: this.dailyFailures.size, lockouts: this.lockouts.size, ladder: this.ladder.size }
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
 * Playwright. In a production build the caller below receives the inlined
 * literal `NODE_ENV:"production"` (seen in .next/server/chunks), so the hook
 * is unreachable in production whatever env vars the service carries — the
 * code is still present in the bundle; it just can never be selected.
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
      // One notice per lock, detached. Dynamic import keeps nodemailer out of
      // this module's static graph; sendLockNotice never rejects.
      onLock: (email, until) => {
        void import('./mailer')
          .then((m) => m.sendLockNotice(email, until))
          .catch(() => console.error('[otp-lock] notice task failed'))
      },
    })
    const timer = setInterval(() => store.sweepExpired(), SWEEP_INTERVAL_MS)
    timer.unref?.() // never keeps the process (or a test run) alive
    g[GLOBAL_KEY] = store
  }
  return g[GLOBAL_KEY]
}
