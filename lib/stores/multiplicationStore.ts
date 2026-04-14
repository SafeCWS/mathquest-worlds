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
  mastered: boolean // totalStars >= 9 (1.5 stars avg across 6 modes)
}

export interface MultiplicationState {
  // Hydration tracking for SSR (same pattern as progressStore)
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void

  tables: Record<number, TableMastery>
  unlockedTables: number[] // Default: [1]
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
 * Traditional method — linear progression:
 * - Table 1 starts unlocked
 * - Each next table unlocks when the previous has >= 3 stars
 *   (table 2 after table 1, table 3 after table 2, etc.)
 * - Progression: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10
 */
function computeUnlocks(
  tables: Record<number, TableMastery>,
  currentUnlocked: number[]
): number[] {
  const unlocked = new Set<number>([1])

  // Also include everything already unlocked (don't re-lock)
  for (const t of currentUnlocked) {
    unlocked.add(t)
  }

  // Helper to get star count for a table
  const starsFor = (t: number): number => tables[t]?.totalStars ?? 0

  // Linear unlock: each table unlocks when the previous has >= 3 stars
  for (let t = 2; t <= 10; t++) {
    if (starsFor(t - 1) >= 3) {
      unlocked.add(t)
    }
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

const DEFAULT_UNLOCKED = [1]

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
          mastered: totalStars >= 9,
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
