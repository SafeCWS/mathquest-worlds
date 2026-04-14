'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useMultiplicationStore, GameMode } from '@/lib/stores/multiplicationStore'
import { useEmojiThemeStore } from '@/lib/stores/emojiThemeStore'
import EmojiPicker from '@/components/multiplication/EmojiPicker'

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
  {
    mode: 'array',
    name: 'Array Builder',
    emoji: '🧱',
    description: 'Build rows and columns!',
    color: { from: 'from-teal-400', to: 'to-cyan-500', border: 'border-teal-300' },
  },
  {
    mode: 'groups',
    name: 'Group Maker',
    emoji: '🧺',
    description: 'Fill equal groups!',
    color: { from: 'from-lime-400', to: 'to-green-500', border: 'border-lime-300' },
  },
  {
    mode: 'dragmatch',
    name: 'Drag Match',
    emoji: '🔗',
    description: 'Drag facts to answers!',
    color: { from: 'from-sky-400', to: 'to-blue-500', border: 'border-sky-300' },
  },
  {
    mode: 'numberline',
    name: 'Number Line',
    emoji: '🐸',
    description: 'Hop along the line!',
    color: { from: 'from-emerald-400', to: 'to-teal-600', border: 'border-emerald-300' },
  },
  {
    mode: 'flip',
    name: 'Flip It!',
    emoji: '🔄',
    description: 'See the magic of swapping!',
    color: { from: 'from-fuchsia-400', to: 'to-purple-600', border: 'border-fuchsia-300' },
  },
  {
    mode: 'chart',
    name: 'Table Chart',
    emoji: '📊',
    description: 'Fill in the chart!',
    color: { from: 'from-violet-400', to: 'to-indigo-600', border: 'border-violet-300' },
  },
  {
    mode: 'story',
    name: 'Story Time',
    emoji: '📖',
    description: 'Solve fun stories!',
    color: { from: 'from-rose-400', to: 'to-pink-600', border: 'border-rose-300' },
  },
  {
    mode: 'bubble',
    name: 'Bubble Pop',
    emoji: '🫧',
    description: 'Pop the right answer!',
    color: { from: 'from-cyan-400', to: 'to-blue-600', border: 'border-cyan-300' },
  },
]

// Special mode only for table 9
const FINGER_TRICK_CARD: ModeCard = {
  mode: 'fingers',
  name: '9s Finger Trick',
  emoji: '🖐️',
  description: 'The magic finger trick!',
  color: { from: 'from-indigo-400', to: 'to-blue-600', border: 'border-indigo-300' },
}

// Bouncy spring easing — the signature Duolingo overshoot
const BOUNCY_EASE: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

/** Circular progress ring around star counter */
function ProgressRing({
  percent,
  size = 52,
  strokeWidth = 4,
}: {
  percent: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg
      width={size}
      height={size}
      className="absolute -inset-1"
      style={{ transform: 'rotate(-90deg)' }}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,215,0,0.9)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="progress-ring-circle"
      />
    </svg>
  )
}

