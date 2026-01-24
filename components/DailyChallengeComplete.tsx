'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDailyChallengeStore } from '@/lib/stores/dailyChallengeStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { useEconomyStore } from '@/lib/stores/economyStore'
import { useUnlocksStore } from '@/lib/stores/unlocksStore'

export function DailyChallengeComplete() {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([])

  const { currentChallenge, showCelebration, hideCelebration } = useDailyChallengeStore()
  const { addStars } = useProgressStore()
  const { earnStars } = useEconomyStore()
  const { unlockItem } = useUnlocksStore()

  // Generate confetti on show
  useEffect(() => {
    if (showCelebration) {
      const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#A78BFA', '#FB7185', '#34D399']
      const newConfetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      }))
      setConfetti(newConfetti)

      // Award rewards
      if (currentChallenge) {
        addStars(currentChallenge.reward.stars)
        earnStars(currentChallenge.reward.stars, 'bonus')

        if (currentChallenge.reward.exclusiveItemId && currentChallenge.reward.exclusiveItemName) {
          unlockItem(
            currentChallenge.reward.exclusiveItemId,
            currentChallenge.reward.exclusiveItemName,
            'daily-exclusive'
          )
        }
      }
    }
  }, [showCelebration, currentChallenge, addStars, earnStars, unlockItem])

  if (!showCelebration || !currentChallenge) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={hideCelebration}
      >
        {/* Confetti */}
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              left: `${piece.x}%`,
              backgroundColor: piece.color,
              top: -20
            }}
            initial={{ y: -20, rotate: 0, opacity: 1 }}
            animate={{
              y: window.innerHeight + 50,
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
              opacity: [1, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: piece.delay,
              ease: 'linear'
            }}
          />
        ))}

        {/* Celebration card */}
        <motion.div
          className="bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500
                     rounded-3xl p-8 max-w-sm mx-4 shadow-2xl border-4 border-white/50
                     relative overflow-hidden"
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sparkles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 text-2xl"
              style={{
                left: `${10 + (i % 4) * 25}%`,
                top: `${10 + Math.floor(i / 4) * 70}%`
              }}
              animate={{
                scale: [0.8, 1.3, 0.8],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            >
              &#10024;
            </motion.div>
          ))}

          <div className="relative z-10 text-center">
            {/* Trophy */}
            <motion.div
              className="text-7xl mb-4"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              &#127942;
            </motion.div>

            <motion.h2
              className="text-3xl font-bold text-white mb-2 drop-shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              AMAZING!
            </motion.h2>

            <motion.p
              className="text-xl text-white/90 mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Daily Challenge Complete!
            </motion.p>

            {/* Rewards */}
            <motion.div
              className="bg-white/20 rounded-xl p-4 mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-white/80 text-sm mb-2">You earned:</p>
              <div className="flex items-center justify-center gap-2 text-white font-bold text-xl">
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  &#11088;
                </motion.span>
                <span>+{currentChallenge.reward.stars} Stars</span>
              </div>
              {currentChallenge.reward.exclusiveItemName && (
                <motion.div
                  className="mt-2 flex items-center justify-center gap-2 text-yellow-200 font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                >
                  <span>&#127873;</span>
                  <span>{currentChallenge.reward.exclusiveItemName}</span>
                </motion.div>
              )}
            </motion.div>

            <motion.p
              className="text-white/80 text-sm mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Come back tomorrow for a new challenge!
            </motion.p>

            <motion.button
              className="bg-white text-orange-500 font-bold text-lg py-3 px-8 rounded-full
                         shadow-lg hover:bg-yellow-100 transition-colors"
              onClick={hideCelebration}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              &#127881; Awesome!
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

