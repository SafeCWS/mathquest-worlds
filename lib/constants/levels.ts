// Level definitions for MathQuest Worlds - STREAMLINED!

export type MathOperation = 'counting' | 'addition' | 'subtraction' | 'multiplication'
export type InteractionType = 'tap' | 'drag' | 'choice' | 'trace'

// NEW: Game types for variety like CodeSpark!
export type GameType =
  | 'bubblePop'
  | 'feedAnimal'
  | 'matching'
  | 'puzzle'
  | 'race'
  | 'standard'
  | 'bouncingBall'
  | 'shuffle'
  | 'whackMole'
  | 'balloonOrder'
  | 'memoryFlip'
  // NEW variety games!
  | 'fishing'
  | 'rocketLaunch'
  | 'treasureHunt'
  // Lovely Cat World games!
  | 'catTreats'
  | 'yarnBall'
  | 'catNap'
  | 'catTower'
  | 'kittyDance'

export interface Level {
  id: number
  name: string
  description: string
  operation: MathOperation
  modules: Module[]
  unlockStars: number
  badgeEmoji: string
  outfitReward?: string
}

export interface Module {
  id: number
  name: string
  questionsCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  minNumber: number
  maxNumber: number
  interactionTypes: InteractionType[]
  gameType?: GameType // NEW: Different mini-games!
}

// STREAMLINED: Only 3 modules per level, each with a different game type!
export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Number Friends',
    description: 'Learn to count with fun games!',
    operation: 'counting',
    unlockStars: 0,
    badgeEmoji: '🔢',
    outfitReward: 'outfit-counting-champion',
    modules: [
      {
        id: 1,
        name: 'Count the Objects!',
        questionsCount: 3,
        difficulty: 'easy',
        minNumber: 1,
        maxNumber: 5,
        interactionTypes: ['tap'],
        gameType: 'standard'  // Shows objects + tap buttons for pure counting
      },
      {
        id: 2,
        name: 'Feed the Animals!',
        questionsCount: 3,
        difficulty: 'easy',
        minNumber: 1,
        maxNumber: 5,  // Reduced from 8 to 5 for age-appropriate difficulty
        interactionTypes: ['drag'],
        gameType: 'feedAnimal'
      },
      {
        id: 3,
        name: 'Pop the Bubbles!',
        questionsCount: 3,
        difficulty: 'medium',
        minNumber: 1,
        maxNumber: 8,  // Reduced from 10 to 8 for age-appropriate difficulty
        interactionTypes: ['tap', 'choice'],
        gameType: 'bubblePop'  // Changed from whackMole for gentler gameplay
      }
    ]
  },
  {
    id: 2,
    name: 'Adding Adventure',
    description: 'Add numbers together!',
    operation: 'addition',
    unlockStars: 15,
    badgeEmoji: '➕',
    outfitReward: 'outfit-addition-wizard',
    modules: [
      {
        id: 1,
        name: 'Shuffle & Find!',
        questionsCount: 3,
        difficulty: 'easy',
        minNumber: 1,
        maxNumber: 5,
        interactionTypes: ['tap'],
        gameType: 'shuffle'  // NEW: Card shuffle game!
      },
      {
        id: 2,
        name: 'Memory Match Sums!',
        questionsCount: 3,
        difficulty: 'easy',
        minNumber: 1,
        maxNumber: 7,
        interactionTypes: ['tap'],
        gameType: 'memoryFlip'  // NEW: Memory flip game!
      },
      {
        id: 3,
        name: 'Treasure Hunt!',
        questionsCount: 3,
        difficulty: 'medium',
        minNumber: 1,
        maxNumber: 9,
        interactionTypes: ['tap'],
        gameType: 'treasureHunt'  // NEW: Find the treasure!
      }
    ]
  },
  {
    id: 3,
    name: 'Take Away Time',
    description: 'Learn to subtract!',
    operation: 'subtraction',
    unlockStars: 40,
    badgeEmoji: '➖',
    outfitReward: 'outfit-subtraction-star',
    modules: [
      {
        id: 1,
        name: 'Pop the Bubbles Away!',
        questionsCount: 3,
        difficulty: 'easy',
        minNumber: 2,
        maxNumber: 8,  // Single digits: 7-6, 4-2, 8-3, etc.
        interactionTypes: ['tap'],
        gameType: 'bubblePop'
      },
      {
        id: 2,
        name: 'Go Fishing!',
        questionsCount: 3,
        difficulty: 'medium',
        minNumber: 8,
        maxNumber: 15,  // Two digit intro: 10-8, 11-2, 15-7, etc.
        interactionTypes: ['tap'],
        gameType: 'fishing'
      },
      {
        id: 3,
        name: 'Whack the Subtraction Moles!',
        questionsCount: 3,
        difficulty: 'hard',
        minNumber: 10,
        maxNumber: 25,  // Larger two digit: 22-10, 25-13, etc.
        interactionTypes: ['tap', 'choice'],
        gameType: 'whackMole'
      }
    ]
  },
  {
    id: 4,
    name: 'Big Numbers',
    description: 'Add bigger numbers!',
    operation: 'addition',
    unlockStars: 70,
    badgeEmoji: '🔥',
    modules: [
      {
        id: 1,
        name: 'Rocket Launch!',
        questionsCount: 3,
        difficulty: 'medium',
        minNumber: 10,
        maxNumber: 30,
        interactionTypes: ['tap'],
        gameType: 'rocketLaunch'  // Launch rocket with correct answer!
      },
      {
        id: 2,
        name: 'Bounce & Catch Tens!',
        questionsCount: 3,
        difficulty: 'medium',
        minNumber: 10,
        maxNumber: 50,
        interactionTypes: ['tap'],
        gameType: 'bouncingBall'  // Bouncing balls work for any number size!
      },
      {
        id: 3,
        name: 'Champion Race!',
        questionsCount: 3,
        difficulty: 'hard',
        minNumber: 10,
        maxNumber: 99,
        interactionTypes: ['choice'],
        gameType: 'race'
      }
    ]
  },
  {
    id: 5,
    name: 'Times Tables',
    description: 'Learn to multiply!',
    operation: 'multiplication',
    unlockStars: 100,
    badgeEmoji: '✖️',
    outfitReward: 'outfit-golden-adventurer',
    modules: [
      {
        id: 1,
        name: '2x Treasure Hunt!',
        questionsCount: 3,
        difficulty: 'easy',
        minNumber: 1,
        maxNumber: 5,
        interactionTypes: ['tap'],
        gameType: 'treasureHunt'  // Find the treasure with 2x tables!
      },
      {
        id: 2,
        name: '5x Balloon Pop Order!',
        questionsCount: 3,
        difficulty: 'medium',
        minNumber: 1,
        maxNumber: 10,
        interactionTypes: ['tap'],
        gameType: 'balloonOrder'  // Pop balloons in order
      },
      {
        id: 3,
        name: 'Times Table Mole Whack!',
        questionsCount: 3,
        difficulty: 'hard',
        minNumber: 1,
        maxNumber: 10,
        interactionTypes: ['tap'],
        gameType: 'whackMole'  // Whack-a-mole for multiplication
      }
    ]
  }
]

