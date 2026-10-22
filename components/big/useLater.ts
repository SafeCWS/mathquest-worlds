'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * `later(fn, ms)` — a setTimeout owned by the component: every pending call is cleared when the
 * component unmounts (Back, a new problem, "Show me again"), so a deferred onSolved / phase change
 * can never fire into the next game (CHECK round 1, code-reviewer #2 / hackerAI #7).
 */
export function useLater() {
  const ids = useRef<Set<number>>(new Set())
  useEffect(() => {
    const pending = ids.current
    return () => {
      pending.forEach((id) => window.clearTimeout(id))
      pending.clear()
    }
  }, [])
  return useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      ids.current.delete(id)
      fn()
    }, ms)
    ids.current.add(id)
    return id
  }, [])
}
