/**
 * The ONE code the login page reads from
 * `signIn('credentials', { redirect: false })` → `result.code` on failure.
 *
 * Operator decision 2026-10-22: a wrong code shows one generic message — no
 * "N tries left", no burned/expired distinction — so the sign-in surface
 * cannot reveal whether an email is on the family list. Wrong, burned,
 * expired, no code pending and IP-over-limit all map to 'invalid'. The
 * 5-try burn, expiry and single use still apply internally (otpStore).
 *
 * Pure (no next-auth import) so it is unit-testable and Edge-neutral.
 */
import type { VerifyResult } from './otpStore'

export const SIGN_IN_ERROR_CODES = ['invalid'] as const
export type SignInErrorCode = (typeof SIGN_IN_ERROR_CODES)[number]

export function signInErrorCode(result: Exclude<VerifyResult, { ok: true }>): SignInErrorCode {
  void result // deliberately ignored: the reason must never reach the client
  return 'invalid'
}
