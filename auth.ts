import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          // Workspace domain hint — only surfaces the family account
          // in the Google account chooser.
          hd: 'customworkforcesolutionsllc.com',
          prompt: 'select_account',
        },
      },
    }),
  ],
  callbacks: {
    // Runs on every middleware-matched request. Returning false makes
    // NextAuth redirect to pages.signIn (/login). This is what actually
    // enforces route protection — the `auth as middleware` export alone
    // only establishes session context without gating.
    authorized: ({ auth }) => !!auth,
    async signIn({ profile, account }) {
      // Defense-in-depth. Checks ordered shortest/cheapest first so a
      // mis-routed or hostile callback is rejected before we touch the
      // profile payload.
      //   1. Provider must be Google (we only configured Google — any
      //      other provider indicates misconfiguration or attack).
      //   2. Google must have verified the email (`email_verified=true`).
      //      Unverified Workspace emails can be spoofed in principle;
      //      we refuse them unconditionally.
      //   3. `hd` (hosted domain) is Google Workspace-only and is NOT
      //      part of NextAuth's Profile type. We validate it against
      //      the Workspace allowlist.
      //   4. Email must match the ALLOWED_EMAIL env var exactly
      //      (case-insensitive).
      if (account?.provider !== 'google') return false
      const p = profile as {
        email?: string
        hd?: string
        email_verified?: boolean
      }
      if (!p?.email_verified) return false
      const email = p.email
      const hd = p.hd
      const allowed = process.env.ALLOWED_EMAIL
      if (!email || !allowed) return false
      if (hd !== 'customworkforcesolutionsllc.com') return false
      return email.toLowerCase() === allowed.toLowerCase()
    },
    async session({ session, token }) {
      if (token.email) session.user.email = token.email
      return session
    },
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: { signIn: '/login' },
})
