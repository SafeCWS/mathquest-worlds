const WORLD_IDS = ['lovelycat', 'jungle', 'space', 'ocean', 'fairy', 'dino', 'candy', 'rainbow']

export function generateStaticParams() {
  return WORLD_IDS.map(worldId => ({ worldId }))
}

export default function WorldLayout({ children }: { children: React.ReactNode }) {
  return children
}
