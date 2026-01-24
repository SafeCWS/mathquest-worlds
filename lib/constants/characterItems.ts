// Character customization items for MathQuest Worlds

export interface CharacterItem {
  id: string
  name: string
  category: string
  unlockType: 'free' | 'stars' | 'streak' | 'level' | 'world'
  unlockValue?: number | string
  worldTheme?: string
  colors?: string[]
}

// Body types - all free
export const BODY_TYPES: CharacterItem[] = [
  { id: 'body-1', name: 'Slim', category: 'body', unlockType: 'free' },
  { id: 'body-2', name: 'Regular', category: 'body', unlockType: 'free' },
  { id: 'body-3', name: 'Curvy', category: 'body', unlockType: 'free' },
  { id: 'body-4', name: 'Athletic', category: 'body', unlockType: 'free' },
  { id: 'body-5', name: 'Petite', category: 'body', unlockType: 'free' },
  { id: 'body-6', name: 'Tall', category: 'body', unlockType: 'free' }
]

// Skin tones - all free (12+ diverse palette)
export const SKIN_TONES: string[] = [
  '#FFDFC4', '#F0D5BE', '#EECEB3', '#E1B899', '#D2A679',
  '#C68642', '#8D5524', '#6B4423', '#4A2C17', '#3D1F0F',
  '#FFE4C4', '#DEB887'
]

// Hair styles - ALL UNLOCKED
export const HAIR_STYLES: CharacterItem[] = [
  { id: 'hair-short', name: 'Short', category: 'hair', unlockType: 'free' },
  { id: 'hair-medium', name: 'Medium', category: 'hair', unlockType: 'free' },
  { id: 'hair-long', name: 'Long Straight', category: 'hair', unlockType: 'free' },
  { id: 'hair-curly', name: 'Curly', category: 'hair', unlockType: 'free' },
  { id: 'hair-wavy', name: 'Wavy', category: 'hair', unlockType: 'free' },
  { id: 'hair-braids', name: 'Braids', category: 'hair', unlockType: 'free' },
  { id: 'hair-ponytail', name: 'Ponytail', category: 'hair', unlockType: 'free' },
  { id: 'hair-pigtails', name: 'Pigtails', category: 'hair', unlockType: 'free' },
  { id: 'hair-bun', name: 'Bun', category: 'hair', unlockType: 'free' },
  { id: 'hair-afro', name: 'Afro', category: 'hair', unlockType: 'free' },
  { id: 'hair-spiky', name: 'Spiky', category: 'hair', unlockType: 'free' },
  { id: 'hair-mohawk', name: 'Mohawk', category: 'hair', unlockType: 'free' },
  { id: 'hair-twin-buns', name: 'Twin Buns', category: 'hair', unlockType: 'free' },
  { id: 'hair-side-shave', name: 'Side Shave', category: 'hair', unlockType: 'free' },
  { id: 'hair-dreads', name: 'Dreads', category: 'hair', unlockType: 'free' }
]

// Hair colors - ALL UNLOCKED
export const HAIR_COLORS: { color: string; unlockType: string; unlockValue?: number | string }[] = [
  { color: '#000000', unlockType: 'free' }, // Black
  { color: '#3D2314', unlockType: 'free' }, // Dark Brown
  { color: '#8B4513', unlockType: 'free' }, // Brown
  { color: '#D2691E', unlockType: 'free' }, // Light Brown
  { color: '#FFD700', unlockType: 'free' }, // Blonde
  { color: '#B8860B', unlockType: 'free' }, // Dark Blonde
  { color: '#CD853F', unlockType: 'free' }, // Sandy
  { color: '#FF4500', unlockType: 'free' }, // Ginger
  { color: '#FF69B4', unlockType: 'free' }, // Pink
  { color: '#9400D3', unlockType: 'free' }, // Purple
  { color: '#00CED1', unlockType: 'free' }, // Cyan
  { color: '#32CD32', unlockType: 'free' }, // Green
  { color: '#4169E1', unlockType: 'free' }, // Blue
  { color: '#FF1493', unlockType: 'free' }, // Deep Pink
  { color: '#00FFFF', unlockType: 'free' }, // Aqua
  { color: 'linear-gradient(90deg, red, orange, yellow, green, blue, purple)', unlockType: 'free' } // Rainbow
]

