'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useCharacterStore } from '@/lib/stores/characterStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { useWorldStore } from '@/lib/stores/worldStore'
import { CharacterPreview } from '@/components/character-creator/CharacterPreview'
import { WorldCard } from '@/components/worlds/WorldCard'
import { WORLDS, SECRET_WORLD, isWorldUnlocked } from '@/lib/constants/worlds'

export default function WorldsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showUnlockCelebration, setShowUnlockCelebration] = useState(false)

  const { characterName, hasCreatedCharacter } = useCharacterStore()
  const { totalStars, currentStreak } = useProgressStore()
  const {
    currentWorldId,
    unlockedWorlds,
    worldProgress,
    newlyUnlockedWorld,
    setCurrentWorld,
    checkWorldUnlocks,
    clearNewlyUnlockedWorld
  } = useWorldStore()

  useEffect(() => {
    setMounted(true)

    // Redirect if no character created
    if (!hasCreatedCharacter) {
      router.push('/')
      return
    }

    // Check for new world unlocks
    const newWorld = checkWorldUnlocks(totalStars)
    if (newWorld) {
      setShowUnlockCelebration(true)
    }
  }, [hasCreatedCharacter, router, totalStars, checkWorldUnlocks])

  if (!mounted || !hasCreatedCharacter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-6xl animate-pulse">🌍</div>
      </div>
    )
  }

  // Get all worlds including secret world
  const completedWorlds = Object.entries(worldProgress)
    .filter(([, progress]) => progress.fullyCompleted)
    .map(([worldId]) => worldId)

  const allWorlds = [
    ...WORLDS,
    ...(isWorldUnlocked('rainbow', totalStars, completedWorlds)
      ? [SECRET_WORLD]
      : [])
  ]

  const handleWorldSelect = (worldId: string) => {
    if (unlockedWorlds.includes(worldId)) {
      setCurrentWorld(worldId)
      router.push(`/worlds/${worldId}`)
    }
  }

  const handleCloseCelebration = () => {
    setShowUnlockCelebration(false)
    clearNewlyUnlockedWorld()
  }

  return (
    <main className="min-h-screen flex flex-col p-4 relative overflow-hidden">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Player info */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={() => router.push('/')}
            className="text-3xl"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            🏠
          </motion.button>
          <div className="flex items-center gap-3 bg-white/80 rounded-full px-4 py-2 shadow-lg">
            <CharacterPreview size="small" animate={false} showPet={false} />
            <div>
              <p className="font-bold text-gray-800">{characterName || 'Adventurer'}</p>
              <div className="flex items-center gap-2 text-sm">
                <span>⭐ {totalStars}</span>
                {currentStreak > 0 && <span>🔥 {currentStreak}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-2">
          <motion.button
            onClick={() => router.push('/preferences')}
            className="p-3 bg-white/80 rounded-full shadow-lg text-xl"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Learning Settings"
          >
            ⚙️
          </motion.button>
          <motion.button
            onClick={() => router.push('/wardrobe')}
            className="p-3 bg-white/80 rounded-full shadow-lg text-xl"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            👗
          </motion.button>
          <motion.button
            onClick={() => router.push('/progress')}
            className="p-3 bg-white/80 rounded-full shadow-lg text-xl"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            📊
          </motion.button>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold rainbow-text mb-2">
          Choose Your World!
        </h1>
        <p className="text-gray-600">
          Explore magical lands and learn math! 🌟
        </p>
      </motion.div>

      {/* World grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto pb-4">
          {allWorlds.map((world, index) => (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <WorldCard
                world={world}
                isUnlocked={unlockedWorlds.includes(world.id)}
                isActive={currentWorldId === world.id}
                totalStars={totalStars}
                onClick={() => handleWorldSelect(world.id)}
                progress={worldProgress[world.id]}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* World unlock celebration overlay */}
      <AnimatePresence>
        {showUnlockCelebration && newlyUnlockedWorld && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseCelebration}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Celebration confetti */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-2xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: '-10%'
                    }}
                    initial={{ y: 0, rotate: 0, opacity: 1 }}
                    animate={{
                      y: '120vh',
                      rotate: 720,
                      opacity: 0
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      delay: i * 0.1
                    }}
                  >
                    {['⭐', '🌟', '✨', '🎉', '🎊'][i % 5]}
                  </motion.span>
                ))}
              </div>

              {/* Unlocked world */}
              {(() => {
                const world = [...WORLDS, SECRET_WORLD].find(
                  (w) => w.id === newlyUnlockedWorld
                )
                if (!world) return null

                return (
                  <>
                    <motion.span
                      className="text-8xl block mb-4"
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [-10, 10, -10]
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity
                      }}
                    >
                      {world.emoji}
                    </motion.span>
                    <h2 className="text-3xl font-bold mb-2 rainbow-text">
                      World Unlocked!
                    </h2>
                    <p className="text-xl font-bold text-gray-800 mb-2">
                      {world.name}
                    </p>
                    <p className="text-gray-600 mb-6">{world.description}</p>
                  </>
                )
              })()}

              <motion.button
                className="btn-primary w-full"
                onClick={handleCloseCelebration}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Awesome! 🎉
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['🐱', '🌴', '🚀', '🧜‍♀️', '🏰', '🦖', '🍭'].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-4xl opacity-30"
            style={{
              left: `${10 + i * 15}%`,
              top: `${Math.random() * 20 + 70}%`
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [-10, 10, -10]
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>
    </main>
  )
}