export function getLevelById(levelId: number): Level | undefined {
  return LEVELS.find(l => l.id === levelId)
}

export function isLevelUnlocked(levelId: number, totalStars: number): boolean {
  const level = getLevelById(levelId)
  return level ? totalStars >= level.unlockStars : false
}

export function getModuleById(levelId: number, moduleId: number): Module | undefined {
  const level = getLevelById(levelId)
  return level?.modules.find(m => m.id === moduleId)
}

// Calculate stars earned based on performance
export function calculateStars(
  correctAnswers: number,
  totalQuestions: number,
  timeBonus: boolean = false
): number {
  const percentage = correctAnswers / totalQuestions
  let stars = 0

  if (percentage >= 1) stars = 3
  else if (percentage >= 0.8) stars = 2
  else if (percentage >= 0.6) stars = 1

  // Bonus star for fast completion
  if (timeBonus && stars > 0) stars = Math.min(stars + 1, 3)

  return stars
}

// Character encouragement - more personality!
export const ENCOURAGEMENT_MESSAGES = {
  correct: [
    'WOW! 🌟',
    'AMAZING! ⭐',
    'SUPER! 🚀',
    'YES! 💪',
    'AWESOME! 🎉',
    'PERFECT! 💯'
  ],
  tryAgain: [
    'Try again! 💪',
    'Almost! 🎯',
    'So close! ✨',
    'You got this! 🌟'
  ],
  streak3: [
    'ON FIRE! 🔥🔥🔥',
    'HAT TRICK! ⚡',
    'TRIPLE STAR! ⭐⭐⭐'
  ],
  streak5: [
    'UNSTOPPABLE! 🚀💥',
    'SUPER STREAK! 🔥🔥🔥🔥🔥',
    'MATH GENIUS! 🧠✨'
  ],
  levelComplete: [
    'YOU DID IT! 🎊',
    'CHAMPION! 🏆',
    'SUPERSTAR! 👑'
  ]
}

export function getRandomMessage(type: keyof typeof ENCOURAGEMENT_MESSAGES): string {
  const messages = ENCOURAGEMENT_MESSAGES[type]
  return messages[Math.floor(Math.random() * messages.length)]
}