export default function TableDetailPage() {
  const [mounted, setMounted] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const params = useParams()
  const tableNumber = Number(params.table)
  const {
    _hasHydrated,
    getTableMastery,
    isTableUnlocked,
    speedChallengeUnlocked,
  } = useMultiplicationStore()
  const getTableEmoji = useEmojiThemeStore((s) => s.getTableEmoji)
  const currentEmoji = mounted && _hasHydrated ? getTableEmoji(tableNumber) : '⭐'

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
  const allModes = [...MODE_CARDS, ...(tableNumber === 9 ? [FINGER_TRICK_CARD] : [])]
  const maxStars = allModes.length * 3
  const progressPercent = maxStars > 0 ? Math.round((mastery.totalStars / maxStars) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300 relative overflow-hidden">
      {/* Floating decorative elements — CSS animated for performance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['✖️', `${tableNumber}`, '=', '⭐', '🎮'].map((symbol, i) => (
          <span
            key={i}
            className="float-bg-emoji text-3xl"
            style={{
              left: `${8 + i * 20}%`,
              top: `${10 + (i % 3) * 25}%`,
            }}
          >
            {symbol}
          </span>
        ))}
      </div>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: BOUNCY_EASE }}
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
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                Table {tableNumber} ✖️
              </h1>
              <motion.button
                className="text-2xl bg-white/30 backdrop-blur-sm rounded-full w-11 h-11
                           flex items-center justify-center shadow-md
                           hover:bg-white/50 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowEmojiPicker(true)}
                aria-label="Change emoji"
                title="Change emoji"
              >
                {currentEmoji}
              </motion.button>
            </div>
          </div>
          {/* Star counter with progress ring */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 15 }}
          >
            <ProgressRing percent={progressPercent} size={56} strokeWidth={4} />
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md z-10">
              <span className="text-lg">⭐</span>
              <span className="font-bold text-yellow-700 text-base">
                {mastery.totalStars}/{maxStars}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Mastery badge */}
        {mastery.mastered && (
          <motion.div
            className="text-center mb-4"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2, stiffness: 400, damping: 12 }}
          >
            <span className="inline-flex items-center gap-2 bg-yellow-400/80 backdrop-blur-sm
                             px-5 py-2 rounded-full shadow-lg text-yellow-900 font-bold">
              👑 Mastered!
            </span>
          </motion.div>
        )}

        {/* Quick reference preview — staggered fact fade-in */}
        <motion.div
          className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-inner"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ease: BOUNCY_EASE }}
        >
          <div className="flex flex-wrap justify-center gap-2 text-sm text-white/90 font-medium">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n, idx) => (
              <motion.span
                key={n}
                className="bg-white/20 px-2 py-1 rounded-lg"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.3 + idx * 0.05,
                  duration: 0.3,
                  ease: BOUNCY_EASE,
                }}
              >
                {tableNumber}x{n}={tableNumber * n}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Game mode grid */}
        <div className="grid grid-cols-2 gap-4">
          {allModes.map((card, index) => {
            const modeScore = mastery.modeScores[card.mode]
            const isSpeedLocked = card.mode === 'speed' && !speedChallengeUnlocked
            const isAvailable = !isSpeedLocked
            const isNew = modeScore.attempts === 0 && isAvailable

            return (
              <motion.div
                key={card.mode}
                initial={{ opacity: 0, scale: 0.3, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay: 0.25 + index * 0.06,
                  duration: 0.5,
                  ease: BOUNCY_EASE,
                }}
              >
                {isAvailable ? (
                  <Link href={`/multiplication/${tableNumber}/${card.mode}`}>
                    <motion.div
                      className={`relative bg-gradient-to-br ${card.color.from} ${card.color.to}
                                  rounded-3xl p-5 shadow-xl border-4 ${card.color.border}
                                  min-h-[130px] flex flex-col items-center justify-center gap-2
                                  cursor-pointer overflow-hidden`}
                      whileHover={{ scale: 1.07, y: -5, boxShadow: '0 14px 30px rgba(0,0,0,0.2)' }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {/* "New!" badge for untried modes */}
                      {isNew && (
                        <span
                          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs
                                     font-bold px-2.5 py-1 rounded-full shadow-lg badge-pulse z-10"
                        >
                          New!
                        </span>
                      )}

                      <motion.span
                        className="text-4xl"
                        initial={{ scale: 0, rotate: -60 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: 0.25 + index * 0.06 + 0.15,
                          duration: 0.4,
                          ease: BOUNCY_EASE,
                        }}
                      >
                        {card.emoji}
                      </motion.span>
                      <span className="text-white font-bold text-lg drop-shadow">
                        {card.name}
                      </span>
                      <span className="text-white/70 text-xs text-center">
                        {card.description}
                      </span>
                      {/* Star display — stars pop in one-by-one */}
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3].map((star) => (
                          <motion.span
                            key={star}
                            className={`text-sm ${
                              star <= modeScore.bestStars
                                ? 'opacity-100'
                                : 'opacity-30'
                            }`}
                            initial={
                              star <= modeScore.bestStars
                                ? { scale: 0, rotate: -180 }
                                : {}
                            }
                            animate={
                              star <= modeScore.bestStars
                                ? { scale: 1, rotate: 0 }
                                : {}
                            }
                            transition={
                              star <= modeScore.bestStars
                                ? {
                                    delay: 0.6 + index * 0.06 + star * 0.12,
                                    duration: 0.4,
                                    ease: BOUNCY_EASE,
                                  }
                                : {}
                            }
                          >
                            ⭐
                          </motion.span>
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

      {/* Emoji Picker overlay */}
      <EmojiPicker
        tableNumber={tableNumber}
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
      />
    </div>
  )
}
