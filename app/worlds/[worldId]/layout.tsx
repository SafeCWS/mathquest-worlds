import { requireSession } from '@/lib/auth/requireSession'

const WORLD_IDS = ['lovelycat', 'jungle', 'space', 'ocean', 'fairy', 'dino', 'candy', 'rainbow']

export function generateStaticParams() {
  return WORLD_IDS.map(worldId => ({ worldId }))
}

// Server-side session guard (defence in depth behind middleware.ts).
export default async function WorldLayout({ children }: { children: React.ReactNode }) {
  await requireSession()
  return children
}
