'use client'

import { motion, AnimatePresence } from 'motion/react'

// ============================================
// ENCOURAGING MESSAGES - Rotate through these!
// ============================================
const ENCOURAGING_MESSAGES = [
  { text: "Nice try!", emoji: "💪" },
  { text: "Keep going!", emoji: "🌟" },
  { text: "You got this!", emoji: "✨" },
  { text: "So close!", emoji: "🎯" },
  { text: "Try again!", emoji: "🚀" },
  { text: "Almost!", emoji: "👏" },
  { text: "Don't give up!", emoji: "💖" },
  { text: "You're learning!", emoji: "🧠" },
]

// Get a random encouraging message
export function getEncouragingMessage(): { text: string; emoji: string } {
  return ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)]
}

// ============================================
// ENCOURAGING MESSAGE OVERLAY
// ============================================
interface EncouragingMessageProps {
  show: boolean
  message?: { text: string; emoji: string }
}

export function EncouragingMessage({ show, message }: EncouragingMessageProps) {
  const displayMessage = message || getEncouragingMessage()

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gradient-to-r from-yellow-300 to-orange-300 rounded-3xl px-8 py-6 shadow-2xl border-4 border-yellow-400"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center gap-3">
              <motion.span
                className="text-5xl"
                animate={{ rotate: [-10, 10, -10], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                {displayMessage.emoji}
              </motion.span>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">
                {displayMessage.text}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// CELEBRATION CONFETTI
// ============================================
interface CelebrationConfettiProps {
  show: boolean
  emoji?: string[]
  count?: number
}

export function CelebrationConfetti({
  show,
  emoji = ['⭐', '✨', '🌟', '💫', '🎉'],
  count = 15
}: CelebrationConfettiProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
          {Array.from({ length: count }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-3xl md:text-4xl"
              style={{
                left: `${5 + (i * (90 / count))}%`,
                top: '20%'
              }}
              initial={{ y: 0, opacity: 1, scale: 0 }}
              animate={{
                y: [0, 100, 250],
                opacity: [1, 1, 0],
                scale: [0, 1.2, 1],
                rotate: [0, 180, 360],
                x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 150]
              }}
              transition={{
                duration: 1.5 + Math.random() * 0.5,
                delay: i * 0.05,
                ease: "easeOut"
              }}
            >
              {emoji[i % emoji.length]}
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// SUCCESS MODAL - Big celebration!
// ============================================
interface SuccessModalProps {
  show: boolean
  title?: string
  subtitle?: string
  emoji?: string
  onDismiss?: () => void
}

export function SuccessModal({
  show,
  title = "Amazing!",
  subtitle = "You did it!",
  emoji = "🎉",
  onDismiss
}: SuccessModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/30 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            className="bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-300 rounded-3xl p-8 shadow-2xl border-4 border-yellow-400 text-center max-w-sm mx-4"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <motion.span
              className="text-7xl block mb-4"
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -10, 10, 0]
              }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.5 }}
            >
              {emoji}
            </motion.span>

            <motion.h2
              className="text-3xl md:text-4xl font-black text-gray-800 mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {title}
            </motion.h2>

            <motion.p
              className="text-xl text-gray-700 font-bold"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {subtitle}
            </motion.p>
          </motion.div>

          {/* Confetti behind modal */}
          <CelebrationConfetti show={true} count={20} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// SPARKLES EFFECT - For small celebrations
// ============================================
interface SparklesProps {
  show: boolean
  x?: string
  y?: string
}

export function Sparkles({ show, x = '50%', y = '50%' }: SparklesProps) {
  return (
    <AnimatePresence>
      {show && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl pointer-events-none"
              style={{ left: x, top: y }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0],
                x: Math.cos(i * 60 * Math.PI / 180) * 60,
                y: Math.sin(i * 60 * Math.PI / 180) * 60,
              }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
            >
              ✨
            </motion.span>
          ))}
        </>
      )}
    </AnimatePresence>
  )
}
