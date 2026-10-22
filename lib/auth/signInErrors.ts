/**
 * Maps an otpStore VerifyResult to the `code` the login page reads from
 * `signIn('credentials', { redirect: false })` → `result.code`.
 *
 * Contract (fixed with the login page):
 *   wrong_4 | wrong_3 | wrong_2 | wrong_1   — wrong digits, N tries left
 *   burned                                  — 5 wrong tries; ask for a new code
 *   expired                                 — older than 10 minutes
 *   none                                    — no code pending for that email
 *
 * Pure (no next-auth import) so it is unit-testable and Edge-neutral.
 */
import type { VerifyResult } from './otpStore'

export const SIGN_IN_ERROR_CODES = [
  'wrong_4',
  'wrong_3',
  'wrong_2',
  'wrong_1',
  'burned',
  'expired',
  'none',
] as const
export type SignInErrorCode = (typeof SIGN_IN_ERROR_CODES)[number]

export function signInErrorCode(result: Exclude<VerifyResult, { ok: true }>): SignInErrorCode {
  switch (result.reason) {
    case 'burned':
      return 'burned'
    case 'expired':
      return 'expired'
    case 'none':
      return 'none'
    case 'wrong': {
      const left = result.triesLeft ?? 0
      if (left >= 4) return 'wrong_4'
      if (left === 3) return 'wrong_3'
      if (left === 2) return 'wrong_2'
      if (left === 1) return 'wrong_1'
      return 'burned'
    }
  }
}
