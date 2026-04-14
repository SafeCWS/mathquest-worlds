/**
 * Interaction cooldown hook for MathQuest Worlds
 * Prevents accidental double-taps common with young children (ages 5-9)
 *
 * Usage:
 *   const { isLocked, triggerCooldown } = useInteractionCooldown(800)
 *
 *   const handleAnswer = (answer: number) => {
 *     if (isLocked) return
 *     triggerCooldown()
 *     // ... handle answer logic
 *   }
 */

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseInteractionCooldownReturn {
  /** Whether the cooldown is currently active (true = ignore taps) */
  isLocked: boolean
  /** Call this when an interaction starts to begin the cooldown */
  triggerCooldown: () => void
}

/**
 * Custom hook that prevents accidental double-taps.
 * @param cooldownMs - Duration of the cooldown in milliseconds (default: 800)
 */
export function useInteractionCooldown(cooldownMs: number = 800): UseInteractionCooldownReturn {
  const [isLocked, setIsLocked] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerCooldown = useCallback(() => {
    setIsLocked(true)

    // Clear any existing timeout to avoid stacking
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setIsLocked(false)
      timeoutRef.current = null
    }, cooldownMs)
  }, [cooldownMs])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { isLocked, triggerCooldown }
}
