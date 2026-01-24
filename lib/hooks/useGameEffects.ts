'use client'

import { useState, useCallback } from 'react'
import { sounds } from '@/lib/sounds/webAudioSounds'

export interface GameEffect {
  id: string
  type: 'confetti' | 'starBurst' | 'floatingText' | 'ripple' | 'achievement'
  x: number
  y: number
  data?: any
}

export function useGameEffects() {
  const [effects, setEffects] = useState<GameEffect[]>([])
  const [combo, setCombo] = useState(0)

  // Add a visual effect at coordinates
  const addEffect = useCallback((effect: Omit<GameEffect, 'id'>) => {
    const newEffect = {
      ...effect,
      id: `${effect.type}-${Date.now()}-${Math.random()}`
    }
    setEffects((prev) => [...prev, newEffect])

    // Auto-remove after duration
    setTimeout(() => {
      setEffects((prev) => prev.filter((e) => e.id !== newEffect.id))
    }, 2000)
  }, [])

  // Handle correct answer
  const playCorrectAnswer = useCallback((x: number, y: number) => {
    // Increment combo
    setCombo((prev) => {
      const newCombo = prev + 1

      // Play combo sounds at milestones
      if (newCombo === 3) {
        sounds.playCombo3()
        addEffect({
          type: 'achievement',
          x: window.innerWidth / 2,
          y: 100,
          data: { title: '3 Streak!', emoji: '🔥' }
        })
      } else if (newCombo === 5) {
        sounds.playCombo5()
        addEffect({
          type: 'achievement',
          x: window.innerWidth / 2,
          y: 100,
          data: { title: '5 Streak! Amazing!', emoji: '⚡' }
        })
      } else if (newCombo === 10) {
        sounds.playCombo10()
        addEffect({
          type: 'achievement',
          x: window.innerWidth / 2,
          y: 100,
          data: { title: '10 STREAK! UNSTOPPABLE!', emoji: '🚀' }
        })
      } else {
        sounds.playCorrect()
      }

      return newCombo
    })

    // Visual effects
    addEffect({ type: 'starBurst', x, y })
    addEffect({ type: 'confetti', x, y })
    addEffect({
      type: 'floatingText',
      x,
      y,
      data: { text: '+10', emoji: '✨', color: '#10B981' }
    })
  }, [addEffect])

  // Handle wrong answer
  const playWrongAnswer = useCallback((x: number, y: number) => {
    // Reset combo
    setCombo(0)

    // Gentle wrong sound
    sounds.playWrong()

    // Just a ripple effect, not too harsh
    addEffect({ type: 'ripple', x, y, data: { color: 'rgba(239, 68, 68, 0.4)' } })
  }, [addEffect])

  // Handle tap/click
  const playTap = useCallback((x: number, y: number) => {
    sounds.playTapRandom()
    addEffect({ type: 'ripple', x, y })
  }, [addEffect])

  // Reset combo (when starting new problem)
  const resetCombo = useCallback(() => {
    setCombo(0)
  }, [])

  // Problem completed
  const playProblemComplete = useCallback((problemNumber: number) => {
    // Play milestone sounds
    if (problemNumber === 10) {
      sounds.playMilestone10()
    } else if (problemNumber === 25) {
      sounds.playMilestone25()
    } else if (problemNumber === 50) {
      sounds.playMilestone50()
    }

    // Check if almost done with level
    if (problemNumber % 10 === 8) {
      sounds.playAlmostThere()
      addEffect({
        type: 'achievement',
        x: window.innerWidth / 2,
        y: 100,
        data: { title: 'Almost there!', emoji: '🎯' }
      })
    }
  }, [addEffect])

  // Level complete
  const playLevelComplete = useCallback(() => {
    sounds.playLevelComplete()

    // Celebrate!
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    // Multiple confetti bursts
    addEffect({ type: 'confetti', x: centerX - 100, y: centerY })
    setTimeout(() => {
      addEffect({ type: 'confetti', x: centerX + 100, y: centerY })
    }, 200)
    setTimeout(() => {
      addEffect({ type: 'confetti', x: centerX, y: centerY - 100 })
    }, 400)
  }, [addEffect])

  // Star earned
  const playStarEarned = useCallback((x: number, y: number) => {
    sounds.playStar()
    addEffect({ type: 'starBurst', x, y })
    addEffect({
      type: 'floatingText',
      x,
      y,
      data: { text: 'Star!', emoji: '⭐', color: '#FBBF24' }
    })
  }, [addEffect])

  // World sound (play ambient sounds periodically)
  const playWorldAmbient = useCallback((worldId: string) => {
    sounds.playWorldSound(worldId)
  }, [])

  return {
    effects,
    combo,
    playCorrectAnswer,
    playWrongAnswer,
    playTap,
    resetCombo,
    playProblemComplete,
    playLevelComplete,
    playStarEarned,
    playWorldAmbient,
    addEffect
  }
}

// Hook for managing streak animations
export function useStreakAnimation() {
  const [isStreaking, setIsStreaking] = useState(false)
  const [streakCount, setStreakCount] = useState(0)

  const incrementStreak = useCallback(() => {
    setStreakCount((prev) => {
      const newCount = prev + 1
      if (newCount >= 3) {
        setIsStreaking(true)
      }
      return newCount
    })
  }, [])

  const resetStreak = useCallback(() => {
    setStreakCount(0)
    setIsStreaking(false)
  }, [])

  return {
    isStreaking,
    streakCount,
    incrementStreak,
    resetStreak
  }
}

// Hook for number count animations
export function useNumberAnimation(initialValue: number = 0) {
  const [value, setValue] = useState(initialValue)
  const [isAnimating, setIsAnimating] = useState(false)

  const animateToValue = useCallback((targetValue: number, onComplete?: () => void) => {
    setIsAnimating(true)

    const startValue = value
    const difference = targetValue - startValue
    const duration = 500 // ms
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.round(startValue + difference * easeOut)

      setValue(currentValue)

      // Play count sound
      if (difference > 0 && Math.random() > 0.7) {
        sounds.playCountUp()
      } else if (difference < 0 && Math.random() > 0.7) {
        sounds.playCountDown()
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        onComplete?.()
      }
    }

    animate()
  }, [value])

  return {
    value,
    isAnimating,
    setValue,
    animateToValue
  }
}
