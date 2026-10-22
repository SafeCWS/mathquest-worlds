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

// Protect everything EXCEPT:
//   - Next.js internals (_next/static, _next/image, favicon)
//   - Auth routes (api/auth/*)
//   - OTP request route (api/otp/*) — called while logged out (L156)
//   - Health check (api/health)
//   - The /login page itself
//   - Static asset file extensions (EXPLICITLY ENUMERATED)
//
// The previous matcher used `.*\..*` to skip any path containing a dot.
// That was too permissive — if we ever add something like
// `app/admin.panel/page.tsx`, auth would silently break. Enumerating
// the exact asset extensions here is fail-closed: a new route with a
// dot in its name will keep auth protection.
//
// `webmanifest` is in the allowlist because PWA install on iOS/Android
// requires the browser to fetch /manifest.webmanifest BEFORE the user
// is logged in (the "Add to Home Screen" prompt fires on the public
// /login page). Without this, anonymous users get a screenshot icon
// + Safari chrome instead of the proper standalone PWA install.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|api/otp/|api/health|login|.*\\.(?:svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|css|js|mjs|map|mp3|wav|ogg|mp4|webm|webp|avif|pdf|txt|json|xml|webmanifest)$).*)',
  ],
}
