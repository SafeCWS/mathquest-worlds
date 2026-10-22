'use client'

// Big Multiplication (2-digit × 1-digit) level unlocks.
// Same Zustand + persist pattern as multiplicationStore.ts: a returning kid's
// unlocked levels survive a reload, and pages gate their first render on
// `_hasHydrated` (L155 / SP-29) so a persisted Level 2 never flashes locked.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BigLevel } from '@/lib/math/twoDigitProblems'

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

export const useBigMultStore = create<BigMultState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      gamesDone: EMPTY_GAMES,
      // Progress only ever goes up — a wrong answer never calls into the store.
      recordGameComplete: (level) =>
        set((s) => ({ gamesDone: { ...s.gamesDone, [level]: (s.gamesDone[level] ?? 0) + 1 } })),
      isUnlocked: (level) =>
        level === 1 || (get().gamesDone[(level - 1) as BigLevel] ?? 0) >= GAMES_TO_UNLOCK,
    }),
    {
      name: BIG_MULT_STORAGE_KEY,
      version: 1,
      // Persist progress only; the hydration flag is runtime state.
      partialize: (s) => ({ gamesDone: s.gamesDone }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Pick<BigMultState, 'gamesDone'>>
        return { ...current, gamesDone: { ...EMPTY_GAMES, ...(p.gamesDone ?? {}) } }
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
