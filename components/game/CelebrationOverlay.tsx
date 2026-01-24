'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { PresetAvatar } from '@/components/character-creator/PresetAvatars'
import { useCharacterStore } from '@/lib/stores/characterStore'

// Confetti particle type
interface ConfettiParticle {
  id: number
  x: number
  y: number
  emoji: string
  rotation: number
  scale: number
  delay: number
}

// Star burst particle type
interface StarBurst {
  id: number
  angle: number
  distance: number
  delay: number
}

export interface CelebrationData {
  type: 'achievement' | 'level_complete' | 'world_complete' | 'star_milestone' | 'streak'
  title: string
  subtitle?: string
  emoji: string
  stars?: number
}

interface CelebrationOverlayProps {
  celebration: CelebrationData | null
  onDismiss: () => void
  autoDismissMs?: number
}

// Celebration emojis
const CONFETTI_EMOJIS = ['🎉', '🎊', '✨', '💫', '🌟', '⭐', '🎈', '🎁', '🏆', '👑']
const STAR_EMOJIS = ['⭐', '🌟', '✨', '💫']

// Generate confetti particles
function generateConfetti(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // percentage across screen
    y: -10 - Math.random() * 20, // start above screen
    emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)],
    rotation: Math.random() * 720 - 360,
    scale: 0.5 + Math.random() * 1,
    delay: Math.random() * 0.5
  }))
}

// Generate star burst particles
function generateStarBurst(count: number): StarBurst[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (i / count) * 360,
    distance: 100 + Math.random() * 100,
    delay: i * 0.03
  }))
}

export function CelebrationOverlay({
  celebration,
  onDismiss,
  autoDismissMs = 3000
}: CelebrationOverlayProps) {
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([])
  const [starBurst, setStarBurst] = useState<StarBurst[]>([])
  const [isVisible, setIsVisible] = useState(false)

  const { avatarStyle, skinTone, hairColor, primaryColor } = useCharacterStore()

  // Handle dismissal
  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Wait for exit animation
  }, [onDismiss])

  // Initialize celebration
  useEffect(() => {
    if (celebration) {
      // Generate particles
      setConfetti(generateConfetti(40))
      setStarBurst(generateStarBurst(16))
      setIsVisible(true)

      // Play celebration sound
      sounds.playCelebration()

      // Auto-dismiss timer
      const timer = setTimeout(handleDismiss, autoDismissMs)
      return () => clearTimeout(timer)
    }
  }, [celebration, autoDismissMs, handleDismiss])

  if (!celebration) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
        >
          {/* Backdrop with radial gradient */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,215,0,0.3) 0%, rgba(0,0,0,0.85) 100%)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Confetti rain */}
          {confetti.map((particle) => (
            <motion.span
              key={`confetti-${particle.id}`}
              className="absolute text-4xl pointer-events-none"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                fontSize: `${1.5 * particle.scale}rem`
              }}
              initial={{
                y: 0,
                rotate: 0,
                opacity: 0,
                scale: 0
              }}
              animate={{
                y: '120vh',
                rotate: particle.rotation,
                opacity: [0, 1, 1, 0],
                scale: particle.scale
              }}
              transition={{
                duration: 2.5,
                delay: particle.delay,
                ease: 'linear'
              }}
            >
              {particle.emoji}
            </motion.span>
          ))}

          {/* Star burst from center */}
          {starBurst.map((star) => {
            const radians = (star.angle * Math.PI) / 180
            const x = Math.cos(radians) * star.distance
            const y = Math.sin(radians) * star.distance
            return (
              <motion.span
                key={`star-${star.id}`}
                className="absolute text-3xl pointer-events-none"
                style={{
                  left: '50%',
                  top: '50%'
                }}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  opacity: 1
                }}
                animate={{
                  x: x,
                  y: y,
                  scale: [0, 1.5, 0],
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 1,
                  delay: star.delay,
                  ease: 'easeOut'
                }}
              >
                {STAR_EMOJIS[star.id % STAR_EMOJIS.length]}
              </motion.span>
            )
          })}

          {/* Golden ring pulse */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 200,
              height: 200,
              border: '4px solid gold',
              boxShadow: '0 0 30px rgba(255,215,0,0.6), inset 0 0 30px rgba(255,215,0,0.3)'
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          {/* Second ring with delay */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 200,
              height: 200,
              border: '3px solid rgba(255,215,0,0.7)',
              boxShadow: '0 0 20px rgba(255,215,0,0.4)'
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          />

          {/* Main celebration card */}
          <motion.div
            className="relative bg-white rounded-3xl p-8 mx-4 text-center shadow-2xl max-w-sm"
            style={{
              boxShadow: '0 0 60px rgba(255,215,0,0.5), 0 20px 60px rgba(0,0,0,0.3)'
            }}
            initial={{ scale: 0, y: 50, rotate: -10 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0, y: 50, rotate: 10 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative sparkles around card */}
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * 360
              const radians = (angle * Math.PI) / 180
              const distance = 140
              return (
                <motion.span
                  key={`sparkle-${i}`}
                  className="absolute text-2xl pointer-events-none"
                  style={{
                    left: `calc(50% + ${Math.cos(radians) * distance}px)`,
                    top: `calc(50% + ${Math.sin(radians) * distance}px)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7],
                    rotate: [0, 15, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                >
                  {['✨', '🌟', '💫'][i % 3]}
                </motion.span>
              )
            })}

            {/* Big emoji celebration */}
            <motion.div
              className="text-8xl mb-4"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [-5, 5, -5]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              {celebration.emoji}
            </motion.div>

            {/* Title with gradient text */}
            <motion.h2
              className="text-3xl font-extrabold mb-2"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6B35 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {celebration.title}
            </motion.h2>

            {/* Subtitle */}
            {celebration.subtitle && (
              <motion.p
                className="text-lg text-gray-600 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {celebration.subtitle}
              </motion.p>
            )}

            {/* Stars display for star milestones */}
            {celebration.stars && (
              <motion.div
                className="flex justify-center gap-2 mb-4"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.span
                    key={i}
                    className={`text-5xl ${i < celebration.stars! ? '' : 'opacity-30'}`}
                    animate={i < celebration.stars! ? {
                      scale: [1, 1.2, 1],
                      rotate: [-10, 10, -10]
                    } : {}}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15
                    }}
                  >
                    {i < celebration.stars! ? '🌟' : '⭐'}
                  </motion.span>
                ))}
              </motion.div>
            )}

            {/* Celebrating character */}
            <motion.div
              className="flex justify-center my-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <PresetAvatar
                  style={avatarStyle}
                  emotion="celebrating"
                  skinTone={skinTone}
                  hairColor={hairColor}
                  primaryColor={primaryColor}
                  size={100}
                  animate={true}
                />
              </motion.div>
            </motion.div>

            {/* Tap to continue hint */}
            <motion.p
              className="text-sm text-gray-400 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook to manage celebration state
export function useCelebration() {
  const [celebration, setCelebration] = useState<CelebrationData | null>(null)

  const showCelebration = useCallback((data: CelebrationData) => {
    setCelebration(data)
    // Play sound
    sounds.playCelebration()
  }, [])

  const dismissCelebration = useCallback(() => {
    setCelebration(null)
  }, [])

  return {
    celebration,
    showCelebration,
    dismissCelebration
  }
}
