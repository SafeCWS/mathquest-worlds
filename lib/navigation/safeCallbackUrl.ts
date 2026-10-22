/**
 * Where to send the browser after sign-in. Only ever an ABSOLUTE URL on our own
 * origin, or '/'. Never a relative string rebuilt from parts: with
 * `https://<origin>//evil.com` the origin matches but the pathname is
 * `//evil.com`, which a browser reads as protocol-relative (off-site).
 * Backslashes are treated as slashes by the URL parser (`/\evil.com` → host
 * evil.com), so they fail the origin check. Any parse error → '/'.
 */
export function safeCallbackUrl(raw: string | null | undefined, origin: string): string {
  if (!raw) return '/'
  try {
    const url = new URL(raw, origin)
    if (url.origin !== origin) return '/'
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '/'
    url.pathname = url.pathname.replace(/^\/+/, '/')
    return url.href
  } catch {
    return '/'
  }
}
