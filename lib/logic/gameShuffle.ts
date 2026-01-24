// Game Shuffling Engine for MathQuest Worlds
// Creates variety and surprise like Toca Boca!

import { useState, useEffect } from 'react'
import { useGamePreferencesStore, MathOperation, GameStyle } from '@/lib/stores/gamePreferencesStore'
import { GameType } from '@/lib/constants/levels'

// Re-export GameType for convenience
export type { GameType }

// Games grouped by interaction style - using only valid GameTypes from levels.ts
const TAP_GAMES: GameType[] = ['bubblePop', 'whackMole', 'balloonOrder', 'race', 'rocketLaunch']
const DRAG_GAMES: GameType[] = ['feedAnimal', 'fishing', 'treasureHunt', 'puzzle']
const MIXED_GAMES: GameType[] = [...TAP_GAMES, ...DRAG_GAMES, 'bouncingBall', 'shuffle', 'memoryFlip']

export interface ShuffledQuestion {
  id: string
  gameType: GameType
  operation: MathOperation
  num1: number
  num2: number
  answer: number
  question: string
  options: number[]
  emoji: string
  countingObjects?: string[]
}

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Generate options around the correct answer
function generateOptions(correct: number, count: number = 4, minVal: number = 0, maxVal: number = 20): number[] {
  const options = new Set<number>([correct])

  // Ensure min and max are sensible
  const effectiveMin = Math.max(0, correct - 5, minVal)
  const effectiveMax = Math.min(correct + 5, maxVal)

  // Preferred offsets for close wrong answers
  const offsets = shuffle([-2, -1, 1, 2, -3, 3])

  for (const offset of offsets) {
    if (options.size >= count) break
    const option = correct + offset
    if (option !== correct && option >= effectiveMin && option <= effectiveMax) {
      options.add(option)
    }
  }

  // Fill remaining with random values if needed
  let attempts = 0
  while (options.size < count && attempts < 20) {
    const option = Math.floor(Math.random() * (effectiveMax - effectiveMin + 1)) + effectiveMin
    if (option !== correct) {
      options.add(option)
    }
    attempts++
  }

  return shuffle([...options])
}

// Get games based on user's preferred style
function getGamesByStyle(style: GameStyle): GameType[] {
  switch (style) {
    case 'tap': return TAP_GAMES
    case 'drag': return DRAG_GAMES
    case 'mixed': return MIXED_GAMES
    default: return MIXED_GAMES
  }
}

// World-specific emojis - matches existing world theming
const WORLD_EMOJIS: Record<string, string[]> = {
  jungle: ['🦁', '🐯', '🦒', '🐘', '🐵', '🦜', '🦋', '🌴', '🍌', '🥥', '🐍', '🦎'],
  space: ['🚀', '⭐', '🌙', '🪐', '👽', '🛸', '☄️', '🌟', '🌍', '👨‍🚀', '🛰️', '💫'],
  ocean: ['🐟', '🐙', '🦀', '🐚', '🐬', '🦈', '🐳', '🪼', '🐠', '🦑', '🦐', '🌊'],
  fairy: ['🧚', '🦄', '🌸', '🏰', '✨', '🌈', '🦋', '💎', '👸', '🔮', '🌹', '👑'],
  dino: ['🦕', '🦖', '🌋', '🥚', '🦴', '🌿', '🪨', '🐊', '🌴', '🐢', '🦎', '🐸'],
  candy: ['🍭', '🍬', '🧁', '🍩', '🎂', '🍪', '🍫', '🍰', '🍦', '🍓', '🎀', '🎈'],
  castle: ['👸', '🤴', '👑', '🏰', '🗡️', '🦄', '🐲', '💎', '🌹', '🦢', '🦅', '🐎'],
  lovelycat: ['🐱', '😺', '🐈', '🎀', '💗', '🌸', '🧶', '🐾', '😻', '🐟', '🥛', '💕'],
  rainbow: ['🌈', '⭐', '💫', '✨', '🦄', '💖', '🌟', '🎨', '🦋', '💜', '💙', '💚']
}

// Get random emoji for world
function getWorldEmoji(worldId: string): string {
  const emojis = WORLD_EMOJIS[worldId] || WORLD_EMOJIS.jungle
  return emojis[Math.floor(Math.random() * emojis.length)]
}

// Track used emojis to avoid repetition within a game session
let usedEmojisInSession: Set<string> = new Set()

// Get unique emoji for world (avoids repeats)
function getUniqueWorldEmoji(worldId: string): string {
  const emojis = WORLD_EMOJIS[worldId] || WORLD_EMOJIS.jungle

  // Find unused emoji
  for (const emoji of shuffle([...emojis])) {
    if (!usedEmojisInSession.has(emoji)) {
      usedEmojisInSession.add(emoji)
      return emoji
    }
  }

  // All used, reset and pick random
  usedEmojisInSession.clear()
  const emoji = emojis[Math.floor(Math.random() * emojis.length)]
  usedEmojisInSession.add(emoji)
  return emoji
}

