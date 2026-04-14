const WORLD_IDS = ['lovelycat', 'jungle', 'space', 'ocean', 'fairy', 'dino', 'candy', 'rainbow']
const LEVEL_IDS = [1, 2, 3, 4, 5, 6]

export function generateStaticParams() {
  const params: { worldId: string; level: string }[] = []
  for (const worldId of WORLD_IDS) {
    for (const level of LEVEL_IDS) {
      params.push({ worldId, level: String(level) })
    }
  }
  return params
}

export default function LevelLayout({ children }: { children: React.ReactNode }) {
  return children
}
