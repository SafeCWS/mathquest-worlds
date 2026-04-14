const WORLD_IDS = ['lovelycat', 'jungle', 'space', 'ocean', 'fairy', 'dino', 'candy', 'rainbow']
const LEVEL_IDS = [1, 2, 3, 4, 5, 6]
const MODULE_IDS = [1, 2, 3]

export function generateStaticParams() {
  const params: { worldId: string; level: string; module: string }[] = []
  for (const worldId of WORLD_IDS) {
    for (const level of LEVEL_IDS) {
      for (const mod of MODULE_IDS) {
        params.push({ worldId, level: String(level), module: String(mod) })
      }
    }
  }
  return params
}

export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return children
}
