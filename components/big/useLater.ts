'use client'

import { useEffect, useMemo, useState } from 'react'

/** A component-owned setTimeout; `later.clear()` drops every pending call at once. */
export type Later = ((fn: () => void, ms: number) => number) & { clear: () => void }

/**
 * `later(fn, ms)` — a setTimeout owned by the component: every pending call is cleared when the
 * component unmounts (Back, a new problem, "Show me again"), so a deferred onSolved / phase change
 * can never fire into the next game (CHECK round 1, code-reviewer #2 / hackerAI #7).
 * `later.clear()` does the same on demand — the game shell stays mounted across Back, so it calls
 * it when the child leaves a game (CHECK round 2: no late chime after Back).
 */
export function useLater(): Later {
  const [pending] = useState(() => new Set<number>())
  useEffect(
    () => () => {
      pending.forEach((id) => window.clearTimeout(id))
      pending.clear()
    },
    [pending],
  )
  return useMemo(() => {
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        pending.delete(id)
        fn()
      }, ms)
      pending.add(id)
      return id
    }
    const clear = () => {
      pending.forEach((id) => window.clearTimeout(id))
      pending.clear()
    }
    return Object.assign(later, { clear })
  }, [pending])
}
