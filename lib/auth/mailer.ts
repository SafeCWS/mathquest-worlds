/**
 * mailer — sends the MathQuest sign-in code by Gmail SMTP.
 *
 * - Sender is the fleet constant airecruiter@ (not a secret). The password is
 *   GMAIL_APP_PASSWORD from the process env (set on Render). It is never
 *   logged, never returned, never put in an error message.
 * - L92: try implicit TLS on 465 first, fall back to STARTTLS on 587.
 * - Subject puts the code FIRST ("Your MathQuest code: 123456") so iOS / macOS
 *   one-time-code autofill offers it from the notification.
 * - English only (operator ruling: new MathQuest features are English-only).
 * - Unset password ⇒ warn and skip; never throws for that case.
 * - Logs never contain the code or ANY form of the address (review MEDIUM:
 *   even a masked address tells a log reader who is on the family list).
 *   Proof-of-life is one line per send outcome:
 *   `[otp-mail] result=sent|failed|skipped transport=465|587|none`.
 *
 * Node runtime only (nodemailer uses net/tls). Never import from middleware.
 */
import nodemailer from 'nodemailer'

export const SMTP_USER = 'airecruiter@customworkforcesolutionsllc.com'
export const SMTP_HOST = 'smtp.gmail.com'
const FROM = `MathQuest Worlds <${SMTP_USER}>`

export interface OtpMail {
  subject: string
  text: string
  html: string
}

