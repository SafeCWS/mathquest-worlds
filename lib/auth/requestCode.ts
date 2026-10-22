/**
 * Core of POST /api/otp/request, kept out of the route file so it can be
 * tested with injected clock / sleep / mailer.
 *
 * Anti-enumeration (L99 shape + L162 latency):
 *   - The body is IDENTICAL for every outcome: allowlisted, not allowlisted,
 *     cooldown, hourly cap, malformed body. No code echo, no status.
 *   - The response is held until a fixed floor measured from request start,
 *     whatever the path took. The mail is NOT awaited: it is started after
 *     the outcome is decided and runs detached, so SMTP latency (the only
 *     slow branch, ~0.6–1 s) never reaches the response time.
 *   - Mail failures are logged server-side by the mailer with a masked
 *     address and never the code.
 */
import { clientIpFrom, CODE_TTL_MS, getOtpStore, parseAllowlist, type OtpStore } from './otpStore'
import { sendOtpMail } from './mailer'

export const PUBLIC_MESSAGE = 'If that email is on the family list, a code is on its way.'
export const RESEND_AFTER_SEC = 60
/**
 * Fixed floor. The decided-path work is a synchronous Map lookup + HMAC
 * (sub-millisecond on every branch) because the mail is detached, so the
 * floor only has to cover JSON parsing jitter, not SMTP. 600 ms per the DO
 * brief; raise it if a timing probe ever shows a >50 ms branch delta.
 */
export const TIMING_FLOOR_MS = 600
export const MAX_BODY_BYTES = 2048

export const PUBLIC_BODY = Object.freeze({
  ok: true as const,
  message: PUBLIC_MESSAGE,
  resendAfterSec: RESEND_AFTER_SEC,
})

export interface RequestCodeDeps {
  store?: OtpStore
  allowlistJson?: string | undefined
  now?: () => number
  sleep?: (ms: number) => Promise<void>
  sendMail?: (to: string, code: string, ttlMinutes: number) => Promise<unknown>
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * Read at most MAX_BODY_BYTES (security review 2026-10-22, finding 3):
 *   1. a declared Content-Length over the cap is refused before any read;
 *   2. otherwise the body is read as a stream and the read is cancelled as
 *      soon as the running total passes the cap — a missing or lying
 *      Content-Length cannot make us buffer more than the cap.
 * Returns null when the body is over the cap or unreadable.
 */
export async function readCappedBody(req: Request, cap = MAX_BODY_BYTES): Promise<string | null> {
  const declared = req.headers.get('content-length')
  if (declared !== null) {
    const n = Number(declared)
    if (!Number.isFinite(n) || n < 0 || n > cap) return null
  }
  if (!req.body) return ''
  const reader = req.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > cap) {
        await reader.cancel().catch(() => {})
        return null
      }
      chunks.push(value)
    }
  } catch {
    return null
  } finally {
    reader.releaseLock()
  }
  const buf = new Uint8Array(total)
  let off = 0
  for (const c of chunks) {
    buf.set(c, off)
    off += c.byteLength
  }
  return new TextDecoder().decode(buf)
}

async function readEmail(req: Request): Promise<unknown> {
  const raw = await readCappedBody(req)
  if (raw === null) return ''
  try {
    const body: unknown = JSON.parse(raw)
    if (body && typeof body === 'object') return (body as { email?: unknown }).email
  } catch {
    // Malformed body is treated like an unknown email: same answer, nothing stored.
  }
  return ''
}

export async function handleRequestCode(req: Request, deps: RequestCodeDeps = {}): Promise<Response> {
  const now = deps.now ?? Date.now
  const start = now()
  const sleep = deps.sleep ?? realSleep

  try {
    const email = await readEmail(req)
    const store = deps.store ?? getOtpStore()
    const allowlist = parseAllowlist(
      'allowlistJson' in deps ? deps.allowlistJson : process.env.SIMPLE_AUTH_USERS,
    )
    const result = store.requestCode(email, allowlist, clientIpFrom(req.headers))

    if (result.status === 'sent') {
      const to = String(email).toLowerCase().trim()
      const send = deps.sendMail ?? sendOtpMail
      // Fire-and-forget. sendOtpMail never rejects; the catch is belt only
      // for an injected sender, and logs nothing identifying.
      void Promise.resolve()
        .then(() => send(to, result.code, CODE_TTL_MS / 60_000))
        .catch(() => console.error('[otp-request] mail task failed'))
    }
  } catch {
    // Any unexpected failure still answers with the same body and timing.
    console.error('[otp-request] unexpected error; answered with the public body')
  }

  const remaining = TIMING_FLOOR_MS - (now() - start)
  if (remaining > 0) await sleep(remaining)

  return Response.json(PUBLIC_BODY, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