// Eye shapes
export const EYE_SHAPES: CharacterItem[] = [
  { id: 'eyes-round', name: 'Round', category: 'eyes', unlockType: 'free' },
  { id: 'eyes-almond', name: 'Almond', category: 'eyes', unlockType: 'free' },
  { id: 'eyes-cat', name: 'Cat Eyes', category: 'eyes', unlockType: 'free' },
  { id: 'eyes-droopy', name: 'Droopy', category: 'eyes', unlockType: 'free' },
  { id: 'eyes-wide', name: 'Wide', category: 'eyes', unlockType: 'free' },
  { id: 'eyes-narrow', name: 'Narrow', category: 'eyes', unlockType: 'free' },
  { id: 'eyes-sparkle', name: 'Sparkle', category: 'eyes', unlockType: 'free' },
  { id: 'eyes-anime', name: 'Anime', category: 'eyes', unlockType: 'free' }
]

// Eye colors - all free
export const EYE_COLORS: string[] = [
  '#8B4513', '#654321', '#000000', '#1E90FF', '#228B22',
  '#808080', '#DEB887', '#FFD700', '#9400D3', '#00CED1',
  '#FF69B4', '#FF4500', '#6B8E23', '#4682B4', '#CD853F',
  '#2F4F4F', '#556B2F', '#8B0000', '#483D8B', '#2E8B57'
]

// Outfits - ALL UNLOCKED
export const OUTFITS: CharacterItem[] = [
  { id: 'outfit-casual', name: 'Casual Tee', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-dress', name: 'Sundress', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-sporty', name: 'Sporty', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-overalls', name: 'Overalls', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-hoodie', name: 'Hoodie', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-jumpsuit', name: 'Jumpsuit', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-tshirt-jeans', name: 'T-Shirt & Jeans', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-skirt-top', name: 'Skirt & Top', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-tropical', name: 'Tropical', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-adventurer', name: 'Adventurer', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-explorer', name: 'Explorer', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-safari', name: 'Safari', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-astronaut', name: 'Astronaut', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-starfleet', name: 'Starfleet', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-mermaid', name: 'Mermaid', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-pirate', name: 'Pirate', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-fairy', name: 'Fairy Dress', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-princess', name: 'Princess', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-caveperson', name: 'Cave Person', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-dinosaur', name: 'Dino Costume', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-candyprincess', name: 'Candy Princess', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-gummybear', name: 'Gummy Bear', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-counting-champion', name: 'Counting Champion', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-addition-wizard', name: 'Addition Wizard', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-subtraction-star', name: 'Subtraction Star', category: 'outfit', unlockType: 'free' },
  { id: 'outfit-golden-adventurer', name: 'Golden Adventurer', category: 'outfit', unlockType: 'free' }
]

// Accessories - ALL UNLOCKED
export const ACCESSORIES: CharacterItem[] = [
  { id: 'acc-none', name: 'None', category: 'accessory', unlockType: 'free' },
  { id: 'acc-glasses', name: 'Glasses', category: 'accessory', unlockType: 'free' },
  { id: 'acc-sunglasses', name: 'Sunglasses', category: 'accessory', unlockType: 'free' },
  { id: 'acc-headband', name: 'Headband', category: 'accessory', unlockType: 'free' },
  { id: 'acc-bow', name: 'Hair Bow', category: 'accessory', unlockType: 'free' },
  { id: 'acc-flower', name: 'Flower', category: 'accessory', unlockType: 'free' },
  { id: 'acc-bandana', name: 'Bandana', category: 'accessory', unlockType: 'free' },
  { id: 'acc-cap', name: 'Cap', category: 'accessory', unlockType: 'free' },
  { id: 'acc-beanie', name: 'Beanie', category: 'accessory', unlockType: 'free' },
  { id: 'acc-earrings', name: 'Earrings', category: 'accessory', unlockType: 'free' },
  { id: 'acc-star-crown', name: 'Star Crown', category: 'accessory', unlockType: 'free' },
  { id: 'acc-glow-ring', name: 'Glow Ring', category: 'accessory', unlockType: 'free' },
  { id: 'acc-magic-wand', name: 'Magic Wand', category: 'accessory', unlockType: 'free' },
  { id: 'acc-explorer-hat', name: 'Explorer Hat', category: 'accessory', unlockType: 'free' },
  { id: 'acc-space-helmet', name: 'Space Helmet', category: 'accessory', unlockType: 'free' },
  { id: 'acc-shell-crown', name: 'Shell Crown', category: 'accessory', unlockType: 'free' },
  { id: 'acc-fairy-wings', name: 'Fairy Wings', category: 'accessory', unlockType: 'free' },
  { id: 'acc-dino-horns', name: 'Dino Horns', category: 'accessory', unlockType: 'free' },
  { id: 'acc-lollipop', name: 'Giant Lollipop', category: 'accessory', unlockType: 'free' }
]

