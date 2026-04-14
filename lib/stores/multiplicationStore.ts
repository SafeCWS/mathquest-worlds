// Multiplication mastery state store
// Follows the exact Zustand + persist pattern from progressStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type GameMode = 'explorer' | 'match' | 'memory' | 'dice' | 'missing' | 'speed'

const ALL_MODES: GameMode[] = ['explorer', 'match', 'memory', 'dice', 'missing', 'speed']

export interface TableMastery {
  tableNumber: number
  explored: boolean
  modeScores: Record<GameMode, { attempts: number; bestStars: number }>
  totalStars: number
  mastered: boolean // totalStars >= 12 (2 stars avg across 6 modes)
}

export interface MultiplicationState {
  // Hydration tracking for SSR (same pattern as progressStore)
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void

  tables: Record<number, TableMastery>
  unlockedTables: number[] // Default: [1, 2, 5, 10]
  speedChallengeUnlocked: boolean
  speedHighScore: number

  // Actions
  markExplored: (table: number) => void
  recordModeScore: (table: number, mode: GameMode, stars: number) => void
  isTableUnlocked: (table: number) => boolean
  getTableMastery: (table: number) => TableMastery
  getTotalStars: () => number
  resetProgress: () => void
}

function createDefaultModeScores(): Record<GameMode, { attempts: number; bestStars: number }> {
  const scores: Partial<Record<GameMode, { attempts: number; bestStars: number }>> = {}
  for (const mode of ALL_MODES) {
    scores[mode] = { attempts: 0, bestStars: 0 }
  }
  return scores as Record<GameMode, { attempts: number; bestStars: number }>
}

function createDefaultTableMastery(tableNumber: number): TableMastery {
  return {
    tableNumber,
    explored: false,
    modeScores: createDefaultModeScores(),
    totalStars: 0,
    mastered: false,
  }
}

function computeTotalStars(modeScores: Record<GameMode, { attempts: number; bestStars: number }>): number {
  let total = 0
  for (const mode of ALL_MODES) {
    total += modeScores[mode].bestStars
  }
  return total
}

/**
 * Compute which tables should be unlocked based on current state.
 * Returns the full list of tables that should be unlocked.
 *
 * Unlock progression:
 * - Tables 1, 2, 5, 10 start unlocked
 * - Table 3 unlocks when total stars across unlocked tables >= 6
 * - Table 4 unlocks when table 3 has >= 4 stars
 * - Table 6 unlocks when tables 3 and 4 each have >= 4 stars
 * - Table 7 unlocks when table 6 has >= 4 stars
 * - Table 8 unlocks when table 7 has >= 4 stars
 * - Table 9 unlocks when table 8 has >= 4 stars
 */
function computeUnlocks(
  tables: Record<number, TableMastery>,
  currentUnlocked: number[]
): number[] {
  const unlocked = new Set<number>([1, 2, 5, 10])

  // Also include everything already unlocked (don't re-lock)
  for (const t of currentUnlocked) {
    unlocked.add(t)
  }

  // Helper to get star count for a table
  const starsFor = (t: number): number => tables[t]?.totalStars ?? 0

  // Total stars across all unlocked tables
  const totalUnlockedStars = Array.from(unlocked).reduce(
    (sum, t) => sum + starsFor(t),
    0
  )

  // Table 3: total stars across unlocked tables >= 6
  if (totalUnlockedStars >= 6) {
    unlocked.add(3)
  }

  // Table 4: table 3 has >= 4 stars
  if (starsFor(3) >= 4) {
    unlocked.add(4)
  }

  // Table 6: tables 3 AND 4 each have >= 4 stars
  if (starsFor(3) >= 4 && starsFor(4) >= 4) {
    unlocked.add(6)
  }

  // Table 7: table 6 has >= 4 stars
  if (starsFor(6) >= 4) {
    unlocked.add(7)
  }

  // Table 8: table 7 has >= 4 stars
  if (starsFor(7) >= 4) {
    unlocked.add(8)
  }

  // Table 9: table 8 has >= 4 stars
  if (starsFor(8) >= 4) {
    unlocked.add(9)
  }

  return Array.from(unlocked).sort((a, b) => a - b)
}

/**
 * Check if speed challenge should be unlocked.
 * Requires 3+ tables to have been explored.
 */
function computeSpeedUnlock(tables: Record<number, TableMastery>): boolean {
  let exploredCount = 0
  for (const key of Object.keys(tables)) {
    if (tables[Number(key)]?.explored) {
      exploredCount++
    }
  }
  return exploredCount >= 3
}

const DEFAULT_UNLOCKED = [1, 2, 5, 10]

export const useMultiplicationStore = create<MultiplicationState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      tables: {},
      unlockedTables: DEFAULT_UNLOCKED,
      speedChallengeUnlocked: false,
      speedHighScore: 0,

      markExplored: (table: number) => {
        const state = get()
        const existing = state.tables[table] || createDefaultTableMastery(table)

        const updatedTables = {
          ...state.tables,
          [table]: { ...existing, explored: true },
        }

        const speedUnlocked = computeSpeedUnlock(updatedTables)

        set({
          tables: updatedTables,
          speedChallengeUnlocked: speedUnlocked || state.speedChallengeUnlocked,
        })
      },

      recordModeScore: (table: number, mode: GameMode, stars: number) => {
        const state = get()
        const existing = state.tables[table] || createDefaultTableMastery(table)

        // Update mode score — keep best stars, increment attempts
        const currentMode = existing.modeScores[mode]
        const updatedModeScores = {
          ...existing.modeScores,
          [mode]: {
            attempts: currentMode.attempts + 1,
            bestStars: Math.max(stars, currentMode.bestStars),
          },
        }

        const totalStars = computeTotalStars(updatedModeScores)

        const updatedTable: TableMastery = {
          ...existing,
          modeScores: updatedModeScores,
          totalStars,
          mastered: totalStars >= 12,
        }

        const updatedTables = {
          ...state.tables,
          [table]: updatedTable,
        }

        // Recompute unlocks
        const newUnlocked = computeUnlocks(updatedTables, state.unlockedTables)
        const speedUnlocked = computeSpeedUnlock(updatedTables)

        set({
          tables: updatedTables,
          unlockedTables: newUnlocked,
          speedChallengeUnlocked: speedUnlocked || state.speedChallengeUnlocked,
        })
      },

      isTableUnlocked: (table: number) => {
        return get().unlockedTables.includes(table)
      },

      getTableMastery: (table: number) => {
        return get().tables[table] || createDefaultTableMastery(table)
      },

      getTotalStars: () => {
        const { tables } = get()
        let total = 0
        for (const key of Object.keys(tables)) {
          total += tables[Number(key)].totalStars
        }
        return total
      },

      resetProgress: () => {
        set({
          tables: {},
          unlockedTables: DEFAULT_UNLOCKED,
          speedChallengeUnlocked: false,
          speedHighScore: 0,
        })
      },
    }),
    {
      name: 'mathquest-multiplication',
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
