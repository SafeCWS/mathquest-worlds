'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useRouter, useParams } from 'next/navigation'
import { useCharacterStore } from '@/lib/stores/characterStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { useWorldStore } from '@/lib/stores/worldStore'
import { CharacterPreview } from '@/components/character-creator/CharacterPreview'
import { LEVELS, isLevelUnlocked } from '@/lib/constants/levels'
import { getWorldById, World } from '@/lib/constants/worlds'

export default function WorldMapPage() {
  const router = useRouter()
  const params = useParams()
  const worldId = params.worldId as string

  const [mounted, setMounted] = useState(false)
  const [world, setWorld] = useState<World | null>(null)

  const { characterName, hasCreatedCharacter } = useCharacterStore()
  const { totalStars, moduleProgress } = useProgressStore()
  const { worldProgress, setCurrentWorld } = useWorldStore()

  useEffect(() => {
    setMounted(true)

    if (!hasCreatedCharacter) {
      router.push('/')
      return
    }

    const foundWorld = getWorldById(worldId)
    if (foundWorld) {
      setWorld(foundWorld)
      setCurrentWorld(worldId)
    } else {
      router.push('/worlds')
    }
  }, [worldId, hasCreatedCharacter, router, setCurrentWorld])

  if (!mounted || !world) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-6xl animate-pulse">{world?.emoji || '🌍'}</div>
      </div>
    )
  }

  // Get level completion status
  const getLevelProgress = (levelId: number) => {
    let totalModuleStars = 0
    let completedModules = 0

    for (let moduleId = 1; moduleId <= 5; moduleId++) {
      const key = `${levelId}-${moduleId}`
      const progress = moduleProgress[key]
      if (progress?.completed) {
        completedModules++
        totalModuleStars += progress.starsEarned
      }
    }

    return {
      completedModules,
      totalModuleStars,
      isComplete: completedModules >= 5
    }
  }

  const handleLevelSelect = (levelId: number) => {
    if (isLevelUnlocked(levelId, totalStars)) {
      router.push(`/worlds/${worldId}/${levelId}/1`)
    }
  }

  return (
    <main
      className={`min-h-screen flex flex-col p-4 relative overflow-hidden world-${worldId}`}
      style={{ background: world.colors.background }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Back button and player info */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={() => router.push('/worlds')}
            className="text-3xl bg-white/80 p-2 rounded-full shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ←
          </motion.button>
          <div className="flex items-center gap-3 bg-white/80 rounded-full px-4 py-2 shadow-lg">
            <CharacterPreview size="small" animate={false} showPet={false} />
            <div>
              <p className="font-bold text-gray-800">{characterName}</p>
              <span className="text-sm">⭐ {totalStars}</span>
            </div>
          </div>
        </div>

        {/* World info */}
        <div className="flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 shadow-lg">
          <span className="text-3xl">{world.emoji}</span>
          <span className="font-bold text-gray-800">{world.name}</span>
        </div>
      </motion.div>

      {/* World description */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-2">
          {world.name}
        </h1>
        <p className="text-white/90 drop-shadow">{world.description}</p>
      </motion.div>

      {/* Level path */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative max-w-2xl w-full">
          {/* Path line */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 600"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M200,550 Q100,450 200,400 Q300,350 200,300 Q100,250 200,200 Q300,150 200,100 Q100,50 200,50"
              stroke="white"
              strokeWidth="8"
              strokeDasharray="20,10"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2 }}
            />
          </svg>

          {/* Level nodes */}
          <div className="relative h-[600px]">
            {LEVELS.map((level, index) => {
              const isUnlocked = isLevelUnlocked(level.id, totalStars)
              const progress = getLevelProgress(level.id)
              const yPos = 550 - index * 100
              const xPos = index % 2 === 0 ? 30 : 70

              return (
                <motion.button
                  key={level.id}
                  className={`
                    absolute transform -translate-x-1/2 -translate-y-1/2
                    w-24 h-24 rounded-full flex flex-col items-center justify-center
                    ${
                      isUnlocked
                        ? 'bg-gradient-to-b from-yellow-300 to-yellow-500 shadow-xl cursor-pointer'
                        : 'bg-gray-400 cursor-not-allowed'
                    }
                    ${progress.isComplete ? 'ring-4 ring-green-400' : ''}
                  `}
                  style={{
                    left: `${xPos}%`,
                    top: `${(yPos / 600) * 100}%`
                  }}
                  onClick={() => handleLevelSelect(level.id)}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.15 + 0.3 }}
                  whileHover={isUnlocked ? { scale: 1.1 } : {}}
                  whileTap={isUnlocked ? { scale: 0.95 } : {}}
                >
                  {isUnlocked ? (
                    <>
                      <span className="text-3xl">{level.badgeEmoji}</span>
                      <span className="text-xs font-bold text-gray-800 mt-1">
                        Level {level.id}
                      </span>
                      {/* Stars earned */}
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(3)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${
                              i < Math.ceil(progress.totalModuleStars / 5)
                                ? 'text-yellow-600'
                                : 'text-gray-400'
                            }`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl">🔒</span>
                      <span className="text-xs text-white mt-1">
                        ⭐ {level.unlockStars}
                      </span>
                    </>
                  )}

                  {/* Completed checkmark */}
                  {progress.isComplete && (
                    <motion.div
                      className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <span className="text-white text-lg">✓</span>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Character at the bottom */}
      <motion.div
        className="flex justify-center mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <CharacterPreview size="medium" animate showPet />
      </motion.div>

      {/* Decorative world objects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {world.countingObjects.map((obj, i) => (
          <motion.span
            key={i}
            className="absolute text-4xl opacity-40"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 30 + 10}%`
            }}
            animate={{
              y: [0, -15, 0],
              rotate: [-5, 5, -5]
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3
            }}
          >
            {obj}
          </motion.span>
        ))}
      </div>
    </main>
  )
}
