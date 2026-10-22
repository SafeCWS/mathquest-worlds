/**
 * Server-side session guard for protected route segments — defence in depth
 * behind middleware.ts (security review HIGH 2026-10-22: a too-broad
 * middleware exclusion once let `/worlds/ocean.json` render logged out).
 * Every protected top-level segment's layout.tsx awaits this; a wiring test
 * fails if a new top-level segment ships without it.
 *
 * Node runtime only (imports '@/auth').
 */
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export async function requireSession() {
  const session = await auth()
  if (!session) redirect('/login')
  return session
}
