'use client'

// The dragon's hoard — gems earned by FINISHING problems in Big Multiplication v2
// (spec: ~/.claude/plans/mellow-roaming-hoare.md §Engagement #1: reward finishing, never speed).
// Same Zustand + persist pattern as bigMultStore.ts; pages gate the counter on `_hasHydrated`
// (L155 / SP-29) so a persisted hoard never flashes 0.
//
// Invariant: `gems` NEVER decreases. add() ignores 0, negatives, NaN, ±Infinity and non-numbers;
// fractions are floored. A tampered localStorage value (negative, string, huge) is sanitised on
// rehydrate to a whole number in [0, MAX_GEMS].
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const HOARD_STORAGE_KEY = 'mathquest-dragon-hoard'
/** Cap so a tampered value can't overflow the counter UI. */
export const MAX_GEMS = 999_999

interface HoardState {
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void

  gems: number
  /** Add gems; returns the new total. Invalid or non-positive amounts change nothing. */
  add: (n: number) => number
}

export function sanitizeGems(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return 0
  return Math.min(MAX_GEMS, Math.floor(v))
}

export const useHoardStore = create<HoardState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      gems: 0,
      add: (n) => {
        const inc = typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : 0
        if (inc <= 0) return get().gems
        const next = Math.min(MAX_GEMS, get().gems + inc)
        set({ gems: next })
        return next
      },
    }),
    {
      name: HOARD_STORAGE_KEY,
      version: 1,
      partialize: (s) => ({ gems: s.gems }),
      // Never let a rehydrate LOWER an in-memory total earned before hydration finished.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as { gems?: unknown }
        return { ...current, gems: Math.max(current.gems, sanitizeGems(p.gems)) }
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
