/**
 * The body of the NextAuth Credentials `authorize`, kept free of next-auth so
 * it is unit-tested. auth.ts turns `{ ok:false, code }` into a thrown
 * CredentialsSignin whose `code` the login page reads.
 *
 * The client IP comes from the Request NextAuth passes as authorize's second
 * argument, so the per-IP verify limit applies to real sign-in attempts.
 */
import { clientIpFrom, getOtpStore, type OtpStore } from './otpStore'
import { signInErrorCode, type SignInErrorCode } from './signInErrors'

export type AuthorizeOutcome =
  | { ok: true; user: { id: string; email: string } }
  | { ok: false; code: SignInErrorCode }

export function authorizeOtp(
  credentials: Partial<Record<string, unknown>> | undefined,
  request: Request | undefined,
  store: OtpStore = getOtpStore(),
): AuthorizeOutcome {
  const result = store.verifyCode(credentials?.email, credentials?.code, clientIpFrom(request?.headers))
  if (result.ok) return { ok: true, user: { id: result.email, email: result.email } }
  return { ok: false, code: signInErrorCode(result) }
}
