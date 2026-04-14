'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useCharacterStore } from '@/lib/stores/characterStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { useUnlocksStore } from '@/lib/stores/unlocksStore'
import { ParallaxBackground } from '@/components/backgrounds/ParallaxBackground'
import { PresetAvatar } from '@/components/character-creator/PresetAvatars'
import { CelebrationOverlay, CelebrationData, useCelebration } from '@/components/game/CelebrationOverlay'

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false)
  const {
    _hasHydrated,
    hasCreatedCharacter,
    characterName,
    avatarStyle,
    skinTone,
    hairColor,
    primaryColor
  } = useCharacterStore()
  const { totalStars, currentStreak, updateStreak } = useProgressStore()
  const { checkAndUnlockStreakAchievements } = useUnlocksStore()
  const { celebration, showCelebration, dismissCelebration } = useCelebration()

  useEffect(() => {
    setMounted(true)
    updateStreak()
  }, [updateStreak])

  // Check for streak achievements after streak is updated
  useEffect(() => {
    if (mounted && currentStreak > 0) {
      const streakAchievements = checkAndUnlockStreakAchievements(currentStreak)
      if (streakAchievements.length > 0) {
        const achievement = streakAchievements[0]
        showCelebration({
          type: 'streak',
          title: achievement.itemName,
          subtitle: `${currentStreak} day streak achieved!`,
          emoji: achievement.emoji || '🔥'
        })
      }
    }
  }, [mounted, currentStreak, checkAndUnlockStreakAchievements, showCelebration])

  // Wait for both client mount AND Zustand hydration before rendering
  // This fixes the mobile/iPad race condition where localStorage data loads after initial render
  if (!mounted || !_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-400 to-green-400">
        <motion.div
          className="text-7xl"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🌴
        </motion.div>
      </div>
    )
  }

  return (
    <ParallaxBackground theme="welcome" intensity="medium">
      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        {/* Main content card */}
        <motion.div
          className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl
                     border-4 border-white/50 max-w-lg w-full text-center relative z-10"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Title with animated gradient */}
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-3"
            style={{
              background: 'linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #9B59B6, #FF6B6B)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            animate={{
              backgroundPosition: ['0% center', '200% center']
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            MathQuest Worlds
          </motion.h1>

          <motion.p
            className="text-xl text-gray-600 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            A Math Adventure! 🌟
          </motion.p>

          {/* Avatar display for returning players */}
          {hasCreatedCharacter && (
            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <PresetAvatar
                style={avatarStyle}
                emotion="happy"
                skinTone={skinTone}
                hairColor={hairColor}
                primaryColor={primaryColor}
                size={150}
                animate={true}
              />
            </motion.div>
          )}

          {/* Stats display for returning players */}
          {hasCreatedCharacter && (
            <motion.div
              className="flex justify-center gap-4 mb-6 flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-yellow-200
                           px-5 py-3 rounded-full shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <motion.span
                  className="text-2xl"
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⭐
                </motion.span>
                <span className="font-bold text-yellow-700 text-lg">{totalStars}</span>
              </motion.div>
              {currentStreak > 0 && (
                <motion.div
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100
                             px-5 py-3 rounded-full shadow-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.span
                    className="text-2xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    🔥
                  </motion.span>
                  <span className="font-bold text-orange-700 text-lg">{currentStreak} day streak!</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Welcome message */}
          {hasCreatedCharacter ? (
            <motion.p
              className="text-lg text-gray-700 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Welcome back, <span className="font-bold text-green-600">{characterName || 'Adventurer'}</span>! 🎉
            </motion.p>
          ) : (
            <motion.p
              className="text-lg text-gray-700 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Create your adventurer and explore magical worlds while learning math! 🚀
            </motion.p>
          )}

          {/* Action buttons */}
          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {hasCreatedCharacter ? (
              <>
                <Link href="/worlds">
                  <motion.button
                    className="w-full px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500
                               text-white font-bold text-2xl rounded-full shadow-xl
                               border-4 border-yellow-300"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(255, 215, 0, 0.4)',
                        '0 0 40px rgba(255, 215, 0, 0.7)',
                        '0 0 20px rgba(255, 215, 0, 0.4)'
                      ]
                    }}
                    transition={{
                      boxShadow: { duration: 1.5, repeat: Infinity }
                    }}
                  >
                    🌍 Continue Adventure!
                  </motion.button>
                </Link>
                <Link href="/multiplication">
                  <motion.button
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-400 to-teal-500
                               text-white font-bold text-lg rounded-full shadow-lg
                               border-4 border-green-300"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    ✖️ Times Tables
                  </motion.button>
                </Link>
                <div className="flex gap-4">
                  <Link href="/wardrobe" className="flex-1">
                    <motion.button
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-500
                                 text-white font-bold text-lg rounded-full shadow-lg
                                 border-4 border-purple-300"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      👗 Wardrobe
                    </motion.button>
                  </Link>
                  <Link href="/progress" className="flex-1">
                    <motion.button
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-400 to-cyan-500
                                 text-white font-bold text-lg rounded-full shadow-lg
                                 border-4 border-blue-300"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      📊 Progress
                    </motion.button>
                  </Link>
                </div>
              </>
            ) : (
              <Link href="/create-character">
                <motion.button
                  className="w-full px-8 py-5 bg-gradient-to-r from-yellow-400 to-orange-500
                             text-white font-bold text-2xl rounded-full shadow-xl
                             border-4 border-yellow-300"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(255, 215, 0, 0.4)',
                      '0 0 50px rgba(255, 215, 0, 0.8)',
                      '0 0 20px rgba(255, 215, 0, 0.4)'
                    ],
                    y: [0, -5, 0]
                  }}
                  transition={{
                    boxShadow: { duration: 1.5, repeat: Infinity },
                    y: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                  }}
                >
                  ✨ Start Adventure!
                </motion.button>
              </Link>
            )}
          </motion.div>
        </motion.div>

        {/* Top right buttons - For Parents and Settings */}
        <motion.div
          className="absolute top-4 right-4 z-30 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {hasCreatedCharacter && (
            <Link href="/preferences">
              <motion.button
                className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-600 text-sm rounded-full shadow-md hover:bg-white transition-colors flex items-center gap-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-lg">⚙️</span>
                <span className="hidden sm:inline">Settings</span>
              </motion.button>
            </Link>
          )}
          <Link href="/parent">
            <motion.button
              className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-600 text-sm rounded-full shadow-md hover:bg-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              For Parents
            </motion.button>
          </Link>
        </motion.div>

        {/* Decorative bottom bouncing items */}
        <motion.div
          className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 text-4xl pointer-events-none z-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {['🥥', '🍌', '🌺', '🦋', '🌴'].map((emoji, i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -12, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut'
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </motion.div>

        {/* Streak Achievement Celebration Overlay */}
        <CelebrationOverlay
          celebration={celebration}
          onDismiss={dismissCelebration}
          autoDismissMs={4000}
        />
      </main>
    </ParallaxBackground>
  )
}
