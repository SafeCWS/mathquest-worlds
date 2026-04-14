'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'

const TABLE_COLORS: Record<number, { from: string; to: string; border: string }> = {
  1: { from: 'from-rose-400', to: 'to-pink-500', border: 'border-rose-300' },
  2: { from: 'from-orange-400', to: 'to-amber-500', border: 'border-orange-300' },
  3: { from: 'from-yellow-400', to: 'to-lime-500', border: 'border-yellow-300' },
  4: { from: 'from-green-400', to: 'to-emerald-500', border: 'border-green-300' },
  5: { from: 'from-teal-400', to: 'to-cyan-500', border: 'border-teal-300' },
  6: { from: 'from-sky-400', to: 'to-blue-500', border: 'border-sky-300' },
  7: { from: 'from-indigo-400', to: 'to-violet-500', border: 'border-indigo-300' },
  8: { from: 'from-purple-400', to: 'to-fuchsia-500', border: 'border-purple-300' },
  9: { from: 'from-pink-400', to: 'to-red-500', border: 'border-pink-300' },
  10: { from: 'from-amber-400', to: 'to-yellow-500', border: 'border-amber-300' },
}

const TABLE_EMOJIS: Record<number, string> = {
  1: '1\uFE0F\u20E3',
  2: '2\uFE0F\u20E3',
  3: '3\uFE0F\u20E3',
  4: '4\uFE0F\u20E3',
  5: '5\uFE0F\u20E3',
  6: '6\uFE0F\u20E3',
  7: '7\uFE0F\u20E3',
  8: '8\uFE0F\u20E3',
  9: '9\uFE0F\u20E3',
  10: '\uD83D\uDD1F',
}

// Background floating emojis — rendered via pure CSS keyframes for performance
const BG_EMOJIS = [
  { emoji: '\u2728', left: '8%', top: '15%', size: '2.5rem' },
  { emoji: '\uD83C\uDF1F', left: '85%', top: '10%', size: '2rem' },
  { emoji: '\uD83E\uDDEE', left: '75%', top: '55%', size: '2.5rem' },
  { emoji: '\uD83C\uDFAF', left: '12%', top: '70%', size: '2rem' },
]

// Sparkle positions for mastered tables (relative to card)
const SPARKLE_POSITIONS = [
  { top: '8%', left: '15%' },
  { top: '20%', right: '10%' },
  { bottom: '15%', left: '20%' },
  { bottom: '8%', right: '18%' },
]

// Bouncy spring easing
const BOUNCY_EASE: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

/** Animated counter that counts up from 0 to `target` */
function AnimatedStarCounter({ target }: { target: number }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (target === 0) {
      setDisplay(0)
      return
    }
    let start: number | null = null
    const duration = Math.min(600 + target * 30, 1500) // Longer for bigger numbers, capped

    function step(timestamp: number) {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target])

  return <span>{display}</span>
}

