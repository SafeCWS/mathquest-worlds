'use client'

import { useEffect } from 'react'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { music } from '@/lib/sounds/musicSounds'

/**
 * Unlocks Web Audio API on iOS/iPadOS Safari.
 * Safari suspends AudioContext until a user gesture (tap/click) calls resume().
 * This component adds a one-time listener on the first interaction.
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

  return <>{children}</>
}
