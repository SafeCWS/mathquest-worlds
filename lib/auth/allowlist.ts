/**
 * The family allowlist (SIMPLE_AUTH_USERS), parsed. NO imports — Edge-safe,
 * so the middleware's jwt callback (lib/auth/config.ts) can use it as well
 * as the Node-side otpStore.
 */
export const MAX_EMAIL_LENGTH = 254

export function normalizeEmail(raw: unknown): string {
  return String(raw ?? '').toLowerCase().trim()
}

export function wellFormedEmail(email: string): boolean {
  return !!email && email.length <= MAX_EMAIL_LENGTH && email.includes('@')
}

/**
 * Parse SIMPLE_AUTH_USERS (`[{"email": "..."}]`; a legacy `password` field is
 * ignored). Malformed JSON, a non-array, or junk entries yield an empty /
 * partial set; this never throws. Empty set ⇒ nobody can sign in.
 */
export function parseAllowlist(json: string | undefined | null): Set<string> {
  const out = new Set<string>()
  if (!json || !json.trim()) return out
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return out
  }
  if (!Array.isArray(parsed)) return out
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue
    const email = normalizeEmail((entry as { email?: unknown }).email)
    if (wellFormedEmail(email)) out.add(email)
  }
  return out
}

let cachedJson: string | undefined
let cachedSet: Set<string> = new Set()

/** parseAllowlist(process.env.SIMPLE_AUTH_USERS), re-parsed only when the value changes. */
export function currentAllowlist(): ReadonlySet<string> {
  const json = process.env.SIMPLE_AUTH_USERS
  if (json !== cachedJson) {
    cachedJson = json
    cachedSet = parseAllowlist(json)
  }
  return cachedSet
}
