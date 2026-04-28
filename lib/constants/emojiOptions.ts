// Curated emoji options for the Emoji Theme Picker
// Children can choose their favourite emoji per times table

export const EMOJI_CATEGORIES: Record<string, string[]> = {
  animals: [
    '🐱', '🐶', '🐰', '🐸', '🦊', '🐼', '🐨', '🦁',
    '🐯', '🐮', '🐷', '🐵', '🦄', '🐬', '🐙', '🦋',
    '🐝', '🐞',
  ],
  food: [
    '🍎', '🍊', '🍋', '🍓', '🍇', '🍉', '🍌', '🍒',
    '🍑', '🥝', '🍕', '🧁', '🍩', '🍪', '🍭', '🍬',
  ],
  nature: [
    '🌸', '🌻', '🌺', '🌹', '🌷', '🍀', '🌴', '🌵',
    '🍄', '⭐', '🌙', '💎', '🔮', '❄️',
  ],
  vehicles: [
    '🚀', '🚗', '🚂', '✈️', '🚁', '⛵', '🏎️', '🛸',
    '🚲', '🛴',
  ],
  fun: [
    '🎈', '🎸', '🎮', '⚽', '🏀', '🎯', '🎪', '🎨',
    '🧩', '🪁',
  ],
}

// Category display names (child-friendly)
export const CATEGORY_LABELS: Record<string, string> = {
  animals: 'Animals',
  food: 'Food',
  nature: 'Nature',
  vehicles: 'Vehicles',
  fun: 'Fun',
}

// Category keys in display order
export const CATEGORY_ORDER = ['animals', 'food', 'nature', 'vehicles', 'fun'] as const

// Default emojis (original hardcoded values from VisualMultiplication)
export const DEFAULT_EMOJIS: Record<number, string> = {
  1: '⭐',
  2: '🐄',
  3: '🐱',
  4: '🦋',
  5: '🍎',
  6: '🎈',
  7: '🐬',
  8: '🚀',
  9: '💎',
  10: '🌻',
}

// All emoji options flattened for quick lookup
export const ALL_EMOJI_OPTIONS: string[] = [
  ...EMOJI_CATEGORIES.animals,
  ...EMOJI_CATEGORIES.food,
  ...EMOJI_CATEGORIES.nature,
  ...EMOJI_CATEGORIES.vehicles,
  ...EMOJI_CATEGORIES.fun,
]

/**
 * Singular/plural names for every glyph that can appear as a child's chosen
 * emoji theme. Used by TTS so the spoken word matches the visual emoji
 * (e.g., picking 🎈 makes the chart speak "balloons", not "things").
 *
 * Sourced from EMOJI_CATEGORIES + DEFAULT_EMOJIS. Keep in sync when those
 * arrays grow. Unmapped glyphs fall back to {@link EMOJI_NAME_FALLBACK}.
 */
