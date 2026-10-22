import { requireSession } from '@/lib/auth/requireSession'

export function generateStaticParams() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(table => ({ table: String(table) }))
}

// Server-side session guard (defence in depth behind middleware.ts).
export default async function TableLayout({ children }: { children: React.ReactNode }) {
  await requireSession()
  return children
}