export function buildOtpMail(code: string, ttlMinutes: number): OtpMail {
  if (!/^\d{6}$/.test(code)) throw new RangeError('code must be 6 digits')
  const subject = `Your MathQuest code: ${code}`
  const text = [
    `Your MathQuest sign-in code is ${code}.`,
    '',
    `It works for ${ttlMinutes} minutes, one time only.`,
    "If you did not ask for it, you can ignore this email. Nobody can sign in without the code.",
  ].join('\n')
  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1f2937;background:#ffffff">
<p style="font-size:16px;margin:0 0 12px">Your MathQuest sign-in code is</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:0 0 16px">${code}</p>
<p style="font-size:14px;margin:0 0 8px">It works for ${ttlMinutes} minutes, one time only.</p>
<p style="font-size:13px;color:#6b7280;margin:0">If you did not ask for it, you can ignore this email. Nobody can sign in without the code.</p>
</body></html>`
  return { subject, text, html }
}

type SendFn = (opts: { port: number; secure: boolean; to: string; mail: OtpMail; pass: string }) => Promise<void>

const smtpSend: SendFn = async ({ port, secure, to, mail, pass }) => {
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    requireTLS: !secure,
    auth: { user: SMTP_USER, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
  try {
    await transport.sendMail({ from: FROM, to, subject: mail.subject, text: mail.text, html: mail.html })
  } finally {
    transport.close()
  }
}

export interface Logger {
  info: (msg: string) => void
  warn: (msg: string) => void
  error: (msg: string) => void
}

export type SendOutcome = 'sent-465' | 'sent-587' | 'skipped-no-password' | 'failed'

export interface SendDeps {
  pass?: string
  send?: SendFn
  log?: Logger
}

/**
 * L92 delivery: 465 implicit TLS, then 587 STARTTLS. Resolves (never
 * rejects), so a fire-and-forget caller cannot produce an unhandled
 * rejection. Exactly ONE log line per call, carrying the outcome, the
 * transport and an error class — never an address, a code or a password.
 */
async function deliver(to: string, build: () => OtpMail, kind: string, deps: SendDeps): Promise<SendOutcome> {
  const log = deps.log ?? console
  const pass = deps.pass ?? process.env.GMAIL_APP_PASSWORD
  if (!pass) {
    log.warn(`[${kind}] result=skipped transport=none reason=no_password`)
    return 'skipped-no-password'
  }
  const send = deps.send ?? smtpSend
  let mail: OtpMail
  try {
    mail = build()
  } catch {
    log.error(`[${kind}] result=failed transport=none reason=bad_mail`)
    return 'failed'
  }
  let fallbackFrom = ''
  try {
    await send({ port: 465, secure: true, to, mail, pass })
    log.info(`[${kind}] result=sent transport=465`)
    return 'sent-465'
  } catch (e) {
    fallbackFrom = errName(e)
  }
  try {
    await send({ port: 587, secure: false, to, mail, pass })
    log.info(`[${kind}] result=sent transport=587 fallback_from_465=${fallbackFrom}`)
    return 'sent-587'
  } catch (e) {
    log.error(`[${kind}] result=failed transport=587 err=${errName(e)}`)
    return 'failed'
  }
}

/** Send the sign-in code. */
export function sendOtpMail(to: string, code: string, ttlMinutes: number, deps: SendDeps = {}): Promise<SendOutcome> {
  return deliver(to, () => buildOtpMail(code, ttlMinutes), 'otp-mail', deps)
}

export const DEFAULT_NOTICE_TIMEZONE = 'America/Bogota'
const DEFAULT_NOTICE_LABEL = 'Colombia time'

/** True when `zone` is an IANA time zone this runtime's Intl knows. */
function validTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone })
    return true
  } catch {
    return false
  }
}

function noticeZone(zone: string | undefined): { tz: string; label: string } {
  const wanted = (zone ?? '').trim()
  const tz = wanted && validTimeZone(wanted) ? wanted : DEFAULT_NOTICE_TIMEZONE
  return { tz, label: tz === DEFAULT_NOTICE_TIMEZONE ? DEFAULT_NOTICE_LABEL : tz }
}

/** ICU may put U+202F / U+00A0 before "PM"; mail clients render plain spaces best. */
function plainSpaces(s: string): string {
  return s.replace(/[  ]/g, ' ')
}

/**
 * The lock end shown in the notice body, e.g.
 * "Friday, Oct 23, 3:15 PM Colombia time".
 *
 * Zone: env OTP_NOTICE_TIMEZONE (an IANA name, validated with Intl), default
 * America/Bogota — the operator is in Colombia (UTC-5 all year, no DST).
 * The default is labelled "Colombia time"; any other zone is labelled by its
 * IANA name. An invalid value falls back to the default and never throws.
 */
export function formatNoticeTime(epochMs: number, zone: string | undefined = process.env.OTP_NOTICE_TIMEZONE): string {
  const { tz, label } = noticeZone(zone)
  const s = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(epochMs))
  return `${plainSpaces(s).replace(' at ', ', ')} ${label}`
}

/** The short lock end for the subject line, e.g. "Fri 3:15 PM" (same zone, no label). */
export function noticeSubjectTime(epochMs: number, zone: string | undefined = process.env.OTP_NOTICE_TIMEZONE): string {
  const { tz } = noticeZone(zone)
  const s = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(epochMs))
  return plainSpaces(s)
}

/**
 * The ONE notice sent when an email enters a sign-in lock. English only,
 * no code, `until` = the lock end. Wording chosen by the operator 2026-10-22.
 */
export function buildLockNoticeMail(until: number): OtpMail {
  const when = formatNoticeTime(until)
  const subject = `MathQuest sign-in paused until ${noticeSubjectTime(until)}`
  const safe =
    'Your account is safe. Nobody can sign in without a code sent to this inbox. ' +
    "If this wasn't you, you don't need to do anything."
  const text = `There were too many wrong codes for your email today, so sign-in is paused until ${when}. ${safe}\n`
  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1f2937;background:#ffffff">
<p style="font-size:16px;margin:0 0 12px">There were too many wrong codes for your email today, so sign-in is paused until <strong>${when}</strong>.</p>
<p style="font-size:14px;margin:0">${safe.replace(/'/g, '&#39;')}</p>
</body></html>`
  return { subject, text, html }
}

/** Send the lock notice. Never rejects. */
export function sendLockNotice(to: string, until: number, deps: SendDeps = {}): Promise<SendOutcome> {
  return deliver(to, () => buildLockNoticeMail(until), 'otp-lock-mail', deps)
}

/**
 * Only the error's class / code — never its message. SMTP auth errors can echo
 * server responses, and we never want the code, the address or any auth
 * material in a log line.
 */
function errName(e: unknown): string {
  if (e && typeof e === 'object') {
    const code = (e as { code?: unknown }).code
    const name = (e as { name?: unknown }).name
    return [typeof name === 'string' ? name : 'Error', typeof code === 'string' ? code : '']
      .filter(Boolean)
      .join(':')
  }
  return 'Error'
}