export default function MultiplicationHubPage() {
  const [mounted, setMounted] = useState(false)
  const {
    _hasHydrated,
    unlockedTables,
    isTableUnlocked,
    getTableMastery,
    getTotalStars,
  } = useMultiplicationStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Wait for both client mount AND Zustand hydration
  if (!mounted || !_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-300 via-teal-300 to-cyan-400">
        <motion.div
          className="text-7xl"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {'\u2716\uFE0F'}
        </motion.div>
      </div>
    )
  }

  const totalStars = getTotalStars()
  const tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  // Find the first locked table (next-to-unlock)
  const firstLockedTable = tables.find((t) => !isTableUnlocked(t))

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-300 via-teal-300 to-cyan-400 relative overflow-hidden">
      {/* Floating background emojis — pure CSS keyframes for performance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {BG_EMOJIS.map((item, i) => (
          <span
            key={i}
            className="float-bg-emoji text-3xl"
            style={{
              left: item.left,
              top: item.top,
              fontSize: item.size,
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: BOUNCY_EASE }}
        >
          <Link href="/">
            <motion.button
              className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-600 rounded-full
                         shadow-md hover:bg-white transition-colors text-lg min-w-[48px] min-h-[48px]
                         flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {'\u2B05\uFE0F'}
            </motion.button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
              {'\u2716\uFE0F'} Times Tables
            </h1>
          </div>
          {/* Star counter with count-up animation */}
          <motion.div
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 15 }}
          >
            <motion.span
              className="text-xl"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {'\u2B50'}
            </motion.span>
            <span className="font-bold text-yellow-700 text-lg counter-pop">
              <AnimatedStarCounter target={totalStars} />
            </span>
          </motion.div>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="text-center text-white/90 text-lg mb-6 drop-shadow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease: BOUNCY_EASE }}
        >
          Master your multiplication facts! {'\uD83E\uDDEE'}
        </motion.p>

        {/* Table grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {tables.map((tableNum, index) => {
            const unlocked = isTableUnlocked(tableNum)
            const mastery = getTableMastery(tableNum)
            const colors = TABLE_COLORS[tableNum]
            const emoji = TABLE_EMOJIS[tableNum]
            const isNextToUnlock = tableNum === firstLockedTable

            return (
              <motion.div
                key={tableNum}
                initial={{ opacity: 0, scale: 0.3, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay: index * 0.07,
                  duration: 0.5,
                  ease: BOUNCY_EASE,
                }}
              >
                {unlocked ? (
                  <Link href={`/multiplication/${tableNum}`}>
                    <motion.div
                      className={`relative bg-gradient-to-br ${colors.from} ${colors.to}
                                  rounded-3xl p-5 shadow-xl border-4 ${colors.border}
                                  min-h-[140px] flex flex-col items-center justify-center gap-2
                                  cursor-pointer overflow-hidden
                                  ${mastery.mastered ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}
                      whileHover={{ scale: 1.07, y: -6, boxShadow: '0 12px 30px rgba(0,0,0,0.2)' }}
                      whileTap={{ scale: 0.92 }}
                    >
                      {/* Mastery glow */}
                      {mastery.mastered && (
                        <motion.div
                          className="absolute inset-0 bg-yellow-300/20 rounded-3xl"
                          animate={{ opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}

                      {/* Sparkles for mastered tables (9+ stars) — CSS animated */}
                      {mastery.totalStars >= 9 &&
                        SPARKLE_POSITIONS.map((pos, si) => (
                          <span
                            key={si}
                            className="absolute micro-sparkle text-sm pointer-events-none"
                            style={{
                              ...pos,
                              animationDelay: `${si * 0.7}s`,
                            }}
                          >
                            {['\u2728', '\uD83D\uDCAB', '\u2728', '\uD83C\uDF1F'][si]}
                          </span>
                        ))}

                      <motion.span
                        className="text-4xl"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: index * 0.07 + 0.2,
                          duration: 0.4,
                          ease: BOUNCY_EASE,
                        }}
                      >
                        {emoji}
                      </motion.span>

                      <span className="text-white font-bold text-xl drop-shadow">
                        Table {tableNum}
                      </span>

                      {/* Star display */}
                      <div className="flex items-center gap-1">
                        {mastery.totalStars > 0 ? (
                          <>
                            <span className="text-sm">{'\u2B50'}</span>
                            <span className="text-white/90 font-bold text-sm">
                              {mastery.totalStars}/18
                            </span>
                          </>
                        ) : (
                          <span className="text-white/60 text-sm">Tap to start!</span>
                        )}
                      </div>

                      {/* Mastered badge */}
                      {mastery.mastered && (
                        <motion.div
                          className="absolute top-2 right-2 text-2xl"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {'\uD83D\uDC51'}
                        </motion.div>
                      )}
                    </motion.div>
                  </Link>
                ) : (
                  <motion.div
                    className={`relative bg-gray-400/50 backdrop-blur-sm
                                rounded-3xl p-5 shadow-lg border-4 border-gray-300/50
                                min-h-[140px] flex flex-col items-center justify-center gap-2
                                cursor-not-allowed
                                ${isNextToUnlock ? 'glow-pulse-invite' : ''}`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.span
                      className="text-4xl opacity-50"
                      animate={
                        isNextToUnlock
                          ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }
                          : {}
                      }
                      transition={
                        isNextToUnlock
                          ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                          : {}
                      }
                    >
                      {'\uD83D\uDD12'}
                    </motion.span>
                    <span className="text-white/70 font-bold text-xl drop-shadow">
                      Table {tableNum}
                    </span>
                    <span className="text-white/50 text-xs text-center">
                      {tableNum > 1 ? `Get 3 \u2B50 on Table ${tableNum - 1}!` : 'Start here!'}
                    </span>
                    {/* "Almost there!" nudge on next-to-unlock */}
                    {isNextToUnlock && (
                      <motion.span
                        className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs
                                   font-bold px-2 py-1 rounded-full shadow-lg badge-pulse"
                      >
                        Next!
                      </motion.span>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Bottom decorative bouncing items */}
        <motion.div
          className="flex justify-center gap-4 mt-8 text-3xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {['\uD83D\uDD22', '\u2716\uFE0F', '\uD83C\uDF1F', '\uD83E\uDDE0', '\uD83C\uDFC6'].map((emoji, i) => (
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
