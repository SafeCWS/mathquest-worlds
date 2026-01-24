// Daily Challenge Generator for MathQuest Worlds
import { WORLDS } from "@/lib/constants/worlds"
import { LEVELS } from "@/lib/constants/levels"

export type ChallengeType = "speedRound" | "perfectScore" | "worldExplorer" | "streakBuilder"

export interface DailyChallenge {
  id: string
  type: ChallengeType
  title: string
  description: string
  emoji: string
  targetValue: number
  worldId?: string
  levelId?: number
  moduleId?: number
  reward: DailyChallengeReward
  difficulty: "easy" | "medium" | "hard"
}

export interface DailyChallengeReward {
  stars: number
  exclusiveItemId?: string
  exclusiveItemName?: string
}

export const DAILY_EXCLUSIVE_ITEMS = [
  { id: "daily-crown-sparkle", name: "Sparkle Crown", category: "accessory", emoji: "👑", description: "A magical crown that sparkles!" },
  { id: "daily-pet-star", name: "Star Buddy", category: "pet", emoji: "⭐", description: "A floating star friend!" },
  { id: "daily-outfit-rainbow", name: "Rainbow Champion Outfit", category: "outfit", emoji: "🌈", description: "Outfit of a true daily champion!" },
  { id: "daily-effect-fireworks", name: "Fireworks Effect", category: "effect", emoji: "🎆", description: "Celebrate with sparkly fireworks!" },
  { id: "daily-acc-trophy", name: "Golden Trophy", category: "accessory", emoji: "🏆", description: "A trophy for daily dedication!" }
]
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

function getDateSeed(date: Date = new Date()): number {
  return date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate()
}

function getDateId(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `daily-${y}-${m}-${d}`
}

const CHALLENGE_TEMPLATES: Record<ChallengeType, {
  titles: string[]
  descriptions: string[]
  emojis: string[]
  targetValues: { easy: number; medium: number; hard: number }
}> = {
  speedRound: {
    titles: ["Lightning Fast!", "Speed Star!", "Quick Thinker!", "Speedy Math!"],
    descriptions: ["Complete {target} problems super fast!", "Answer {target} questions in record time!", "Be a speed champion with {target} quick answers!"],
    emojis: ["⚡", "⏱️", "🏃", "💨"],
    targetValues: { easy: 3, medium: 5, hard: 7 }
  },
  perfectScore: {
    titles: ["Perfect Practice!", "No Mistakes!", "Flawless Victory!", "Perfect Score!"],
    descriptions: ["Get {target} correct in a row!", "Answer {target} perfectly!", "Be perfect with {target} answers!"],
    emojis: ["💯", "⭐", "✨", "🌟"],
    targetValues: { easy: 3, medium: 5, hard: 7 }
  },
  worldExplorer: {
    titles: ["World Explorer!", "Adventure Time!", "Journey Master!", "Explorer Quest!"],
    descriptions: ["Complete a module in {world}!", "Explore {world} today!", "Have an adventure in {world}!"],
    emojis: ["🗺️", "🌍", "🧭", "🏕️"],
    targetValues: { easy: 1, medium: 1, hard: 2 }
  },
  streakBuilder: {
    titles: ["Streak Builder!", "On Fire!", "Hot Streak!", "Combo Master!"],
    descriptions: ["Get a {target}-answer streak!", "Build a streak of {target}!", "Answer {target} correct in a row!"],
    emojis: ["🔥", "💪", "⚡", "🚀"],
    targetValues: { easy: 3, medium: 5, hard: 7 }
  }
}

export function generateDailyChallenge(
  date: Date = new Date(),
  skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): DailyChallenge {
  const seed = getDateSeed(date)
  const random = seededRandom(seed)
  const difficultyMap = { beginner: 'easy' as const, intermediate: 'medium' as const, advanced: 'hard' as const }
  const difficulty = difficultyMap[skillLevel]
  const dayOfWeek = date.getDay()
  const challengeTypes: ChallengeType[] = ['speedRound', 'perfectScore', 'worldExplorer', 'streakBuilder']
  const typeIndex = Math.floor(random() * challengeTypes.length + dayOfWeek) % challengeTypes.length
  const type = challengeTypes[typeIndex]
  const template = CHALLENGE_TEMPLATES[type]
  const titleIndex = Math.floor(random() * template.titles.length)
  const descIndex = Math.floor(random() * template.descriptions.length)
  const emojiIndex = Math.floor(random() * template.emojis.length)
  const targetValue = template.targetValues[difficulty]
  let worldId: string | undefined
  let levelId: number | undefined
  let moduleId: number | undefined
  if (type === 'worldExplorer') {
    worldId = WORLDS[Math.floor(random() * WORLDS.length)].id
    const levelIndex = Math.floor(random() * LEVELS.length)
    levelId = LEVELS[levelIndex].id
    moduleId = LEVELS[levelIndex].modules[Math.floor(random() * LEVELS[levelIndex].modules.length)].id
  }
  let description = template.descriptions[descIndex].replace('{target}', targetValue.toString())
  if (worldId) {
    const world = WORLDS.find(w => w.id === worldId)
    description = description.replace('{world}', world?.name || 'a magical world')
  }
  const baseStars = { easy: 5, medium: 10, hard: 15 }[difficulty]
  const dayOfMonth = date.getDate()
  const isExclusiveDay = dayOfMonth % 7 === 0
  let exclusiveItemId: string | undefined
  let exclusiveItemName: string | undefined
  if (isExclusiveDay) {
    const item = DAILY_EXCLUSIVE_ITEMS[Math.floor(dayOfMonth / 7) % DAILY_EXCLUSIVE_ITEMS.length]
    exclusiveItemId = item.id
    exclusiveItemName = item.name
  }
  return {
    id: getDateId(date),
    type,
    title: template.titles[titleIndex],
    description,
    emoji: template.emojis[emojiIndex],
    targetValue,
    worldId,
    levelId,
    moduleId,
    reward: { stars: baseStars, exclusiveItemId, exclusiveItemName },
    difficulty
  }
}

export function isNewChallenge(lastChallengeId: string | null): boolean {
  return lastChallengeId !== getDateId()
}

export function getTimeUntilNextChallenge(): { hours: number; minutes: number; seconds: number; totalMs: number } {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const totalMs = tomorrow.getTime() - now.getTime()
  return {
    hours: Math.floor(totalMs / 3600000),
    minutes: Math.floor((totalMs % 3600000) / 60000),
    seconds: Math.floor((totalMs % 60000) / 1000),
    totalMs
  }
}

export function getTodaysChallengeId(): string {
  return getDateId()
}
