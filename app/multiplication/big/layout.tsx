import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { EnglishOnly } from '@/components/EnglishOnly'

// Server-side session guard (defence in depth beside middleware — same pattern as
// the other protected layouts). English only (operator ruling 2026-10-22) — no
// EN/ES toggle on Big Multiplication.
export default async function BigMultiplicationLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  return <EnglishOnly>{children}</EnglishOnly>
}
