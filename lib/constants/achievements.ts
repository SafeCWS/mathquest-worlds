// Achievement definitions for MathQuest Worlds

export interface Achievement {
  id: string
  name: string
  description: string
  emoji: string
  category: 'stars' | 'streak' | 'level' | 'world' | 'special'
  requirement: {
    type: 'stars' | 'streak' | 'level_complete' | 'world_complete' | 'modules_complete'
    value: number | string
  }
}

export const STAR_ACHIEVEMENTS: Achievement[] = [
  { id: 'star-collector-15', name: 'Star Collector', description: 'Earn your first 15 stars!', emoji: '15', category: 'stars', requirement: { type: 'stars', value: 15 } },
  { id: 'star-hunter-40', name: 'Star Hunter', description: 'Collect 40 shining stars!', emoji: '40', category: 'stars', requirement: { type: 'stars', value: 40 } },
  { id: 'star-master-70', name: 'Star Master', description: 'Achieve 70 brilliant stars!', emoji: '70', category: 'stars', requirement: { type: 'stars', value: 70 } },
  { id: 'superstar-100', name: 'Superstar', description: 'Reach 100 amazing stars!', emoji: '100', category: 'stars', requirement: { type: 'stars', value: 100 } }
]

export const STREAK_ACHIEVEMENTS: Achievement[] = [
  { id: 'streak-starter-3', name: 'Streak Starter', description: 'Play 3 days in a row!', emoji: '3', category: 'streak', requirement: { type: 'streak', value: 3 } },
  { id: 'week-warrior-7', name: 'Week Warrior', description: 'Keep your streak for 7 days!', emoji: '7', category: 'streak', requirement: { type: 'streak', value: 7 } },
  { id: 'fortnight-hero-14', name: 'Fortnight Hero', description: 'Amazing 14-day streak!', emoji: '14', category: 'streak', requirement: { type: 'streak', value: 14 } },
  { id: 'monthly-legend-30', name: 'Monthly Legend', description: 'Incredible 30-day streak!', emoji: '30', category: 'streak', requirement: { type: 'streak', value: 30 } }
]

export const LEVEL_ACHIEVEMENTS: Achievement[] = [
  { id: 'level-1-complete', name: 'Number Explorer', description: 'Complete your first counting level!', emoji: '1', category: 'level', requirement: { type: 'level_complete', value: 1 } },
  { id: 'level-2-complete', name: 'Addition Adventurer', description: 'Master the addition level!', emoji: '2', category: 'level', requirement: { type: 'level_complete', value: 2 } },
  { id: 'level-3-complete', name: 'Subtraction Star', description: 'Conquer the subtraction level!', emoji: '3', category: 'level', requirement: { type: 'level_complete', value: 3 } },
  { id: 'level-4-complete', name: 'Big Number Boss', description: 'Handle the big numbers level!', emoji: '4', category: 'level', requirement: { type: 'level_complete', value: 4 } },
  { id: 'level-5-complete', name: 'Multiplication Master', description: 'Complete the times tables level!', emoji: '5', category: 'level', requirement: { type: 'level_complete', value: 5 } }
]

export const WORLD_ACHIEVEMENTS: Achievement[] = [
  { id: 'world-jungle-complete', name: 'Jungle Champion', description: 'Complete all modules in Jungle Adventure!', emoji: 'jungle', category: 'world', requirement: { type: 'world_complete', value: 'jungle' } },
  { id: 'world-space-complete', name: 'Space Explorer', description: 'Complete all modules in Space Galaxy!', emoji: 'space', category: 'world', requirement: { type: 'world_complete', value: 'space' } },
  { id: 'world-ocean-complete', name: 'Ocean Ruler', description: 'Complete all modules in Ocean Kingdom!', emoji: 'ocean', category: 'world', requirement: { type: 'world_complete', value: 'ocean' } },
  { id: 'world-fairy-complete', name: 'Fairy Friend', description: 'Complete all modules in Fairy Kingdom!', emoji: 'fairy', category: 'world', requirement: { type: 'world_complete', value: 'fairy' } },
  { id: 'world-dino-complete', name: 'Dino Tamer', description: 'Complete all modules in Dino Land!', emoji: 'dino', category: 'world', requirement: { type: 'world_complete', value: 'dino' } },
  { id: 'world-candy-complete', name: 'Candy Conqueror', description: 'Complete all modules in Candy World!', emoji: 'candy', category: 'world', requirement: { type: 'world_complete', value: 'candy' } }
]

export const ALL_ACHIEVEMENTS: Achievement[] = [...STAR_ACHIEVEMENTS, ...STREAK_ACHIEVEMENTS, ...LEVEL_ACHIEVEMENTS, ...WORLD_ACHIEVEMENTS]
export const STAR_MILESTONES = [15, 40, 70, 100]
export const STREAK_MILESTONES = [3, 7, 14, 30]

export function getAchievementById(id: string): Achievement | undefined {
  return ALL_ACHIEVEMENTS.find(a => a.id === id)
}

export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.category === category)
}

export function getWorldAchievementEmoji(worldId: string): string {
  const worldEmojis: Record<string, string> = { jungle: '🌴', space: '🚀', ocean: '🧜', fairy: '🏰', dino: '🦖', candy: '🍭' }
  return worldEmojis[worldId] || '🏆'
}

export function getStarAchievementEmoji(stars: number): string {
  if (stars >= 100) return '💯'
  if (stars >= 70) return '🌟'
  if (stars >= 40) return '⭐'
  return '✨'
}

export function getStreakAchievementEmoji(streak: number): string {
  if (streak >= 30) return '👑'
  if (streak >= 14) return '🏆'
  if (streak >= 7) return '🔥'
  return '🎯'
}
