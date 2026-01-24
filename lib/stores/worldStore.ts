// World progression state store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WORLDS, World, isWorldUnlocked, getWorldById } from '@/lib/constants/worlds'

export interface WorldProgress {
  worldId: string
  levelsCompleted: number[]
  totalStarsInWorld: number
  fullyCompleted: boolean
}

export interface WorldState {
  // Currently selected world
  currentWorldId: string

  // World progress
  worldProgress: Record<string, WorldProgress>

  // Worlds that have been unlocked (shown unlock animation)
  unlockedWorlds: string[]

  // Newly unlocked world (for showing celebration)
  newlyUnlockedWorld: string | null

  // Actions
  setCurrentWorld: (worldId: string) => void
  checkWorldUnlocks: (totalStars: number) => string | null
  markWorldAsSeen: (worldId: string) => void
  recordLevelComplete: (worldId: string, levelId: number, stars: number) => void
  isWorldFullyCompleted: (worldId: string) => boolean
  getAvailableWorlds: (totalStars: number) => World[]
  clearNewlyUnlockedWorld: () => void
  resetWorldProgress: () => void
}

export const useWorldStore = create<WorldState>()(
  persist(
    (set, get) => ({
      currentWorldId: 'jungle', // Start in jungle
      worldProgress: {},
      unlockedWorlds: ['jungle'], // Jungle always unlocked
      newlyUnlockedWorld: null,

      setCurrentWorld: (worldId) => {
        const { unlockedWorlds } = get()
        if (unlockedWorlds.includes(worldId)) {
          set({ currentWorldId: worldId })
        }
      },

      checkWorldUnlocks: (totalStars) => {
        const { unlockedWorlds, worldProgress } = get()

        // Get completed worlds for rainbow realm check
        const completedWorlds = Object.entries(worldProgress)
          .filter(([, progress]) => progress.fullyCompleted)
          .map(([worldId]) => worldId)

        // Check each world
        for (const world of WORLDS) {
          if (!unlockedWorlds.includes(world.id)) {
            if (isWorldUnlocked(world.id, totalStars, completedWorlds)) {
              set({
                unlockedWorlds: [...unlockedWorlds, world.id],
                newlyUnlockedWorld: world.id
              })
              return world.id
            }
          }
        }

        // Check rainbow realm
        if (!unlockedWorlds.includes('rainbow')) {
          if (isWorldUnlocked('rainbow', totalStars, completedWorlds)) {
            set({
              unlockedWorlds: [...unlockedWorlds, 'rainbow'],
              newlyUnlockedWorld: 'rainbow'
            })
            return 'rainbow'
          }
        }

        return null
      },

      markWorldAsSeen: (worldId) => {
        set((state) => {
          if (state.unlockedWorlds.includes(worldId)) {
            return state
          }
          return { unlockedWorlds: [...state.unlockedWorlds, worldId] }
        })
      },

      recordLevelComplete: (worldId, levelId, stars) => {
        set((state) => {
          const current = state.worldProgress[worldId] || {
            worldId,
            levelsCompleted: [],
            totalStarsInWorld: 0,
            fullyCompleted: false
          }

          const levelsCompleted = current.levelsCompleted.includes(levelId)
            ? current.levelsCompleted
            : [...current.levelsCompleted, levelId]

          // A world is fully completed when all 6 levels are done
          const fullyCompleted = levelsCompleted.length >= 6

          return {
            worldProgress: {
              ...state.worldProgress,
              [worldId]: {
                ...current,
                levelsCompleted,
                totalStarsInWorld: current.totalStarsInWorld + stars,
                fullyCompleted
              }
            }
          }
        })
      },

      isWorldFullyCompleted: (worldId) => {
        const progress = get().worldProgress[worldId]
        return progress?.fullyCompleted || false
      },

      getAvailableWorlds: (totalStars) => {
        const { unlockedWorlds, worldProgress } = get()

        const completedWorlds = Object.entries(worldProgress)
          .filter(([, progress]) => progress.fullyCompleted)
          .map(([worldId]) => worldId)

        return WORLDS.filter((world) =>
          isWorldUnlocked(world.id, totalStars, completedWorlds)
        )
      },

      clearNewlyUnlockedWorld: () => {
        set({ newlyUnlockedWorld: null })
      },

      resetWorldProgress: () => {
        set({
          currentWorldId: 'jungle',
          worldProgress: {},
          unlockedWorlds: ['jungle'],
          newlyUnlockedWorld: null
        })
      }
    }),
    {
      name: 'mathquest-worlds',
      version: 1
    }
  )
)
