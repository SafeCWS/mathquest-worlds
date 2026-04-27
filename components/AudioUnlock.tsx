'use client'

import { useEffect } from 'react'
import { MotionConfig } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { music } from '@/lib/sounds/musicSounds'

/**
 * Unlocks Web Audio API on iOS/iPadOS Safari.
 * Safari suspends AudioContext until a user gesture (tap/click) calls resume().
 * This component adds a one-time listener on the first interaction.
 *
 * Also wraps the app in MotionConfig with `reducedMotion="user"` so every
 * Motion animation in the tree honors prefers-reduced-motion automatically
 * (Phase 1.4 a11y baseline). Page-level useReducedMotion() hooks add the
 * targeted "skip the loop entirely" behavior on top of this.
 */
export function AudioUnlock({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unlock = () => {
      sounds.resume()
      music.resume()
      // Remove after first interaction — only needs to happen once
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
    }

    document.addEventListener('pointerdown', unlock, { once: true })
    document.addEventListener('keydown', unlock, { once: true })

    return () => {
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [])

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