// Generate a single question
function generateQuestion(
  operation: MathOperation,
  worldId: string,
  gameType: GameType,
  difficulty: 'easy' | 'medium' | 'hard' = 'easy',
  questionIndex: number
): ShuffledQuestion {
  // Get unique emoji to avoid repetition
  const emoji = getUniqueWorldEmoji(worldId)

  // Difficulty ranges
  const ranges = {
    easy: { min: 1, max: 10 },
    medium: { min: 5, max: 20 },
    hard: { min: 10, max: 50 }
  }
  const range = ranges[difficulty]

  let num1 = 0, num2 = 0, answer = 0, question = ''

  switch (operation) {
    case 'counting':
      // For counting, answer is the count itself
      answer = Math.floor(Math.random() * range.max) + 1
      num1 = answer
      num2 = 0
      question = `Count the ${emoji}!`
      break

    case 'addition':
      // Keep both numbers reasonable for the difficulty
      num1 = Math.floor(Math.random() * (range.max / 2)) + 1
      num2 = Math.floor(Math.random() * (range.max / 2)) + 1
      answer = num1 + num2
      question = `${num1} ${emoji} + ${num2} ${emoji} = ?`
      break

    case 'subtraction':
      // Ensure num1 > num2 for no negative results
      num1 = Math.floor(Math.random() * range.max) + range.min
      num2 = Math.floor(Math.random() * Math.min(num1 - 1, range.max / 2)) + 1
      answer = num1 - num2
      question = `${num1} ${emoji} - ${num2} ${emoji} = ?`
      break
  }

  // Create counting objects for visual display
  const countingObjects = operation === 'counting'
    ? Array(answer).fill(emoji)
    : operation === 'addition'
      ? [...Array(num1).fill(emoji), ...Array(num2).fill(emoji)]
      : Array(num1).fill(emoji)

  // Generate options with appropriate range
  const maxOptionRange = operation === 'addition' ? num1 + num2 + 5 : range.max

  return {
    id: `q-${questionIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    gameType,
    operation,
    num1,
    num2,
    answer,
    question,
    options: generateOptions(answer, 4, 0, maxOptionRange),
    emoji,
    countingObjects
  }
}

// MAIN EXPORT: Generate a shuffled game sequence
export function generateShuffledSequence(
  worldId: string,
  questionCount: number = 7,
  difficulty: 'easy' | 'medium' | 'hard' = 'easy'
): ShuffledQuestion[] {
  // Reset session emoji tracking
  usedEmojisInSession.clear()

  // Get user preferences
  const { operations, gameStyle } = useGamePreferencesStore.getState()

  // Get available game types based on style preference
  const availableGames = getGamesByStyle(gameStyle)

  // Create a pool of operation/game combinations
  const pool: Array<{ operation: MathOperation; gameType: GameType }> = []

  for (const operation of operations) {
    for (const gameType of availableGames) {
      pool.push({ operation, gameType })
    }
  }

  // Shuffle the pool
  const shuffledPool = shuffle(pool)

  // Generate questions, avoiding consecutive same game types
  const questions: ShuffledQuestion[] = []
  let lastGameType: GameType | null = null

  for (let i = 0; i < questionCount; i++) {
    // Find next combination that's different from last game type
    let combo = shuffledPool[i % shuffledPool.length]

    // Try to avoid consecutive same game types (better variety!)
    if (combo.gameType === lastGameType && shuffledPool.length > 1) {
      const alternates = shuffledPool.filter(c => c.gameType !== lastGameType)
      if (alternates.length > 0) {
        combo = alternates[Math.floor(Math.random() * alternates.length)]
      }
    }

    const question = generateQuestion(
      combo.operation,
      worldId,
      combo.gameType,
      difficulty,
      i
    )

    questions.push(question)
    lastGameType = combo.gameType
  }

  return questions
}

// Hook to generate sequence with React state
export function useShuffledSequence(worldId: string, count: number = 7, difficulty: 'easy' | 'medium' | 'hard' = 'easy') {
  const [sequence, setSequence] = useState<ShuffledQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const newSequence = generateShuffledSequence(worldId, count, difficulty)
    setSequence(newSequence)
    setIsLoading(false)
  }, [worldId, count, difficulty])

  const regenerate = () => {
    setSequence(generateShuffledSequence(worldId, count, difficulty))
  }

  return { sequence, isLoading, regenerate }
}

// Helper to convert ShuffledQuestion to format expected by existing game components
export function shuffledQuestionToMathProblem(sq: ShuffledQuestion, index: number) {
  return {
    id: index, // MathProblem expects numeric id
    type: sq.operation,
    num1: sq.num1,
    num2: sq.num2,
    answer: sq.answer,
    options: sq.options,
    interactionType: 'tap' as const,
    countingObjects: sq.countingObjects
  }
}
