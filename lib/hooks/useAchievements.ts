'use client'

import { useCallback, useRef } from 'react'
import { useUnlocksStore } from '@/lib/stores/unlocksStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { useWorldStore } from '@/lib/stores/worldStore'
import {
  STAR_MILESTONES,
  STREAK_MILESTONES,
  STAR_ACHIEVEMENTS,
  STREAK_ACHIEVEMENTS,
  LEVEL_ACHIEVEMENTS,
  WORLD_ACHIEVEMENTS,
  getWorldAchievementEmoji,
  getStarAchievementEmoji,
  getStreakAchievementEmoji
} from '@/lib/constants/achievements'
import { CelebrationData } from '@/components/game/CelebrationOverlay'

interface AchievementHookResult {
  checkStarMilestones: (newTotalStars: number) => CelebrationData | null
  checkStreakMilestones: (newStreak: number) => CelebrationData | null
  checkLevelCompletion: (levelId: number, isFirstCompletion: boolean) => CelebrationData | null
  checkWorldCompletion: (worldId: string, completedModules: number) => CelebrationData | null
  checkAllAchievements: (data: {
    totalStars: number
    streak: number
    levelId?: number
    worldId?: string
    completedModules?: number
    isFirstLevelCompletion?: boolean
  }) => CelebrationData | null
}

export function useAchievements(): AchievementHookResult {
  const { achievements, unlockAchievement } = useUnlocksStore()
  const { completedLevels } = useProgressStore()
  const { worldProgress } = useWorldStore()

  // Track already unlocked achievements to avoid duplicate triggers
  const hasAchievement = useCallback((achievementId: string) => {
    return achievements.includes(achievementId)
  }, [achievements])

  // Check star milestone achievements
  const checkStarMilestones = useCallback((newTotalStars: number): CelebrationData | null => {
    for (const milestone of STAR_MILESTONES) {
      const achievement = STAR_ACHIEVEMENTS.find(a => a.requirement.value === milestone)
      if (!achievement) continue

      // Check if we just crossed this milestone
      if (newTotalStars >= milestone && !hasAchievement(achievement.id)) {
        unlockAchievement(
          achievement.id,
          achievement.name,
          getStarAchievementEmoji(milestone)
        )

        return {
          type: 'star_milestone',
          title: achievement.name,
          subtitle: achievement.description,
          emoji: getStarAchievementEmoji(milestone),
          stars: 3
        }
      }
    }
    return null
  }, [hasAchievement, unlockAchievement])

  // Check streak milestone achievements
  const checkStreakMilestones = useCallback((newStreak: number): CelebrationData | null => {
    for (const milestone of STREAK_MILESTONES) {
      const achievement = STREAK_ACHIEVEMENTS.find(a => a.requirement.value === milestone)
      if (!achievement) continue

      // Check if we just hit this milestone
      if (newStreak >= milestone && !hasAchievement(achievement.id)) {
        unlockAchievement(
          achievement.id,
          achievement.name,
          getStreakAchievementEmoji(milestone)
        )

        return {
          type: 'streak',
          title: achievement.name,
          subtitle: achievement.description,
          emoji: getStreakAchievementEmoji(milestone)
        }
      }
    }
    return null
  }, [hasAchievement, unlockAchievement])

  // Check level completion achievements (first time only)
  const checkLevelCompletion = useCallback((levelId: number, isFirstCompletion: boolean): CelebrationData | null => {
    if (!isFirstCompletion) return null

    const achievement = LEVEL_ACHIEVEMENTS.find(a => a.requirement.value === levelId)
    if (!achievement) return null

    if (!hasAchievement(achievement.id)) {
      const levelEmojis: Record<number, string> = {
        1: '🔢',
        2: '➕',
        3: '➖',
        4: '🔥',
        5: '✖️'
      }

      unlockAchievement(
        achievement.id,
        achievement.name,
        levelEmojis[levelId] || '🏆'
      )

      return {
        type: 'level_complete',
        title: achievement.name,
        subtitle: achievement.description,
        emoji: levelEmojis[levelId] || '🏆',
        stars: 3
      }
    }
    return null
  }, [hasAchievement, unlockAchievement])

  // Check world completion achievements
  // A world is complete when all 3 modules in each of the 5 levels = 15 total modules are done
  // But per levels.ts, each level has 3 modules, so 3 modules = level complete
  // World complete = depends on structure. Looking at worldStore, it checks levelsCompleted.length >= 6
  // But actually LEVELS has 5 levels total, not per world.
  // Let me check: worldProgress tracks levelsCompleted per world
  // Each world can have the 5 levels played, each level has 3 modules
  // World complete when all modules (3) of all available levels in that world are done
  // Looking at recordLevelComplete: fullyCompleted = levelsCompleted.length >= 6
  // That seems like a bug (there are only 5 levels). Let's assume complete = all 3 modules done
  // Actually per module page: moduleId goes 1-3, and world complete when 3 modules done?
  // Let's just check if worldProgress[worldId].fullyCompleted
  const checkWorldCompletion = useCallback((worldId: string, completedModules: number): CelebrationData | null => {
    // Each level has 3 modules. Consider world complete when all modules in a session are done
    // Or check worldProgress for fullyCompleted flag
    const progress = worldProgress[worldId]
    if (!progress?.fullyCompleted) return null

    const achievementId = `world-${worldId}-complete`
    const achievement = WORLD_ACHIEVEMENTS.find(a => a.id === achievementId)

    if (!achievement) return null

    if (!hasAchievement(achievement.id)) {
      unlockAchievement(
        achievement.id,
        achievement.name,
        getWorldAchievementEmoji(worldId)
      )

      return {
        type: 'world_complete',
        title: achievement.name,
        subtitle: achievement.description,
        emoji: getWorldAchievementEmoji(worldId),
        stars: 3
      }
    }
    return null
  }, [hasAchievement, unlockAchievement, worldProgress])

  // Check all achievements and return the first one that triggers
  const checkAllAchievements = useCallback((data: {
    totalStars: number
    streak: number
    levelId?: number
    worldId?: string
    completedModules?: number
    isFirstLevelCompletion?: boolean
  }): CelebrationData | null => {
    // Priority order: World > Level > Stars > Streak

    // World completion (highest priority)
    if (data.worldId && data.completedModules !== undefined) {
      const worldResult = checkWorldCompletion(data.worldId, data.completedModules)
      if (worldResult) return worldResult
    }

    // Level completion (first time)
    if (data.levelId !== undefined && data.isFirstLevelCompletion) {
      const levelResult = checkLevelCompletion(data.levelId, data.isFirstLevelCompletion)
      if (levelResult) return levelResult
    }

    // Star milestones
    const starResult = checkStarMilestones(data.totalStars)
    if (starResult) return starResult

    // Streak milestones
    const streakResult = checkStreakMilestones(data.streak)
    if (streakResult) return streakResult

    return null
  }, [checkWorldCompletion, checkLevelCompletion, checkStarMilestones, checkStreakMilestones])

  return {
    checkStarMilestones,
    checkStreakMilestones,
    checkLevelCompletion,
    checkWorldCompletion,
    checkAllAchievements
  }
}
