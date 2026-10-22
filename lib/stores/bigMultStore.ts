'use client'

// Big Multiplication (2-digit × 1-digit) level unlocks.
// Same Zustand + persist pattern as multiplicationStore.ts: a returning kid's
// unlocked levels survive a reload, and pages gate their first render on
// `_hasHydrated` (L155 / SP-29) so a persisted Level 2 never flashes locked.
//
// Red-team round 1: hydration ALWAYS finishes (corrupt JSON, blocked or full storage — see
// safeStorage.ts); `gamesDone` is sanitised to non-negative integers on load and NEVER goes
// down — per-level max against another tab's save, a `storage` event, or any saved version.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BigLevel } from '@/lib/math/twoDigitProblems'
import { onOtherTabWrite, readPersisted, safeJSONStorage } from './safeStorage'

export const GAMES_TO_UNLOCK = 3
export const PROBLEMS_PER_GAME = 3

export const BIG_MULT_STORAGE_KEY = 'mathquest-big-multiplication'

interface BigMultState {
  // Hydration tracking for SSR (same pattern as multiplicationStore)
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void

  gamesDone: Record<BigLevel, number>
  recordGameComplete: (level: BigLevel) => void
  isUnlocked: (level: BigLevel) => boolean
}

const EMPTY_GAMES: Record<BigLevel, number> = { 1: 0, 2: 0, 3: 0 }
const LEVELS: readonly BigLevel[] = [1, 2, 3]
/** Cap so a tampered count can't overflow anything. */
const MAX_GAMES = 1_000_000

/** Non-negative integers per level; strings, NaN, negatives, non-objects → 0. */
export function sanitizeGamesDone(v: unknown): Record<BigLevel, number> {
  const src = v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {}
  const out = { ...EMPTY_GAMES }
  for (const lvl of LEVELS) {
    const n = src[lvl]
    out[lvl] = typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.min(MAX_GAMES, Math.floor(n)) : 0
  }
  return out
}

function maxGames(a: Record<BigLevel, number>, b: Record<BigLevel, number>): Record<BigLevel, number> {
  const out = { ...EMPTY_GAMES }
  for (const lvl of LEVELS) out[lvl] = Math.max(a[lvl] ?? 0, b[lvl] ?? 0)
  return out
}

type PersistedProgress = { gamesDone: Record<BigLevel, number> }

/** Progress another tab may have saved since we last looked (sanitised). */
function storedGames(): Record<BigLevel, number> {
  return sanitizeGamesDone(readPersisted<{ gamesDone?: unknown } | null>(BIG_MULT_STORAGE_KEY)?.state?.gamesDone)
}

export const useBigMultStore = create<BigMultState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      gamesDone: EMPTY_GAMES,
      // Progress only ever goes up — a wrong answer never calls into the store.
      // Builds on max(memory, another tab's save) so two tabs never lose a finished game.
      recordGameComplete: (level) =>
        set((s) => {
          const base = maxGames(sanitizeGamesDone(s.gamesDone), storedGames())
          return { gamesDone: { ...base, [level]: Math.min(MAX_GAMES, base[level] + 1) } }
        }),
      isUnlocked: (level) =>
        level === 1 || (get().gamesDone[(level - 1) as BigLevel] ?? 0) >= GAMES_TO_UNLOCK,
    }),
    {
      name: BIG_MULT_STORAGE_KEY,
      version: 1,
      storage: safeJSONStorage<PersistedProgress>(),
      // Persist progress only; the hydration flag is runtime state.
      partialize: (s) => ({ gamesDone: s.gamesDone }),
      // Any other saved version (older OR newer): keep the progress; merge() takes the max.
      migrate: (persisted) => ({ gamesDone: sanitizeGamesDone((persisted as { gamesDone?: unknown } | null)?.gamesDone) }),
      // Never lower: per-level max of memory and the (sanitised) saved progress.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as { gamesDone?: unknown }
        return { ...current, gamesDone: maxGames(sanitizeGamesDone(current.gamesDone), sanitizeGamesDone(p.gamesDone)) }
      },
      // Success AND error: a failed rehydrate must never leave the page on its loader.
      // `initial` (not useBigMultStore) because the first hydrate runs synchronously inside
      // create(), before the export is assigned.
      onRehydrateStorage: (initial) => () => {
        initial.setHasHydrated(true)
      },
    }
  )
)

// Another tab finished a game: pull it in. Only when some level is HIGHER in storage, so
// equal-value writes (including a migrate write-back) can never ping-pong between tabs.
onOtherTabWrite(BIG_MULT_STORAGE_KEY, () => {
  const mine = useBigMultStore.getState().gamesDone
  const theirs = storedGames()
  if (LEVELS.some((l) => theirs[l] > (mine[l] ?? 0))) void useBigMultStore.persist.rehydrate()
})
