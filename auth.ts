import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// Edge-safe constant-time string equality (Edge runtime has no node:crypto
// and no Web Crypto timingSafeEqual). Classic XOR-accumulator idiom.
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

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
        if (!constantTimeEqual(password, expectedPassword)) return null
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
