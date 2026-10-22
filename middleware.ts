import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth/config'

// Edge middleware builds its OWN NextAuth from the provider-less, Edge-safe
// config. It must NEVER import '@/auth': that module pulls in the OTP store
// (node:crypto), which the Edge runtime cannot load. Only the JWT cookie is
// decoded here; codes are verified in auth.ts on the Node runtime.
// (Default export: Next's static analysis does not recognise a destructured
// `export const { auth: middleware }` as the middleware function.)
const { auth } = NextAuth(authConfig)
export default auth

// Protect everything EXCEPT these exact static roots and public routes:
//   - Next.js build assets:  /_next/static/*, /_next/image
//   - PWA install (L156):    /manifest.webmanifest, /icons/*, /favicon.ico
//   - /robots.txt
//   - /api/health (exact), /api/auth/*, /api/otp/*
//   - /login (exact or /login/...)
//
// Security review HIGH (2026-10-22): the previous rule skipped ANY path
// ending in an asset extension (`.*\.(?:json|js|txt|…)$`). Dynamic routes
// match that too — `/worlds/ocean.json` and `/multiplication/7.js` rendered
// 200 logged out. Public files are now listed by ROOT, never by extension,
// so a new route is protected by default (fail-closed). If you add a
// public/ folder that must load logged out, add its root here AND to the
// wiring test (lib/auth/__tests__/wiring.test.ts).
// Protected segments also check the session server-side (requireSession).
export const config = {
  matcher: [
    '/((?!_next/static/|_next/image$|favicon\\.ico$|icons/|manifest\\.webmanifest$|robots\\.txt$|api/health$|api/auth/|api/otp/|login(?:/|$)).*)',
  ],
}
