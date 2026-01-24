// Unlocks tracking store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UnlockNotification {
  id: string
  type: 'item' | 'world' | 'achievement'
  itemId: string
  itemName: string
  category?: string
  emoji?: string
  timestamp: number
}

export interface UnlocksState {
  // Hydration tracking for SSR
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void

  // Items that have been unlocked
  unlockedItems: string[]

  // New unlocks that haven't been viewed yet
  pendingUnlocks: UnlockNotification[]

  // Achievement unlocks
  achievements: string[]

  // Actions
  unlockItem: (itemId: string, itemName: string, category: string) => void
  unlockAchievement: (achievementId: string, achievementName: string, emoji: string) => void
  clearPendingUnlock: (id: string) => void
  clearAllPendingUnlocks: () => void
  hasUnlockedItem: (itemId: string) => boolean
  checkAndUnlockByStars: (totalStars: number) => UnlockNotification[]
  checkAndUnlockByStreak: (streak: number) => UnlockNotification[]
  checkAndUnlockByLevel: (levelId: number | 'all') => UnlockNotification[]
  checkAndUnlockStarAchievements: (totalStars: number, previousStars: number) => UnlockNotification[]
  checkAndUnlockStreakAchievements: (streak: number) => UnlockNotification[]
  checkAndUnlockLevelAchievements: (levelId: number, isFirstCompletion: boolean) => UnlockNotification[]
  checkAndUnlockWorldAchievements: (worldId: string, isWorldComplete: boolean) => UnlockNotification[]
  resetUnlocks: () => void
}

// Import character items for checking unlocks
import {
  HAIR_STYLES,
  HAIR_COLORS,
  EYE_SHAPES,
  OUTFITS,
  ACCESSORIES,
  PETS,
  EFFECTS,
  CharacterItem
} from '@/lib/constants/characterItems'

// Import achievement definitions
import {
  STAR_MILESTONES,
  STREAK_MILESTONES,
  STAR_ACHIEVEMENTS,
  STREAK_ACHIEVEMENTS,
  LEVEL_ACHIEVEMENTS,
  WORLD_ACHIEVEMENTS,
  getStarAchievementEmoji,
  getStreakAchievementEmoji,
  getWorldAchievementEmoji
} from '@/lib/constants/achievements'

const getAllItems = (): CharacterItem[] => [
  ...HAIR_STYLES,
  ...EYE_SHAPES,
  ...OUTFITS,
  ...ACCESSORIES,
  ...PETS,
  ...EFFECTS
]

