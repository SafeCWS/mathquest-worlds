import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import crypto from 'node:crypto'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null
        const email = String(credentials.email ?? '')
          .toLowerCase()
          .trim()
        const password = String(credentials.password ?? '')
        const expectedEmail = (process.env.SIMPLE_AUTH_EMAIL ?? '')
          .toLowerCase()
          .trim()
        const expectedPassword = process.env.SIMPLE_AUTH_PASSWORD ?? ''
        if (!expectedEmail || !expectedPassword) return null
        if (email !== expectedEmail) return null
        // Constant-time password comparison to avoid timing-side-channel
        // leakage. Overkill for a single-user family app but costs nothing.
        const aBuf = Buffer.from(password, 'utf8')
        const bBuf = Buffer.from(expectedPassword, 'utf8')
        if (aBuf.length !== bBuf.length) return null
        if (!crypto.timingSafeEqual(aBuf, bBuf)) return null
        return { id: email, email }
      },
    }),
  ],
  callbacks: {
    authorized: ({ auth }) => !!auth,
    async session({ session, token }) {
      if (token.email) session.user.email = token.email
      return session
    },
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
})
