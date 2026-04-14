'use client'

import { useEffect, useState } from 'react'
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
  1: '1️⃣',
  2: '2️⃣',
  3: '3️⃣',
  4: '4️⃣',
  5: '5️⃣',
  6: '6️⃣',
  7: '7️⃣',
  8: '8️⃣',
  9: '9️⃣',
  10: '🔟',
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
          ✖️
        </motion.div>
      </div>
    )
  }

  const totalStars = getTotalStars()
  const tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-300 via-teal-300 to-cyan-400 relative overflow-hidden">
      {/* Floating decorative math symbols */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['✖️', '=', '🌟', '✖️', '🎯', '=', '🧮'].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-3xl opacity-20"
            style={{
              left: `${10 + i * 13}%`,
              top: `${5 + (i % 3) * 30}%`,
            }}
            animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/">
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
              ✖️ Times Tables
            </h1>
          </div>
          {/* Star counter */}
          <motion.div
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <span className="text-xl">⭐</span>
            <span className="font-bold text-yellow-700 text-lg">{totalStars}</span>
          </motion.div>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="text-center text-white/90 text-lg mb-6 drop-shadow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Master your multiplication facts! 🧮
        </motion.p>

        {/* Table grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {tables.map((tableNum, index) => {
            const unlocked = isTableUnlocked(tableNum)
            const mastery = getTableMastery(tableNum)
            const colors = TABLE_COLORS[tableNum]
            const emoji = TABLE_EMOJIS[tableNum]

            return (
              <motion.div
                key={tableNum}
                initial={{ opacity: 0, scale: 0.5, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay: index * 0.06,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
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
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Mastery glow */}
                      {mastery.mastered && (
                        <motion.div
                          className="absolute inset-0 bg-yellow-300/20 rounded-3xl"
                          animate={{ opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}

                      <span className="text-4xl">{emoji}</span>

                      <span className="text-white font-bold text-xl drop-shadow">
                        Table {tableNum}
                      </span>

                      {/* Star display */}
                      <div className="flex items-center gap-1">
                        {mastery.totalStars > 0 ? (
                          <>
                            <span className="text-sm">⭐</span>
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
                          👑
                        </motion.div>
                      )}
                    </motion.div>
                  </Link>
                ) : (
                  <motion.div
                    className="relative bg-gray-400/50 backdrop-blur-sm
                                rounded-3xl p-5 shadow-lg border-4 border-gray-300/50
                                min-h-[140px] flex flex-col items-center justify-center gap-2
                                cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className="text-4xl opacity-50">🔒</span>
                    <span className="text-white/70 font-bold text-xl drop-shadow">
                      Table {tableNum}
                    </span>
                    <span className="text-white/50 text-xs text-center">
                      {tableNum > 1 ? `Get 3 ⭐ on Table ${tableNum - 1}!` : 'Start here!'}
                    </span>
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
          {['🔢', '✖️', '🌟', '🧠', '🏆'].map((emoji, i) => (
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
