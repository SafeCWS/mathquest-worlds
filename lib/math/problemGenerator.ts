// Math problem generator for MathQuest Worlds
import type { MathOperation, InteractionType, Module } from '@/lib/constants/levels'
import type { MathProblem } from '@/lib/stores/gameStore'
import { getWorldById } from '@/lib/constants/worlds'

// THEMED OBJECT COLLECTIONS - Huge variety, organized by world!
const WORLD_OBJECTS: Record<string, string[][]> = {
  lovelycat: [
    ['🐱', '😺', '😸', '😻', '🙀'], // Cat faces
    ['🐈', '🐈‍⬛', '🐾', '🐱', '😺'], // Cats
    ['🎀', '💗', '💖', '💕', '💝'], // Bows and hearts
    ['🧶', '🐟', '🥛', '🐾', '🎀'], // Cat toys and treats
    ['🌸', '✨', '⭐', '🌷', '🌺'], // Dreamy items
    ['☁️', '🌈', '🦋', '🎀', '💫'], // Sky and sparkles
  ],
  jungle: [
    ['🦁', '🐯', '🦒', '🐘', '🦓'], // Safari animals
    ['🐵', '🦧', '🦍', '🐒', '🙊'], // Monkeys
    ['🦜', '🦚', '🦩', '🦆', '🐦'], // Birds
    ['🦋', '🐛', '🐝', '🐞', '🦗'], // Insects
    ['🌴', '🌺', '🥥', '🍌', '🌿'], // Plants
    ['🐍', '🦎', '🐊', '🐸', '🦕'], // Reptiles
  ],
  ocean: [
    ['🐙', '🦑', '🦐', '🦀', '🦞'], // Crustaceans
    ['🐠', '🐟', '🐡', '🦈', '🐬'], // Fish
    ['🐳', '🐋', '🦭', '🦦', '🐧'], // Marine mammals
    ['🐚', '🪸', '🦪', '⭐', '🌊'], // Ocean items
    ['🧜‍♀️', '🧜‍♂️', '🏄', '🚤', '⚓'], // Ocean fun
  ],
  space: [
    ['🚀', '🛸', '🛰️', '🛩️', '✈️'], // Vehicles
    ['⭐', '🌟', '💫', '✨', '☄️'], // Stars
    ['🌍', '🌎', '🌏', '🪐', '🌙'], // Planets
    ['👽', '👾', '🤖', '👨‍🚀', '👩‍🚀'], // Space beings
    ['🔭', '🌌', '🎆', '🎇', '💥'], // Space effects
  ],
  candy: [
    ['🍭', '🍬', '🍫', '🧁', '🍪'], // Sweets
    ['🍰', '🎂', '🍩', '🥧', '🍮'], // Cakes
    ['🍦', '🍨', '🧇', '🥞', '🍡'], // Desserts
    ['🍓', '🍒', '🍇', '🫐', '🍑'], // Fruits
    ['🎀', '🎈', '🎁', '🎊', '🎉'], // Party
  ],
  castle: [
    ['👸', '🤴', '👑', '🏰', '🗡️'], // Royalty
    ['🦄', '🐲', '🧙‍♂️', '🧚', '🧝'], // Fantasy
    ['💎', '💍', '🔮', '⚔️', '🛡️'], // Treasures
    ['🌹', '🌷', '🌻', '🌼', '🏵️'], // Flowers
    ['🦅', '🦢', '🕊️', '🦉', '🐎'], // Castle animals
  ],
  dino: [
    ['🦕', '🦖', '🐊', '🦎', '🐢'], // Dinos
    ['🥚', '🪺', '🌿', '🌴', '🪨'], // Environment
    ['🦴', '🪵', '🌋', '⛰️', '🏔️'], // Landscape
    ['🦤', '🐦', '🦜', '🦩', '🐸'], // Creatures
  ]
}

// Session-based object tracker to prevent repeats
let sessionUsedObjects: Set<string> = new Set()
let lastObjectIndex = 0

// Get a unique object that hasn't been used this session
function getUniqueObject(worldId: string): string {
  const worldGroups = WORLD_OBJECTS[worldId] || WORLD_OBJECTS.jungle
  const allObjects = worldGroups.flat()

  // Find an unused object
  for (let i = 0; i < allObjects.length; i++) {
    const idx = (lastObjectIndex + i) % allObjects.length
    const obj = allObjects[idx]
    if (!sessionUsedObjects.has(obj)) {
      sessionUsedObjects.add(obj)
      lastObjectIndex = idx + 1
      return obj
    }
  }

  // If all used, reset and start fresh
  sessionUsedObjects.clear()
  lastObjectIndex = Math.floor(Math.random() * allObjects.length)
  const obj = allObjects[lastObjectIndex]
  sessionUsedObjects.add(obj)
  return obj
}