export const useUnlocksStore = create<UnlocksState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      unlockedItems: [],
      pendingUnlocks: [],
      achievements: [],

      unlockItem: (itemId, itemName, category) => {
        if (get().unlockedItems.includes(itemId)) return

        const notification: UnlockNotification = {
          id: `item-${itemId}-${Date.now()}`,
          type: 'item',
          itemId,
          itemName,
          category,
          timestamp: Date.now()
        }

        set((state) => ({
          unlockedItems: [...state.unlockedItems, itemId],
          pendingUnlocks: [...state.pendingUnlocks, notification]
        }))
      },

      unlockAchievement: (achievementId, achievementName, emoji) => {
        if (get().achievements.includes(achievementId)) return

        const notification: UnlockNotification = {
          id: `achievement-${achievementId}-${Date.now()}`,
          type: 'achievement',
          itemId: achievementId,
          itemName: achievementName,
          emoji,
          timestamp: Date.now()
        }

        set((state) => ({
          achievements: [...state.achievements, achievementId],
          pendingUnlocks: [...state.pendingUnlocks, notification]
        }))
      },

      clearPendingUnlock: (id) => {
        set((state) => ({
          pendingUnlocks: state.pendingUnlocks.filter((u) => u.id !== id)
        }))
      },

      clearAllPendingUnlocks: () => {
        set({ pendingUnlocks: [] })
      },

      hasUnlockedItem: (itemId) => {
        return get().unlockedItems.includes(itemId)
      },

      checkAndUnlockByStars: (totalStars) => {
        const { unlockedItems, unlockItem } = get()
        const newUnlocks: UnlockNotification[] = []

        for (const item of getAllItems()) {
          if (
            item.unlockType === 'stars' &&
            typeof item.unlockValue === 'number' &&
            totalStars >= item.unlockValue &&
            !unlockedItems.includes(item.id)
          ) {
            unlockItem(item.id, item.name, item.category)
            newUnlocks.push({
              id: `item-${item.id}-${Date.now()}`,
              type: 'item',
              itemId: item.id,
              itemName: item.name,
              category: item.category,
              timestamp: Date.now()
            })
          }
        }

        // Check hair colors separately
        for (const hairColor of HAIR_COLORS) {
          if (
            hairColor.unlockType === 'stars' &&
            typeof hairColor.unlockValue === 'number' &&
            totalStars >= hairColor.unlockValue
          ) {
            const colorId = `haircolor-${hairColor.color}`
            if (!unlockedItems.includes(colorId)) {
              unlockItem(colorId, `Hair Color: ${hairColor.color}`, 'hairColor')
              newUnlocks.push({
                id: `item-${colorId}-${Date.now()}`,
                type: 'item',
                itemId: colorId,
                itemName: 'Fantasy Hair Color',
                category: 'hairColor',
                timestamp: Date.now()
              })
            }
          }
        }

        return newUnlocks
      },

      checkAndUnlockByStreak: (streak) => {
        const { unlockedItems, unlockItem } = get()
        const newUnlocks: UnlockNotification[] = []

        for (const item of getAllItems()) {
          if (
            item.unlockType === 'streak' &&
            typeof item.unlockValue === 'number' &&
            streak >= item.unlockValue &&
            !unlockedItems.includes(item.id)
          ) {
            unlockItem(item.id, item.name, item.category)
            newUnlocks.push({
              id: `item-${item.id}-${Date.now()}`,
              type: 'item',
              itemId: item.id,
              itemName: item.name,
              category: item.category,
              timestamp: Date.now()
            })
          }
        }

        return newUnlocks
      },

      checkAndUnlockByLevel: (levelId) => {
        const { unlockedItems, unlockItem } = get()
        const newUnlocks: UnlockNotification[] = []

        for (const item of getAllItems()) {
          if (item.unlockType === 'level') {
            const matches =
              levelId === 'all'
                ? item.unlockValue === 'all'
                : item.unlockValue === levelId

            if (matches && !unlockedItems.includes(item.id)) {
              unlockItem(item.id, item.name, item.category)
              newUnlocks.push({
                id: `item-${item.id}-${Date.now()}`,
                type: 'item',
                itemId: item.id,
                itemName: item.name,
                category: item.category,
                timestamp: Date.now()
              })
            }
          }
        }

        return newUnlocks
      },

      // Check and unlock star milestone achievements (15, 40, 70, 100)
      checkAndUnlockStarAchievements: (totalStars, previousStars) => {
        const { achievements, unlockAchievement } = get()
        const newUnlocks: UnlockNotification[] = []

        for (const milestone of STAR_MILESTONES) {
          // Only trigger if we just crossed this milestone
          if (totalStars >= milestone && previousStars < milestone) {
            const achievement = STAR_ACHIEVEMENTS.find(a => a.requirement.value === milestone)
            if (achievement && !achievements.includes(achievement.id)) {
              const emoji = getStarAchievementEmoji(milestone)
              unlockAchievement(achievement.id, achievement.name, emoji)
              newUnlocks.push({
                id: `achievement-${achievement.id}-${Date.now()}`,
                type: 'achievement',
                itemId: achievement.id,
                itemName: achievement.name,
                emoji,
                timestamp: Date.now()
              })
            }
          }
        }

        return newUnlocks
      },

      // Check and unlock streak achievements (3, 7, 14, 30)
      checkAndUnlockStreakAchievements: (streak) => {
        const { achievements, unlockAchievement } = get()
        const newUnlocks: UnlockNotification[] = []

        for (const milestone of STREAK_MILESTONES) {
          if (streak >= milestone) {
            const achievement = STREAK_ACHIEVEMENTS.find(a => a.requirement.value === milestone)
            if (achievement && !achievements.includes(achievement.id)) {
              const emoji = getStreakAchievementEmoji(milestone)
              unlockAchievement(achievement.id, achievement.name, emoji)
              newUnlocks.push({
                id: `achievement-${achievement.id}-${Date.now()}`,
                type: 'achievement',
                itemId: achievement.id,
                itemName: achievement.name,
                emoji,
                timestamp: Date.now()
              })
            }
          }
        }

        return newUnlocks
      },

      // Check and unlock level completion achievements
      checkAndUnlockLevelAchievements: (levelId, isFirstCompletion) => {
        if (!isFirstCompletion) return []

        const { achievements, unlockAchievement } = get()
        const newUnlocks: UnlockNotification[] = []

        const achievement = LEVEL_ACHIEVEMENTS.find(a => a.requirement.value === levelId)
        if (achievement && !achievements.includes(achievement.id)) {
          const levelEmojis: Record<number, string> = {
            1: '🔢',
            2: '➕',
            3: '➖',
            4: '🔥',
            5: '✖️'
          }
          const emoji = levelEmojis[levelId] || '🏆'
          unlockAchievement(achievement.id, achievement.name, emoji)
          newUnlocks.push({
            id: `achievement-${achievement.id}-${Date.now()}`,
            type: 'achievement',
            itemId: achievement.id,
            itemName: achievement.name,
            emoji,
            timestamp: Date.now()
          })
        }

        return newUnlocks
      },

      // Check and unlock world completion achievements
      checkAndUnlockWorldAchievements: (worldId, isWorldComplete) => {
        if (!isWorldComplete) return []

        const { achievements, unlockAchievement } = get()
        const newUnlocks: UnlockNotification[] = []

        const achievementId = `world-${worldId}-complete`
        const achievement = WORLD_ACHIEVEMENTS.find(a => a.id === achievementId)

        if (achievement && !achievements.includes(achievement.id)) {
          const emoji = getWorldAchievementEmoji(worldId)
          unlockAchievement(achievement.id, achievement.name, emoji)
          newUnlocks.push({
            id: `achievement-${achievement.id}-${Date.now()}`,
            type: 'achievement',
            itemId: achievement.id,
            itemName: achievement.name,
            emoji,
            timestamp: Date.now()
          })
        }

        return newUnlocks
      },

      resetUnlocks: () => {
        set({
          unlockedItems: [],
          pendingUnlocks: [],
          achievements: []
        })
      }
    }),
    {
      name: 'mathquest-unlocks',
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
