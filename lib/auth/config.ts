/**
 * Edge-safe NextAuth config, shared by middleware.ts (Edge) and auth.ts (Node).
 *
 * NO providers here and NO imports beyond next-auth types and the import-free
 * ./allowlist: the middleware bundle must never pull in node:crypto
 * (otpStore) or nodemailer (mailer).
 * The Credentials provider that verifies codes lives only in auth.ts, which
 * the middleware does not import. The middleware only needs to decode the
 * JWT session cookie, which uses AUTH_SECRET and these callbacks.
 */
import type { NextAuthConfig } from 'next-auth'
import { currentAllowlist, normalizeEmail } from './allowlist'

export const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60

export const authConfig = {
  providers: [],
  callbacks: {
    authorized: ({ auth }) => !!auth,
    // Review LOW-8: a session lives 30 days, so removing someone from
    // SIMPLE_AUTH_USERS must end it on their next request. Returning null
    // makes Auth.js clear the session cookie. Runs in the Edge middleware and
    // in the Node handlers alike (this config is spread into auth.ts).
    async jwt({ token }) {
      const email = normalizeEmail(token?.email)
      if (!email || !currentAllowlist().has(email)) return null
      return token
    },
    async session({ session, token }) {
      if (token.email) session.user.email = token.email
      return session
    },
  },
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SEC },
  pages: { signIn: '/login' },
} satisfies NextAuthConfig
