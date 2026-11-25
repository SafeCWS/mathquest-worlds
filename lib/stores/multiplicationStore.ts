// Multiplication mastery state store
// Follows the exact Zustand + persist pattern from progressStore.ts
//
// Storage hardening (yokoten of the Big Multiplication red-team round 1): hydration ALWAYS
// finishes (corrupt JSON, blocked or full storage — see safeStorage.ts), a saved value is
// sanitised on load, and neither a rehydrate nor a saved-version change ever lowers stars,
// attempts, unlocks or the speed high score.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeJSONStorage } from './safeStorage'

export type GameMode = 'explorer' | 'match' | 'memory' | 'dice' | 'missing' | 'speed'
  | 'array' | 'groups' | 'dragmatch' | 'numberline' | 'flip' | 'fingers'
  | 'chart' | 'story' | 'bubble'

const ALL_MODES: GameMode[] = [
  'explorer', 'match', 'memory', 'dice', 'missing', 'speed',
  'array', 'groups', 'dragmatch', 'numberline', 'flip', 'fingers',
  'chart', 'story', 'bubble',
]

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

// Module-level cache for default TableMastery objects.
// Without this, `getTableMastery` returns a fresh object on every cache
// miss, and any component using `useMultiplicationStore(s => s.getTableMastery(n))`
// as a selector re-renders in a loop (new reference ≠ old reference).
// Keyed by table number since default state is identical per table.
const defaultMasteryCache = new Map<number, TableMastery>()

function getDefaultMastery(table: number): TableMastery {
  let cached = defaultMasteryCache.get(table)
  if (!cached) {
    cached = createDefaultTableMastery(table)
    defaultMasteryCache.set(table, cached)
  }
  return cached
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
const MAX_TABLE = 10
const MAX_STARS_PER_MODE = 3
const MAX_COUNT = 1_000_000

function count(v: unknown, max = MAX_COUNT): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(max, Math.floor(v)) : 0
}

function isTable(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= MAX_TABLE
}

function sanitizeTable(tableNumber: number, v: unknown): TableMastery {
  const src = v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {}
  const scoresIn = src.modeScores !== null && typeof src.modeScores === 'object' ? (src.modeScores as Record<string, unknown>) : {}
  const modeScores = createDefaultModeScores()
  for (const mode of ALL_MODES) {
    const m = scoresIn[mode] !== null && typeof scoresIn[mode] === 'object' ? (scoresIn[mode] as Record<string, unknown>) : {}
    modeScores[mode] = { attempts: count(m.attempts), bestStars: count(m.bestStars, MAX_STARS_PER_MODE) }
  }
  const totalStars = computeTotalStars(modeScores)
  return { tableNumber, explored: src.explored === true, modeScores, totalStars, mastered: totalStars >= 9 }
}

type PersistedMultiplication = Pick<MultiplicationState, 'tables' | 'unlockedTables' | 'speedChallengeUnlocked' | 'speedHighScore'>

/** Whatever was saved → a well-formed state: tables 1–10, whole-number scores, stars 0–3. */
export function sanitizeMultiplication(v: unknown): PersistedMultiplication {
  const src = v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {}
  const tablesIn = src.tables !== null && typeof src.tables === 'object' ? (src.tables as Record<string, unknown>) : {}
  const tables: Record<number, TableMastery> = {}
  for (const key of Object.keys(tablesIn)) {
    const n = Number(key)
    if (isTable(n)) tables[n] = sanitizeTable(n, tablesIn[key])
  }
  const unlockedIn = Array.isArray(src.unlockedTables) ? src.unlockedTables : []
  const unlocked = unlockedIn.filter((t): t is number => typeof t === 'number' && isTable(t))
  return {
    tables,
    unlockedTables: computeUnlocks(tables, unlocked),
    speedChallengeUnlocked: src.speedChallengeUnlocked === true || computeSpeedUnlock(tables),
    speedHighScore: count(src.speedHighScore),
  }
}

/** Field-by-field max of two sanitised states — progress never goes down. */
function maxProgress(a: PersistedMultiplication, b: PersistedMultiplication): PersistedMultiplication {
  const tables: Record<number, TableMastery> = {}
  for (const key of new Set([...Object.keys(a.tables), ...Object.keys(b.tables)])) {
    const n = Number(key)
    const x = a.tables[n] ?? createDefaultTableMastery(n)
    const y = b.tables[n] ?? createDefaultTableMastery(n)
    const modeScores = createDefaultModeScores()
    for (const mode of ALL_MODES) {
      modeScores[mode] = {
        attempts: Math.max(x.modeScores[mode].attempts, y.modeScores[mode].attempts),
        bestStars: Math.max(x.modeScores[mode].bestStars, y.modeScores[mode].bestStars),
      }
    }
    const totalStars = computeTotalStars(modeScores)
    tables[n] = { tableNumber: n, explored: x.explored || y.explored, modeScores, totalStars, mastered: totalStars >= 9 }
  }
  return {
    tables,
    unlockedTables: computeUnlocks(tables, [...a.unlockedTables, ...b.unlockedTables]),
    speedChallengeUnlocked: a.speedChallengeUnlocked || b.speedChallengeUnlocked || computeSpeedUnlock(tables),
    speedHighScore: Math.max(a.speedHighScore, b.speedHighScore),
  }
}

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
        // Use memoized default so reference equality holds across
        // renders when no data has been stored for this table yet
        // (prevents infinite re-render loops in Zustand selectors).
        return get().tables[table] || getDefaultMastery(table)
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
      storage: safeJSONStorage<MultiplicationState>(),
      // Any other saved version (older OR newer): keep the progress; merge() takes the max.
      migrate: (persisted) => sanitizeMultiplication(persisted) as unknown as MultiplicationState,
      merge: (persisted, current) => ({
        ...current,
        ...maxProgress(sanitizeMultiplication(current), sanitizeMultiplication(persisted)),
      }),
      // Success AND error: a failed rehydrate must never leave the grid on its loader.
      // `initial` (not useMultiplicationStore): the first hydrate runs inside create().
      onRehydrateStorage: (initial) => () => {
        initial.setHasHydrated(true)
      },
    }
  )
)
