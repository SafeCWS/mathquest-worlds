// World definitions for MathQuest Worlds

export interface World {
  id: string
  name: string
  emoji: string
  description: string
  unlockStars: number
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  countingObjects: string[]
  petUnlock: string
  outfitUnlock: string
}

export const WORLDS: World[] = [
  {
    id: 'lovelycat',
    name: 'Lovely Cat Party',
    emoji: '🐱',
    description: 'A dreamy cat paradise with sparkles and bows! 🎀✨',
    unlockStars: 0, // Available from start!
    colors: {
      primary: '#FF69B4',       // Hot pink
      secondary: '#FFB6C1',     // Light pink
      accent: '#FFD1DC',        // Pastel pink
      background: 'linear-gradient(180deg, #FFF0F5 0%, #FFB6C1 50%, #FF69B4 100%)'
    },
    countingObjects: ['🐱', '😺', '🐈', '🎀', '💗', '🌸', '🧶', '🐾', '💖', '✨'],
    petUnlock: 'kitty',
    outfitUnlock: 'catears'
  },
  {
    id: 'jungle',
    name: 'Jungle Adventure',
    emoji: '🌴',
    description: 'Explore the tropical rainforest!',
    unlockStars: 0, // Unlocked by default
    colors: {
      primary: '#2D5016',
      secondary: '#8BC34A',
      accent: '#FFD700',
      background: 'linear-gradient(180deg, #87CEEB 0%, #98FB98 50%, #228B22 100%)'
    },
    countingObjects: ['🥥', '🍌', '🌺', '🦜', '🐒'],
    petUnlock: 'parrot',
    outfitUnlock: 'explorer'
  },
  {
    id: 'space',
    name: 'Space Galaxy',
    emoji: '🚀',
    description: 'Blast off to outer space!',
    unlockStars: 100,
    colors: {
      primary: '#1A1A2E',
      secondary: '#7B68EE',
      accent: '#FFD700',
      background: 'linear-gradient(180deg, #0D0D1A 0%, #1A1A2E 50%, #2D2D5E 100%)'
    },
    countingObjects: ['⭐', '🌙', '🪐', '☄️', '🛸'],
    petUnlock: 'alien',
    outfitUnlock: 'astronaut'
  },
  {
    id: 'ocean',
    name: 'Ocean Kingdom',
    emoji: '🧜‍♀️',
    description: 'Dive into the underwater world!',
    unlockStars: 250,
    colors: {
      primary: '#006994',
      secondary: '#40E0D0',
      accent: '#FF69B4',
      background: 'linear-gradient(180deg, #87CEEB 0%, #00CED1 50%, #006994 100%)'
    },
    countingObjects: ['🐚', '🦪', '🐠', '🐙', '🦑'],
    petUnlock: 'seahorse',
    outfitUnlock: 'mermaid'
  },
  {
    id: 'fairy',
    name: 'Fairy Kingdom',
    emoji: '🏰',
    description: 'Enter the enchanted forest!',
    unlockStars: 400,
    colors: {
      primary: '#9B59B6',
      secondary: '#F8BBD9',
      accent: '#FFD700',
      background: 'linear-gradient(180deg, #FFB6C1 0%, #DDA0DD 50%, #9B59B6 100%)'
    },
    countingObjects: ['✨', '🦋', '🌸', '💎', '🍄'],
    petUnlock: 'unicorn',
    outfitUnlock: 'fairy'
  },
  {
    id: 'dino',
    name: 'Dino Land',
    emoji: '🦖',
    description: 'Travel back to prehistoric times!',
    unlockStars: 600,
    colors: {
      primary: '#8B4513',
      secondary: '#FF6B35',
      accent: '#32CD32',
      background: 'linear-gradient(180deg, #FF6B35 0%, #CD853F 50%, #8B4513 100%)'
    },
    countingObjects: ['🦴', '🥚', '🌋', '🦕', '🪨'],
    petUnlock: 'babydino',
    outfitUnlock: 'caveperson'
  },
  {
    id: 'candy',
    name: 'Candy World',
    emoji: '🍭',
    description: 'Sweet adventures await!',
    unlockStars: 800,
    colors: {
      primary: '#FF1493',
      secondary: '#00BFFF',
      accent: '#FFD700',
      background: 'linear-gradient(180deg, #FFB6C1 0%, #FF69B4 50%, #FF1493 100%)'
    },
    countingObjects: ['🍬', '🍫', '🧁', '🍩', '🍪'],
    petUnlock: 'gummybear',
    outfitUnlock: 'candyprincess'
  }
]

// Rainbow Realm - Secret world unlocked by completing all others
export const SECRET_WORLD: World = {
  id: 'rainbow',
  name: 'Rainbow Realm',
  emoji: '🌈',
  description: 'The ultimate magical world!',
  unlockStars: -1, // Special unlock condition
  colors: {
    primary: '#FF0000',
    secondary: '#00FF00',
    accent: '#0000FF',
    background: 'linear-gradient(180deg, #FF0000 0%, #FF7F00 17%, #FFFF00 33%, #00FF00 50%, #0000FF 67%, #4B0082 83%, #9400D3 100%)'
  },
  countingObjects: ['🌈', '⭐', '💫', '🦄', '✨'],
  petUnlock: 'phoenix',
  outfitUnlock: 'rainbowmaster'
}

export function getWorldById(worldId: string): World | undefined {
  if (worldId === 'rainbow') return SECRET_WORLD
  return WORLDS.find(w => w.id === worldId)
}

export function isWorldUnlocked(worldId: string, totalStars: number, completedWorlds: string[]): boolean {
  if (worldId === 'rainbow') {
    // Rainbow Realm unlocks when all other worlds are completed
    return WORLDS.every(w => completedWorlds.includes(w.id))
  }
  const world = WORLDS.find(w => w.id === worldId)
  return world ? totalStars >= world.unlockStars : false
}
