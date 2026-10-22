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
 * - Logs never contain the code or the full address (maskEmail).
 *
 * Node runtime only (nodemailer uses net/tls). Never import from middleware.
 */
import nodemailer from 'nodemailer'

export const SMTP_USER = 'airecruiter@customworkforcesolutionsllc.com'
export const SMTP_HOST = 'smtp.gmail.com'
const FROM = `MathQuest Worlds <${SMTP_USER}>`

/** "tina@example.com" → "t***@example.com". Never logs a full address. */
export function maskEmail(raw: string): string {
  const email = String(raw ?? '')
  const at = email.lastIndexOf('@')
  if (at < 1) return '***'
  return `${email[0]}***${email.slice(at)}`
}

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
  warn: (msg: string) => void
  error: (msg: string) => void
}

export type SendOutcome = 'sent-465' | 'sent-587' | 'skipped-no-password' | 'failed'

/**
 * Send the code. Resolves (never rejects) with what happened, so a
 * fire-and-forget caller cannot produce an unhandled rejection.
 */
export async function sendOtpMail(
  to: string,
  code: string,
  ttlMinutes: number,
  deps: { pass?: string; send?: SendFn; log?: Logger } = {},
): Promise<SendOutcome> {
  const log = deps.log ?? console
  const pass = deps.pass ?? process.env.GMAIL_APP_PASSWORD
  const masked = maskEmail(to)
  if (!pass) {
    log.warn(`[otp-mail] GMAIL_APP_PASSWORD unset; code not sent to ${masked}`)
    return 'skipped-no-password'
  }
  const send = deps.send ?? smtpSend
  let mail: OtpMail
  try {
    mail = buildOtpMail(code, ttlMinutes)
  } catch {
    log.error(`[otp-mail] refused to build mail for ${masked}: bad code shape`)
    return 'failed'
  }
  try {
    await send({ port: 465, secure: true, to, mail, pass })
    return 'sent-465'
  } catch (e) {
    log.warn(`[otp-mail] 465 failed for ${masked} (${errName(e)}); trying 587`)
  }
  try {
    await send({ port: 587, secure: false, to, mail, pass })
    return 'sent-587'
  } catch (e) {
    log.error(`[otp-mail] 587 failed for ${masked} (${errName(e)}); code not delivered`)
    return 'failed'
  }
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