// Get a random group of themed objects (ensures variety)
function getThemedObjectGroup(worldId: string): string[] {
  const worldGroups = WORLD_OBJECTS[worldId] || WORLD_OBJECTS.jungle
  const randomGroup = worldGroups[Math.floor(Math.random() * worldGroups.length)]
  return [...randomGroup].sort(() => Math.random() - 0.5)
}

// Shuffle array using Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Generate random number in range (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Generate wrong answers that are close to correct answer
// CONSTRAINED to stay within the level's number range (minRange, maxRange)
function generateWrongAnswers(
  correctAnswer: number,
  count: number,
  operation: MathOperation,
  minRange: number = 1,
  maxRange: number = 20
): number[] {
  const wrongAnswers: Set<number> = new Set()

  // For counting levels with small ranges (1-5, 1-8), use small offsets only
  const isSmallRange = maxRange <= 10
  const offsets = isSmallRange
    ? [-2, -1, 1, 2, -3, 3]  // Small offsets for young learners
    : [-3, -2, -1, 1, 2, 3, -5, 5, -10, 10]  // Larger offsets for advanced

  for (const offset of shuffleArray(offsets)) {
    if (wrongAnswers.size >= count) break

    const wrongAnswer = correctAnswer + offset
    // CRITICAL: Constrain to stay within the level's range
    if (wrongAnswer >= minRange && wrongAnswer <= maxRange && wrongAnswer !== correctAnswer) {
      wrongAnswers.add(wrongAnswer)
    }
  }

  // If we still need more, generate random ones within the allowed range
  let attempts = 0
  while (wrongAnswers.size < count && attempts < 30) {
    const wrong = randomInt(minRange, maxRange)
    if (wrong !== correctAnswer) {
      wrongAnswers.add(wrong)
    }
    attempts++
  }

  return Array.from(wrongAnswers).slice(0, count)
}

// Generate a single counting problem with UNIQUE objects!
function generateCountingProblem(
  id: number,
  min: number,
  max: number,
  interactionType: InteractionType,
  worldId: string
): MathProblem {
  const count = randomInt(min, max)

  // Use unique object for this problem
  const object = getUniqueObject(worldId)

  // Create array of objects to count
  const objects = Array(count).fill(object)

  // Pass min/max to constrain wrong answers within the level's range
  const wrongAnswers = generateWrongAnswers(count, 3, 'counting', min, max)
  const options = shuffleArray([count, ...wrongAnswers])

  return {
    id,
    type: 'counting',
    num1: count,
    num2: 0,
    answer: count,
    options,
    interactionType,
    countingObjects: objects
  }
}

// Generate a single addition problem with UNIQUE objects!
function generateAdditionProblem(
  id: number,
  min: number,
  max: number,
  interactionType: InteractionType,
  worldId: string
): MathProblem {
  // For single digit, keep both numbers small
  const num1 = randomInt(min, Math.min(max, 9))
  const num2 = randomInt(min, Math.min(max - num1, 9))
  const answer = num1 + num2

  // For addition, wrong answers should be reasonable (1 to max sum range)
  const maxPossibleSum = Math.min(max * 2, 20)
  const wrongAnswers = generateWrongAnswers(answer, 3, 'addition', 1, maxPossibleSum)
  const options = shuffleArray([answer, ...wrongAnswers])

  // Use unique objects for variety!
  const object = getUniqueObject(worldId)
  const objects = [...Array(num1).fill(object), ...Array(num2).fill(object)]

  return {
    id,
    type: 'addition',
    num1,
    num2,
    answer,
    options,
    interactionType,
    countingObjects: objects
  }
}

// Generate a single subtraction problem with UNIQUE objects!
function generateSubtractionProblem(
  id: number,
  min: number,
  max: number,
  interactionType: InteractionType,
  worldId: string
): MathProblem {
  // Ensure num1 >= num2 for no negative results
  const num1 = randomInt(Math.max(min, 2), max)
  const num2 = randomInt(1, num1 - 1)
  const answer = num1 - num2

  // For subtraction, answers are always between 0 and max
  const wrongAnswers = generateWrongAnswers(answer, 3, 'subtraction', 0, max)
  const options = shuffleArray([answer, ...wrongAnswers])

  // Use unique objects for variety!
  const object = getUniqueObject(worldId)
  const objects = Array(num1).fill(object)

  return {
    id,
    type: 'subtraction',
    num1,
    num2,
    answer,
    options,
    interactionType,
    countingObjects: objects
  }
}

