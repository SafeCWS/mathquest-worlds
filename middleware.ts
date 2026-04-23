export { auth as middleware } from '@/auth'

// Protect everything EXCEPT:
//   - Next.js internals (_next/static, _next/image, favicon)
//   - Auth routes (api/auth/*)
//   - Health check (api/health)
//   - The /login page itself
//   - Static asset file extensions (EXPLICITLY ENUMERATED)
//
// The previous matcher used `.*\..*` to skip any path containing a dot.
// That was too permissive — if we ever add something like
// `app/admin.panel/page.tsx`, auth would silently break. Enumerating
// the exact asset extensions here is fail-closed: a new route with a
// dot in its name will keep auth protection.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|api/health|login|.*\\.(?:svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|css|js|mjs|map|mp3|wav|ogg|mp4|webm|webp|avif|pdf|txt|json|xml)$).*)',
  ],
}
