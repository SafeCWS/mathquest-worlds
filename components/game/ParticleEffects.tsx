'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'

// ===== CONFETTI BURST =====
interface ConfettiBurstProps {
  x: number
  y: number
  colors?: string[]
  count?: number
  duration?: number
}

export function ConfettiBurst({
  x,
  y,
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'],
  count = 20,
  duration = 1000
}: ConfettiBurstProps) {
  const [particles, setParticles] = useState<Array<{
    id: number
    color: string
    angle: number
    distance: number
    rotation: number
    delay: number
  }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: (Math.random() * 360) * (Math.PI / 180),
      distance: 50 + Math.random() * 100,
      rotation: Math.random() * 720 - 360,
      delay: Math.random() * 0.1
    }))
    setParticles(newParticles)

    // Cleanup
    const timer = setTimeout(() => setParticles([]), duration)
    return () => clearTimeout(timer)
  }, [x, y, count, colors, duration])

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
    >
      {particles.map((particle) => {
        const tx = Math.cos(particle.angle) * particle.distance
        const ty = Math.sin(particle.angle) * particle.distance

        return (
          <motion.div
            key={particle.id}
            className="absolute w-3 h-3 rounded-full"
            style={{
              backgroundColor: particle.color,
              left: -6,
              top: -6
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{
              x: tx,
              y: ty,
              opacity: [1, 1, 0],
              scale: [1, 1.5, 0],
              rotate: particle.rotation
            }}
            transition={{
              duration: duration / 1000,
              delay: particle.delay,
              ease: 'easeOut'
            }}
          />
        )
      })}
    </div>
  )
}

// ===== STAR BURST (for correct answers) =====
interface StarBurstProps {
  x: number
  y: number
  count?: number
}

export function StarBurst({ x, y, count = 8 }: StarBurstProps) {
  const [stars, setStars] = useState<Array<{
    id: number
    angle: number
    distance: number
  }>>([])

  useEffect(() => {
    const newStars = Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * 360 * (Math.PI / 180),
      distance: 60 + Math.random() * 40
    }))
    setStars(newStars)

    const timer = setTimeout(() => setStars([]), 1200)
    return () => clearTimeout(timer)
  }, [x, y, count])

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
    >
      {stars.map((star) => {
        const tx = Math.cos(star.angle) * star.distance
        const ty = Math.sin(star.angle) * star.distance

        return (
          <motion.div
            key={star.id}
            className="absolute text-3xl"
            style={{ left: -16, top: -16 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
            animate={{
              x: tx,
              y: ty,
              opacity: [1, 1, 0],
              scale: [0, 1.5, 0],
              rotate: [0, 360]
            }}
            transition={{
              duration: 1,
              delay: star.id * 0.05,
              ease: 'easeOut'
            }}
          >
            ⭐
          </motion.div>
        )
      })}
    </div>
  )
}

// ===== FLOATING TEXT (for "+10" scores, etc.) =====
interface FloatingTextProps {
  text: string
  x: number
  y: number
  color?: string
  emoji?: string
}

export function FloatingText({
  text,
  x,
  y,
  color = '#10B981',
  emoji
}: FloatingTextProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <motion.div
      className="fixed pointer-events-none z-50 font-bold text-2xl"
      style={{ left: x, top: y, color }}
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{
        opacity: [1, 1, 0],
        y: -80,
        scale: [0.5, 1.2, 1]
      }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      {emoji && <span className="mr-1">{emoji}</span>}
      {text}
    </motion.div>
  )
}

// ===== RIPPLE EFFECT (for taps) =====
interface RippleEffectProps {
  x: number
  y: number
  color?: string
}

export function RippleEffect({
  x,
  y,
  color = 'rgba(59, 130, 246, 0.4)'
}: RippleEffectProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <motion.div
      className="fixed pointer-events-none z-40 rounded-full border-4"
      style={{
        left: x - 20,
        top: y - 20,
        width: 40,
        height: 40,
        borderColor: color
      }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 3, opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  )
}

// ===== SPARKLE TRAIL (follows cursor/finger) =====
interface SparkleTrailProps {
  x: number
  y: number
}

export function SparkleTrail({ x, y }: SparkleTrailProps) {
  const [sparkles, setSparkles] = useState<Array<{
    id: number
    x: number
    y: number
    emoji: string
  }>>([])

  useEffect(() => {
    const sparkleEmojis = ['✨', '⭐', '🌟', '💫']
    const newSparkle = {
      id: Date.now(),
      x,
      y,
      emoji: sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)]
    }

    setSparkles((prev) => [...prev, newSparkle])

    // Remove old sparkles
    const timer = setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id))
    }, 1000)

    return () => clearTimeout(timer)
  }, [x, y])

  return (
    <>
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="fixed pointer-events-none z-30 text-2xl"
          style={{ left: sparkle.x - 12, top: sparkle.y - 12 }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0.5, y: -30 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {sparkle.emoji}
        </motion.div>
      ))}
    </>
  )
}

// ===== COMBO METER FILL ANIMATION =====
interface ComboMeterProps {
  current: number
  max: number
  position?: { x: number; y: number }
}

export function ComboMeter({ current, max, position = { x: 20, y: 20 } }: ComboMeterProps) {
  const percentage = Math.min((current / max) * 100, 100)
  const isFull = current >= max

  return (
    <motion.div
      className="fixed z-40 bg-white/90 rounded-full p-2 shadow-lg"
      style={{ left: position.x, top: position.y }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
    >
      <div className="flex items-center gap-2">
        <div className="relative w-32 h-6 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: isFull
                ? 'linear-gradient(90deg, #10B981, #059669)'
                : 'linear-gradient(90deg, #3B82F6, #2563EB)'
            }}
            initial={{ width: '0%' }}
            animate={{
              width: `${percentage}%`,
              boxShadow: isFull
                ? '0 0 20px rgba(16, 185, 129, 0.8)'
                : undefined
            }}
            transition={{ type: 'spring', damping: 15 }}
          />

          {/* Shimmer effect when full */}
          {isFull && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
              style={{ opacity: 0.3 }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>

        <motion.span
          className="font-bold text-sm"
          animate={isFull ? { scale: [1, 1.2, 1], color: ['#000', '#10B981', '#000'] } : {}}
          transition={isFull ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.5 } : {}}
        >
          {current}/{max}
        </motion.span>

        {isFull && (
          <motion.span
            className="text-xl"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            🔥
          </motion.span>
        )}
      </div>
    </motion.div>
  )
}

// ===== ACHIEVEMENT POPUP =====
interface AchievementPopupProps {
  title: string
  emoji: string
  onDismiss: () => void
}

export function AchievementPopup({ title, emoji, onDismiss }: AchievementPopupProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50
                 bg-gradient-to-r from-yellow-400 to-orange-500
                 text-white px-6 py-4 rounded-2xl shadow-2xl
                 flex items-center gap-3"
      initial={{ y: -100, opacity: 0, scale: 0.5 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -100, opacity: 0, scale: 0.5 }}
      whileHover={{ scale: 1.05 }}
      onClick={onDismiss}
    >
      <motion.span
        className="text-4xl"
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
      >
        {emoji}
      </motion.span>

      <div>
        <div className="text-xs font-semibold opacity-90">Achievement Unlocked!</div>
        <div className="font-bold text-lg">{title}</div>
      </div>

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 rounded-2xl"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  )
}
