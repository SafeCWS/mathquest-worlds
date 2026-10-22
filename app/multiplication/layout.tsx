import { requireSession } from '@/lib/auth/requireSession'

// Server-side session guard (defence in depth behind middleware.ts).
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireSession()
  return children
}
