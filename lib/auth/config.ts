/**
 * Edge-safe NextAuth config, shared by middleware.ts (Edge) and auth.ts (Node).
 *
 * NO providers here and NO imports beyond next-auth types: the middleware
 * bundle must never pull in node:crypto (otpStore) or nodemailer (mailer).
 * The Credentials provider that verifies codes lives only in auth.ts, which
 * the middleware does not import. The middleware only needs to decode the
 * JWT session cookie, which uses AUTH_SECRET and these callbacks.
 */
import type { NextAuthConfig } from 'next-auth'

export const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60

export const authConfig = {
  providers: [],
  callbacks: {
    authorized: ({ auth }) => !!auth,
    async session({ session, token }) {
      if (token.email) session.user.email = token.email
      return session
    },
  },
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SEC },
  pages: { signIn: '/login' },
} satisfies NextAuthConfig