// Generate a single multiplication problem
function generateMultiplicationProblem(
  id: number,
  min: number,
  max: number,
  interactionType: InteractionType,
  worldId: string,
  moduleId: number
): MathProblem {
  // Determine which times table based on module
  let multiplier: number
  switch (moduleId) {
    case 1:
      multiplier = 2 // 2 times table
      break
    case 2:
      multiplier = 5 // 5 times table
      break
    case 3:
      multiplier = 10 // 10 times table
      break
    default:
      multiplier = [2, 5, 10][randomInt(0, 2)] // Mixed
  }

  const num1 = randomInt(min, max)
  const num2 = multiplier
  const answer = num1 * num2

  // For multiplication, reasonable range based on the times table
  const maxPossibleProduct = max * multiplier
  const wrongAnswers = generateWrongAnswers(answer, 3, 'multiplication', 1, maxPossibleProduct)
  const options = shuffleArray([answer, ...wrongAnswers])

  // Create groups of objects for visualization
  const object = getUniqueObject(worldId)
  const objects: string[] = []
  for (let i = 0; i < num1; i++) {
    for (let j = 0; j < num2; j++) {
      objects.push(object)
    }
  }

  return {
    id,
    type: 'multiplication',
    num1,
    num2,
    answer,
    options,
    interactionType,
    countingObjects: objects.slice(0, 50) // Cap at 50 for display
  }
}

// Main generator function - NOW WITH NO REPEATS!
export function generateProblems(
  worldId: string,
  operation: MathOperation,
  module: Module
): MathProblem[] {
  // Reset session tracking for fresh game
  sessionUsedObjects.clear()
  lastObjectIndex = Math.floor(Math.random() * 20)

  const problems: MathProblem[] = []

  for (let i = 0; i < module.questionsCount; i++) {
    // SHUFFLE interaction types for variety
    const shuffledInteractions = shuffleArray([...module.interactionTypes])
    const interactionType = shuffledInteractions[i % shuffledInteractions.length]

    let problem: MathProblem

    // For COUNTING module with higher numbers, mix in variety to keep it interesting!
    // But for Level 1 (maxNumber <= 8), keep it as PURE counting only
    // 50% counting, 30% simple addition, 20% simple subtraction (only for maxNumber >= 10)
    let actualOperation = operation
    if (operation === 'counting' && module.maxNumber >= 10) {
      const rand = Math.random()
      if (rand < 0.3) {
        actualOperation = 'addition' // 30% addition
      } else if (rand < 0.5) {
        actualOperation = 'subtraction' // 20% subtraction
      }
      // else stays as counting (50%)
    }
    // Level 1 (maxNumber 5 or 8) stays as pure counting - no mixing!

    switch (actualOperation) {
      case 'counting':
        problem = generateCountingProblem(
          i,
          module.minNumber,
          module.maxNumber,
          interactionType,
          worldId
        )
        break
      case 'addition':
        problem = generateAdditionProblem(
          i,
          1, // Start easy for mixed-in addition
          Math.min(module.maxNumber, 5),
          interactionType,
          worldId
        )
        break
      case 'subtraction':
        // For mixed-in subtraction in counting modules, keep numbers small
        const isCountingModule = operation === 'counting'
        problem = generateSubtractionProblem(
          i,
          isCountingModule ? 2 : module.minNumber,
          isCountingModule ? Math.min(module.maxNumber, 8) : module.maxNumber,
          interactionType,
          worldId
        )
        break
      case 'multiplication':
        problem = generateMultiplicationProblem(
          i,
          module.minNumber,
          module.maxNumber,
          interactionType,
          worldId,
          module.id
        )
        break
      default:
        problem = generateCountingProblem(
          i,
          module.minNumber,
          module.maxNumber,
          interactionType,
          worldId
        )
    }

    problems.push(problem)
  }

  // SHUFFLE the problems order for unpredictability!
  return shuffleArray(problems).map((p, idx) => ({ ...p, id: idx }))
}

// Generate practice problems (quick play)
export function generatePracticeProblems(
  worldId: string,
  operation: MathOperation,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number = 10
): MathProblem[] {
  // Reset session tracking
  sessionUsedObjects.clear()

  const difficultyRanges = {
    easy: { min: 1, max: 5 },
    medium: { min: 1, max: 10 },
    hard: { min: 1, max: 20 }
  }

  const range = difficultyRanges[difficulty]
  const interactionTypes: InteractionType[] = ['choice', 'tap', 'drag']

  const problems: MathProblem[] = []

  for (let i = 0; i < count; i++) {
    const interactionType = interactionTypes[i % interactionTypes.length]

    let problem: MathProblem

    switch (operation) {
      case 'counting':
        problem = generateCountingProblem(
          i,
          range.min,
          range.max,
          interactionType,
          worldId
        )
        break
      case 'addition':
        problem = generateAdditionProblem(
          i,
          range.min,
          range.max,
          interactionType,
          worldId
        )
        break
      case 'subtraction':
        problem = generateSubtractionProblem(
          i,
          range.min,
          range.max,
          interactionType,
          worldId
        )
        break
      case 'multiplication':
        problem = generateMultiplicationProblem(
          i,
          range.min,
          range.max,
          interactionType,
          worldId,
          1
        )
        break
      default:
        problem = generateCountingProblem(
          i,
          range.min,
          range.max,
          interactionType,
          worldId
        )
    }

    problems.push(problem)
  }

  return problems
}
