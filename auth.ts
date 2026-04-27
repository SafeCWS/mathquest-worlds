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
        if (!email || !password) return null

        // Multi-user mode (preferred): SIMPLE_AUTH_USERS is a JSON array
        // of {email, password} objects. Each user gets its own credential.
        // Adding/removing users = update env var + redeploy.
        const usersJson = process.env.SIMPLE_AUTH_USERS ?? ''
        if (usersJson.trim()) {
          let users: Array<{ email?: unknown; password?: unknown }> = []
          try {
            const parsed: unknown = JSON.parse(usersJson)
            if (Array.isArray(parsed)) users = parsed
          } catch {
            // Malformed JSON — fall through to legacy single-user fallback
            // rather than locking everyone out. This is intentional: a
            // typo in the env var should not be a global lockout event.
            users = []
          }
          if (users.length > 0) {
            for (const u of users) {
              const uEmail = String(u?.email ?? '')
                .toLowerCase()
                .trim()
              const uPassword = String(u?.password ?? '')
              if (!uEmail || !uPassword) continue
              if (email !== uEmail) continue
              if (!constantTimeEqual(password, uPassword)) continue
              return { id: email, email }
            }
            // Matched the multi-user code path but no user matched — reject.
            return null
          }
        }

        // Backward-compat: legacy single-user mode. Used during the
        // brief window where new code is deployed but SIMPLE_AUTH_USERS
        // is not yet set, so the existing user does not get locked out.
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
