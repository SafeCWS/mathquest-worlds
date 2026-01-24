'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { useDailyChallengeStore } from '@/lib/stores/dailyChallengeStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { getTimeUntilNextChallenge } from '@/lib/dailyChallenges'

export function DailyChallengeCard() {
  const [mounted, setMounted] = useState(false)
  const [timeUntilNext, setTimeUntilNext] = useState({ hours: 0, minutes: 0, seconds: 0 })

  const { skillLevel } = useProgressStore()
  const {
    currentChallenge,
    isCompleted,
    progress,
    refreshChallenge
  } = useDailyChallengeStore()

  // Initialize and refresh challenge
  useEffect(() => {
    setMounted(true)
    refreshChallenge(skillLevel)
  }, [skillLevel, refreshChallenge])

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const time = getTimeUntilNextChallenge()
      setTimeUntilNext(time)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted || !currentChallenge) {
    return null
  }

  const isNew = !progress.startedAt && !isCompleted

  return (
    <motion.div
      className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400
                 rounded-2xl p-4 shadow-xl border-4 border-white/30 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Sparkle background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-60"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
      </div>

      {/* NEW badge */}
      <AnimatePresence>
        {isNew && (
          <motion.div
            className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900
                       font-bold text-xs px-2 py-1 rounded-full shadow-lg
                       border-2 border-yellow-300"
            initial={{ scale: 0, rotate: -20 }}
            animate={{
              scale: 1,
              rotate: 0,
              boxShadow: [
                '0 0 10px rgba(255, 215, 0, 0.5)',
                '0 0 20px rgba(255, 215, 0, 0.8)',
                '0 0 10px rgba(255, 215, 0, 0.5)'
              ]
            }}
            exit={{ scale: 0 }}
            transition={{
              boxShadow: { duration: 1, repeat: Infinity }
            }}
          >
            NEW!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed checkmark */}
      {isCompleted && (
        <motion.div
          className="absolute top-2 right-2 bg-green-500 text-white
                     w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          <span className="text-lg">&#10003;</span>
        </motion.div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <motion.span
            className="text-3xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {currentChallenge.emoji}
          </motion.span>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">
              Daily Challenge
            </h3>
            <p className="text-white/80 text-sm font-medium">
              {currentChallenge.title}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-white/90 text-sm mb-3">
          {currentChallenge.description}
        </p>

        {/* Reward display */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
            <span className="text-lg">&#11088;</span>
            <span className="text-white font-bold text-sm">
              +{currentChallenge.reward.stars} stars
            </span>
          </div>
          {currentChallenge.reward.exclusiveItemName && (
            <div className="flex items-center gap-1 bg-yellow-400/30 rounded-full px-3 py-1">
              <span className="text-lg">&#127873;</span>
              <span className="text-white font-bold text-sm">
                + {currentChallenge.reward.exclusiveItemName}
              </span>
            </div>
          )}
        </div>

        {/* Progress or completion */}
        {isCompleted ? (
          <div className="bg-green-500/30 rounded-lg p-2 text-center">
            <p className="text-white font-bold">
              &#127881; Completed! Come back tomorrow!
            </p>
            <p className="text-white/80 text-sm">
              Next challenge in {timeUntilNext.hours}h {timeUntilNext.minutes}m
            </p>
          </div>
        ) : (
          <Link href="/worlds">
            <motion.button
              className="w-full bg-white text-purple-600 font-bold py-2 px-4 rounded-full
                         shadow-lg hover:bg-yellow-100 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              &#127919; Start Challenge!
            </motion.button>
          </Link>
        )}
      </div>
    </motion.div>
  )
}

