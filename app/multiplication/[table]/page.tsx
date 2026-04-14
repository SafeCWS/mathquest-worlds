'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useMultiplicationStore, GameMode } from '@/lib/stores/multiplicationStore'

interface ModeCard {
  mode: GameMode
  name: string
  emoji: string
  description: string
  color: { from: string; to: string; border: string }
}

const MODE_CARDS: ModeCard[] = [
  {
    mode: 'explorer',
    name: 'Explorer',
    emoji: '🔍',
    description: 'See how it works!',
    color: { from: 'from-emerald-400', to: 'to-green-500', border: 'border-emerald-300' },
  },
  {
    mode: 'match',
    name: 'Match',
    emoji: '🎯',
    description: 'Pick the right answer',
    color: { from: 'from-blue-400', to: 'to-indigo-500', border: 'border-blue-300' },
  },
  {
    mode: 'memory',
    name: 'Memory',
    emoji: '🃏',
    description: 'Flip and match pairs',
    color: { from: 'from-purple-400', to: 'to-violet-500', border: 'border-purple-300' },
  },
  {
    mode: 'dice',
    name: 'Dice',
    emoji: '🎲',
    description: 'Roll and discover!',
    color: { from: 'from-orange-400', to: 'to-red-500', border: 'border-orange-300' },
  },
  {
    mode: 'missing',
    name: 'Missing Number',
    emoji: '❓',
    description: 'Find the missing piece',
    color: { from: 'from-pink-400', to: 'to-rose-500', border: 'border-pink-300' },
  },
  {
    mode: 'speed',
    name: 'Speed Challenge',
    emoji: '⚡',
    description: 'How many can you get?',
    color: { from: 'from-yellow-400', to: 'to-amber-500', border: 'border-yellow-300' },
  },
]

export default function TableDetailPage() {
  const [mounted, setMounted] = useState(false)
  const params = useParams()
  const tableNumber = Number(params.table)
  const {
    _hasHydrated,
    getTableMastery,
    isTableUnlocked,
    speedChallengeUnlocked,
  } = useMultiplicationStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Wait for both client mount AND Zustand hydration
  if (!mounted || !_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300">
        <motion.div
          className="text-7xl"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✖️
        </motion.div>
      </div>
    )
  }

  // Validate table number
  if (isNaN(tableNumber) || tableNumber < 1 || tableNumber > 10) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300 p-4">
        <div className="text-6xl mb-4">🤔</div>
        <h1 className="text-2xl font-bold text-white mb-4">
          Table not found!
        </h1>
        <Link href="/multiplication">
          <motion.button
            className="px-6 py-3 bg-white/80 text-gray-700 font-bold rounded-full shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⬅️ Back to Tables
          </motion.button>
        </Link>
      </div>
    )
  }

  // Redirect if table is locked
  if (!isTableUnlocked(tableNumber)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300 p-4">
        <motion.div
          className="text-6xl mb-4"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🔒
        </motion.div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Table {tableNumber} is Locked
        </h1>
        <p className="text-white/80 mb-6">
          Keep practicing to unlock this table!
        </p>
        <Link href="/multiplication">
          <motion.button
            className="px-6 py-3 bg-white/80 text-gray-700 font-bold rounded-full shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⬅️ Back to Tables
          </motion.button>
        </Link>
      </div>
    )
  }

  const mastery = getTableMastery(tableNumber)

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['✖️', `${tableNumber}`, '=', '⭐', '🎮'].map((symbol, i) => (
          <motion.span
            key={i}
            className="absolute text-3xl opacity-15"
            style={{
              left: `${8 + i * 20}%`,
              top: `${10 + (i % 3) * 25}%`,
            }}
            animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
            transition={{
              duration: 3 + i * 0.4,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            {symbol}
          </motion.span>
        ))}
      </div>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/multiplication">
            <motion.button
              className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-600 rounded-full
                         shadow-md hover:bg-white transition-colors text-lg min-w-[48px] min-h-[48px]
                         flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ⬅️
            </motion.button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
              Table {tableNumber} ✖️
            </h1>
          </div>
          {/* Star counter for this table */}
          <motion.div
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <span className="text-xl">⭐</span>
            <span className="font-bold text-yellow-700 text-lg">
              {mastery.totalStars}/18
            </span>
          </motion.div>
        </motion.div>

        {/* Mastery badge */}
        {mastery.mastered && (
          <motion.div
            className="text-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 bg-yellow-400/80 backdrop-blur-sm
                             px-5 py-2 rounded-full shadow-lg text-yellow-900 font-bold">
              👑 Mastered!
            </span>
          </motion.div>
        )}

        {/* Quick reference preview */}
        <motion.div
          className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-inner"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex flex-wrap justify-center gap-2 text-sm text-white/90 font-medium">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <span key={n} className="bg-white/20 px-2 py-1 rounded-lg">
                {tableNumber}x{n}={tableNumber * n}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Game mode grid */}
        <div className="grid grid-cols-2 gap-4">
          {MODE_CARDS.map((card, index) => {
            const modeScore = mastery.modeScores[card.mode]
            const isSpeedLocked = card.mode === 'speed' && !speedChallengeUnlocked
            const isAvailable = !isSpeedLocked

            return (
              <motion.div
                key={card.mode}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay: 0.2 + index * 0.08,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
              >
                {isAvailable ? (
                  <Link href={`/multiplication/${tableNumber}/${card.mode}`}>
                    <motion.div
                      className={`bg-gradient-to-br ${card.color.from} ${card.color.to}
                                  rounded-3xl p-5 shadow-xl border-4 ${card.color.border}
                                  min-h-[130px] flex flex-col items-center justify-center gap-2
                                  cursor-pointer`}
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-4xl">{card.emoji}</span>
                      <span className="text-white font-bold text-lg drop-shadow">
                        {card.name}
                      </span>
                      <span className="text-white/70 text-xs text-center">
                        {card.description}
                      </span>
                      {/* Star display */}
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3].map((star) => (
                          <span
                            key={star}
                            className={`text-sm ${
                              star <= modeScore.bestStars
                                ? 'opacity-100'
                                : 'opacity-30'
                            }`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  </Link>
                ) : (
                  <motion.div
                    className="bg-gray-400/50 backdrop-blur-sm
                                rounded-3xl p-5 shadow-lg border-4 border-gray-300/50
                                min-h-[130px] flex flex-col items-center justify-center gap-2
                                cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className="text-4xl opacity-50">🔒</span>
                    <span className="text-white/70 font-bold text-lg drop-shadow">
                      {card.name}
                    </span>
                    <span className="text-white/50 text-xs text-center">
                      Play 3 tables to unlock!
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Bottom decorative */}
        <motion.div
          className="flex justify-center gap-4 mt-8 text-3xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {['🎮', '🧩', '🏅', '🎲', '💡'].map((emoji, i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
