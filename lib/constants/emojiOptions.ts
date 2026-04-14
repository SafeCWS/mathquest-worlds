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
