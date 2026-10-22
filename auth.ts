import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from '@/lib/auth/config'
import { getOtpStore } from '@/lib/auth/otpStore'
import { signInErrorCode, type SignInErrorCode } from '@/lib/auth/signInErrors'

// Email one-time-code sign-in. Flow:
//   1. POST /api/otp/request {email}  → mails a 6-digit code (allowlist =
//      SIMPLE_AUTH_USERS emails; malformed env ⇒ empty set ⇒ nobody).
//   2. signIn('credentials', {email, code, redirect:false}) → authorize below.
// There is no secret-phrase login and no legacy single-user env fallback, and
// NO standalone verify route (one would let a caller burn or consume a code
// without signing in).
//
// Node runtime only: this module imports otpStore (node:crypto). middleware.ts
// must keep building its own NextAuth(authConfig) and never import '@/auth'.

/** Thrown on a failed code; the login page reads `result.code`. */
class OtpSignInError extends CredentialsSignin {
  constructor(code: SignInErrorCode) {
    super()
    this.code = code
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        const result = getOtpStore().verifyCode(credentials?.email, credentials?.code)
        if (result.ok) return { id: result.email, email: result.email }
        throw new OtpSignInError(signInErrorCode(result))
      },
    }),
  ],
})