export const EMOJI_NAMES: Record<string, { singular: string; plural: string }> = {
  // Animals
  '🐱': { singular: 'kitten', plural: 'kittens' },
  '🐶': { singular: 'puppy', plural: 'puppies' },
  '🐰': { singular: 'bunny', plural: 'bunnies' },
  '🐸': { singular: 'frog', plural: 'frogs' },
  '🦊': { singular: 'fox', plural: 'foxes' },
  '🐼': { singular: 'panda', plural: 'pandas' },
  '🐨': { singular: 'koala', plural: 'koalas' },
  '🦁': { singular: 'lion', plural: 'lions' },
  '🐯': { singular: 'tiger', plural: 'tigers' },
  '🐮': { singular: 'cow', plural: 'cows' },
  '🐄': { singular: 'cow', plural: 'cows' },
  '🐷': { singular: 'pig', plural: 'pigs' },
  '🐵': { singular: 'monkey', plural: 'monkeys' },
  '🦄': { singular: 'unicorn', plural: 'unicorns' },
  '🐬': { singular: 'dolphin', plural: 'dolphins' },
  '🐙': { singular: 'octopus', plural: 'octopuses' },
  '🦋': { singular: 'butterfly', plural: 'butterflies' },
  '🐝': { singular: 'bee', plural: 'bees' },
  '🐞': { singular: 'ladybug', plural: 'ladybugs' },

  // Food
  '🍎': { singular: 'apple', plural: 'apples' },
  '🍊': { singular: 'orange', plural: 'oranges' },
  '🍋': { singular: 'lemon', plural: 'lemons' },
  '🍓': { singular: 'strawberry', plural: 'strawberries' },
  '🍇': { singular: 'grape', plural: 'grapes' },
  '🍉': { singular: 'watermelon', plural: 'watermelons' },
  '🍌': { singular: 'banana', plural: 'bananas' },
  '🍒': { singular: 'cherry', plural: 'cherries' },
  '🍑': { singular: 'peach', plural: 'peaches' },
  '🥝': { singular: 'kiwi', plural: 'kiwis' },
  '🍕': { singular: 'pizza slice', plural: 'pizza slices' },
  '🧁': { singular: 'cupcake', plural: 'cupcakes' },
  '🍩': { singular: 'donut', plural: 'donuts' },
  '🍪': { singular: 'cookie', plural: 'cookies' },
  '🍭': { singular: 'lollipop', plural: 'lollipops' },
  '🍬': { singular: 'candy', plural: 'candies' },

  // Nature
  '🌸': { singular: 'blossom', plural: 'blossoms' },
  '🌻': { singular: 'sunflower', plural: 'sunflowers' },
  '🌺': { singular: 'flower', plural: 'flowers' },
  '🌹': { singular: 'rose', plural: 'roses' },
  '🌷': { singular: 'tulip', plural: 'tulips' },
  '🍀': { singular: 'clover', plural: 'clovers' },
  '🌴': { singular: 'palm tree', plural: 'palm trees' },
  '🌵': { singular: 'cactus', plural: 'cacti' },
  '🍄': { singular: 'mushroom', plural: 'mushrooms' },
  '⭐': { singular: 'star', plural: 'stars' },
  '🌙': { singular: 'moon', plural: 'moons' },
  '💎': { singular: 'gem', plural: 'gems' },
  '🔮': { singular: 'crystal ball', plural: 'crystal balls' },
  '❄️': { singular: 'snowflake', plural: 'snowflakes' },

  // Vehicles
  '🚀': { singular: 'rocket', plural: 'rockets' },
  '🚗': { singular: 'car', plural: 'cars' },
  '🚂': { singular: 'train', plural: 'trains' },
  '✈️': { singular: 'plane', plural: 'planes' },
  '🚁': { singular: 'helicopter', plural: 'helicopters' },
  '⛵': { singular: 'sailboat', plural: 'sailboats' },
  '🏎️': { singular: 'race car', plural: 'race cars' },
  '🛸': { singular: 'spaceship', plural: 'spaceships' },
  '🚲': { singular: 'bike', plural: 'bikes' },
  '🛴': { singular: 'scooter', plural: 'scooters' },

  // Fun
  '🎈': { singular: 'balloon', plural: 'balloons' },
  '🎸': { singular: 'guitar', plural: 'guitars' },
  '🎮': { singular: 'game controller', plural: 'game controllers' },
  '⚽': { singular: 'soccer ball', plural: 'soccer balls' },
  '🏀': { singular: 'basketball', plural: 'basketballs' },
  '🎯': { singular: 'target', plural: 'targets' },
  '🎪': { singular: 'tent', plural: 'tents' },
  '🎨': { singular: 'paint palette', plural: 'paint palettes' },
  '🧩': { singular: 'puzzle piece', plural: 'puzzle pieces' },
  '🪁': { singular: 'kite', plural: 'kites' },
}

/** Fallback returned by {@link getEmojiName} for unmapped or null glyphs. */
export const EMOJI_NAME_FALLBACK = { singular: 'thing', plural: 'things' }

/**
 * Look up the spoken name for an emoji glyph.
 * Returns {@link EMOJI_NAME_FALLBACK} (`thing` / `things`) for null / undefined
 * / unmapped input — keeps TTS coherent even with stale localStorage values.
 */
export function getEmojiName(glyph: string | undefined | null): { singular: string; plural: string } {
  if (!glyph) return EMOJI_NAME_FALLBACK
  return EMOJI_NAMES[glyph] ?? EMOJI_NAME_FALLBACK
}
