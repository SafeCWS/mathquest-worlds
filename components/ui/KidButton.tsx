'use client'

import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { useCallback, useEffect, useState, type KeyboardEvent, type ReactNode } from 'react'
import { sounds } from '@/lib/sounds/webAudioSounds'

// KidButton — the Phase 1.1 button primitive Tina will press a thousand times.
//
// Design constraints (from purrfect-gliding-barto.md):
//   - Squish-bounce on press (whileTap scale 0.88, spring-back).
//   - Optional sparkle burst on press for high-value actions.
//   - Optional Web Audio click — synthesized, never 404s.
//   - Optional 15ms haptic on supported devices.
//   - Accessibility is REQUIRED: aria-label is a non-optional prop.
//   - Honors prefers-reduced-motion: no scale animation, no sparkle, no glow.
//   - 60×60 minimum touch target (Apple HIG / WCAG 2.5.5).
//
// Migration is incremental — Phase 1 just ships the primitive. Existing
// motion.button call sites stay where they are until Phase 2.

export type KidButtonVariant = 'primary' | 'soft' | 'icon'
export type KidButtonSound = 'click' | 'pop' | 'chime' | null

export type KidButtonProps = {
  children: ReactNode
  onClick: () => void
  variant?: KidButtonVariant
  /** Synthesized sound to play on press. `null` for silent. Default `'click'`. */
  sound?: KidButtonSound
  /** Particle burst around the button on press. Defaults to `true` for primary. */
  sparkle?: boolean
  /** Vibration feedback on press (15ms). Defaults to `true`. Web Vibration API. */
  haptic?: boolean
  disabled?: boolean
  className?: string
  /** REQUIRED — every button must announce itself to screen readers. */
  'aria-label': string
} & Omit<HTMLMotionProps<'button'>, 'onClick' | 'children' | 'aria-label'>

export function KidButton({
  children,
  onClick,
  variant = 'primary',
  sound = 'click',
  sparkle,
  haptic = true,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  ...rest
}: KidButtonProps) {
  const reduceMotion = useReducedMotion()
  const [bursting, setBursting] = useState(false)
  const sparkleEnabled = sparkle ?? variant === 'primary'

  // Dev-only nudge: aria-label is required, but TS can't catch whitespace-only.
  // Screen readers treat "  " as missing — warn loudly in dev.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && !ariaLabel?.trim()) {
      console.warn('[KidButton] aria-label must be a non-empty string')
    }
  }, [ariaLabel])

  const handlePress = useCallback(() => {
    if (disabled) return

    // Synthesized — never reaches the network, never 404s.
    if (sound === 'click') sounds.playClick()
    else if (sound === 'pop') sounds.playPop()
    else if (sound === 'chime') sounds.playSuccessChime()

    if (haptic && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15)
    }

    if (sparkleEnabled && !reduceMotion) {
      setBursting(true)
      window.setTimeout(() => setBursting(false), 400)
    }

    onClick()
  }, [disabled, sound, haptic, sparkleEnabled, reduceMotion, onClick])

  // Keyboard parity for `onPointerDown`. PointerEvents do NOT fire on keyboard
  // activation — Tab+Enter and Tab+Space would otherwise be silently broken.
  //
  // Double-fire analysis:
  //   - Touch/mouse:  keydown does NOT fire from pointer input → only onPointerDown fires.
  //   - Enter key:    onKeyDown fires; native button also synthesizes a `click` event,
  //                   but we attach no `onClick` handler, so handlePress runs exactly once.
  //   - Space key:    onKeyDown fires; we call preventDefault() to suppress page-scroll
  //                   and the native click-on-keyup. handlePress runs exactly once.
  //   - Auto-repeat:  holding a key fires keydown repeatedly; `event.repeat` short-circuits
  //                   so haptic/audio/sparkle don't machine-gun.
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      if (event.repeat) return
      // Space scrolls the page by default on a focused button; suppress it.
      // Also suppresses the native click-on-keyup so we stay single-fire even
      // if a future onClick is added.
      if (event.key === ' ') event.preventDefault()
      handlePress()
    },
    [handlePress]
  )

  // Primary variant intentionally omits a border-color class — consumers supply
  // their own (e.g. `border-yellow-300`, `border-green-300`) via className so a
  // tile's gradient and border stay in the same color family. Tailwind compiles
  // border-color utilities at equal specificity, so two of them in the same
  // element resolve by stylesheet order, not className order — making it
  // impossible for the consumer to override a baked-in variant border. Keeping
  // `border-4` here preserves the thick frame; the color is the consumer's call.
  const variantClass =
    variant === 'primary'
      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg border-4'
      : variant === 'soft'
        ? 'bg-white/90 text-gray-700 shadow-md border-2 border-white/50'
        : 'bg-transparent text-gray-700'

  // 60×60 minimum touch target satisfies Apple HIG + WCAG 2.5.5.
  const sizeClass =
    variant === 'icon'
      ? 'min-w-[60px] min-h-[60px] p-3 rounded-full'
      : 'min-h-[60px] px-6 py-4 rounded-2xl'

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      aria-disabled={disabled}
      disabled={disabled}
      onPointerDown={handlePress}
      onKeyDown={handleKeyDown}
      whileHover={reduceMotion || disabled ? undefined : { scale: 1.05, y: -2 }}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`relative overflow-visible font-bold disabled:opacity-50 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${className}`}
      {...rest}
    >
      {children}
      {bursting && <SparkleBurst />}
    </motion.button>
  )
}

// 8 particles fanning out from the button center. Pure decoration —
// aria-hidden so screen readers ignore it.
function SparkleBurst() {
  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2
    return {
      key: i,
      dx: Math.cos(angle) * 40,
      dy: Math.sin(angle) * 40,
    }
  })

  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p) => (
        <motion.span
          key={p.key}
          initial={{ x: 0, y: 0, scale: 0.5, opacity: 1 }}
          animate={{ x: p.dx, y: p.dy, scale: 1, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute w-2 h-2 rounded-full bg-yellow-300"
        />
      ))}
    </span>
  )
}