// Pet buddies - ALL UNLOCKED
export const PETS: CharacterItem[] = [
  { id: 'pet-none', name: 'No Pet', category: 'pet', unlockType: 'free' },
  { id: 'pet-parrot', name: 'Parrot', category: 'pet', unlockType: 'free' },
  { id: 'pet-monkey', name: 'Monkey', category: 'pet', unlockType: 'free' },
  { id: 'pet-turtle', name: 'Turtle', category: 'pet', unlockType: 'free' },
  { id: 'pet-crab', name: 'Crab', category: 'pet', unlockType: 'free' },
  { id: 'pet-alien', name: 'Alien Buddy', category: 'pet', unlockType: 'free' },
  { id: 'pet-seahorse', name: 'Seahorse', category: 'pet', unlockType: 'free' },
  { id: 'pet-unicorn', name: 'Unicorn', category: 'pet', unlockType: 'free' },
  { id: 'pet-babydino', name: 'Baby Dino', category: 'pet', unlockType: 'free' },
  { id: 'pet-gummybear', name: 'Gummy Bear', category: 'pet', unlockType: 'free' },
  { id: 'pet-phoenix', name: 'Phoenix', category: 'pet', unlockType: 'free' },
  { id: 'pet-dragon', name: 'Baby Dragon', category: 'pet', unlockType: 'free' }
]

// Effects
export const EFFECTS: CharacterItem[] = [
  { id: 'effect-none', name: 'None', category: 'effect', unlockType: 'free' },
  { id: 'effect-sparkle', name: 'Sparkles', category: 'effect', unlockType: 'stars', unlockValue: 100 },
  { id: 'effect-glow', name: 'Glow', category: 'effect', unlockType: 'streak', unlockValue: 7 },
  { id: 'effect-hearts', name: 'Floating Hearts', category: 'effect', unlockType: 'stars', unlockValue: 200 },
  { id: 'effect-stars', name: 'Floating Stars', category: 'effect', unlockType: 'stars', unlockValue: 250 },
  { id: 'effect-rainbow', name: 'Rainbow Trail', category: 'effect', unlockType: 'streak', unlockValue: 30 },
  { id: 'effect-confetti', name: 'Confetti', category: 'effect', unlockType: 'level', unlockValue: 'all' }
]

// Helper functions
export function isItemUnlocked(
  item: CharacterItem,
  totalStars: number,
  currentStreak: number,
  completedLevels: number[],
  unlockedWorlds: string[]
): boolean {
  switch (item.unlockType) {
    case 'free':
      return true
    case 'stars':
      return totalStars >= (item.unlockValue as number)
    case 'streak':
      return currentStreak >= (item.unlockValue as number)
    case 'level':
      if (item.unlockValue === 'all') {
        return completedLevels.length >= 6
      }
      return completedLevels.includes(item.unlockValue as number)
    case 'world':
      return unlockedWorlds.includes(item.worldTheme || '')
    default:
      return false
  }
}

export function getUnlockedItems(
  category: string,
  totalStars: number,
  currentStreak: number,
  completedLevels: number[],
  unlockedWorlds: string[]
): CharacterItem[] {
  let items: CharacterItem[] = []

  switch (category) {
    case 'body':
      items = BODY_TYPES
      break
    case 'hair':
      items = HAIR_STYLES
      break
    case 'eyes':
      items = EYE_SHAPES
      break
    case 'outfit':
      items = OUTFITS
      break
    case 'accessory':
      items = ACCESSORIES
      break
    case 'pet':
      items = PETS
      break
    case 'effect':
      items = EFFECTS
      break
  }

  return items.filter(item =>
    isItemUnlocked(item, totalStars, currentStreak, completedLevels, unlockedWorlds)
  )
}
