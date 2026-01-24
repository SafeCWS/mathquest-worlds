'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useCharacterStore } from '@/lib/stores/characterStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { useWorldStore } from '@/lib/stores/worldStore'
import { CharacterPreview } from '@/components/character-creator/CharacterPreview'
import { XPProgressBar } from '@/components/progress/XPProgressBar'
import { SkillBadge } from '@/components/progress/SkillBadge'
import { WorldProgressRing } from '@/components/progress/WorldProgressRing'
import { StarCounter } from '@/components/progress/StarCounter'
import { LEVELS } from '@/lib/constants/levels'
import { WORLDS } from '@/lib/constants/worlds'

export default function ProgressPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const { characterName, hasCreatedCharacter } = useCharacterStore()
  const {
    totalStars,
    currentStreak,
    longestStreak,
    moduleProgress,
    completedLevels,
    questionsAnsweredToday,
    correctAnswersToday,
    skillLevel
  } = useProgressStore()
  const { worldProgress, unlockedWorlds } = useWorldStore()

  useEffect(() => {
    setMounted(true)
    if (!hasCreatedCharacter) {
      router.push('/')
    }
  }, [hasCreatedCharacter, router])

  if (!mounted || !hasCreatedCharacter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-6xl animate-pulse">📊</div>
      </div>
    )
  }

  const totalModulesCompleted = Object.values(moduleProgress).filter(
    (m) => m.completed
  ).length
  const totalPossibleModules = LEVELS.length * 3
  const progressPercentage = Math.round(
    (totalModulesCompleted / totalPossibleModules) * 100
  )

  const todayAccuracy =
    questionsAnsweredToday > 0
      ? Math.round((correctAnswersToday / questionsAnsweredToday) * 100)
      : 0

  const currentLevel = Math.floor(totalStars / 50) + 1
  const xpInCurrentLevel = totalStars % 50
  const xpForNextLevel = 50

  const nextWorld = WORLDS.find(w => !unlockedWorlds.includes(w.id))
  const nextMilestone = nextWorld?.unlockStars || 1000
  const milestoneReward = nextWorld ? `Unlock ${nextWorld.name}!` : 'Max Level!'

  return (
    <main className="min-h-screen flex flex-col p-4 relative overflow-hidden">
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          onClick={() => router.push('/worlds')}
          className="text-3xl bg-white/80 p-2 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ←
        </motion.button>
        <h1 className="text-3xl font-bold rainbow-text">Hero Stats</h1>
        <div className="w-12" />
      </motion.div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div
            className="game-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-6">
              <div className="relative">
                <CharacterPreview size="large" animate showPet />
                {currentStreak >= 3 && (
                  <motion.div
                    className="absolute -top-2 -right-2 text-3xl"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    🔥
                  </motion.div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {characterName || 'Adventurer'}
                </h2>
                <div className="flex items-center gap-3 mb-4">
                  {currentStreak > 0 && (
                    <motion.div
                      className="flex items-center gap-1 bg-orange-100 px-3 py-1 rounded-full"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="text-xl">🔥</span>
                      <span className="font-bold text-orange-600">
                        {currentStreak} day streak!
                      </span>
                    </motion.div>
                  )}
                  {completedLevels.length > 0 && (
                    <div className="flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full">
                      <span className="text-xl">🏅</span>
                      <span className="font-bold text-purple-600">
                        {completedLevels.length} badges
                      </span>
                    </div>
                  )}
                </div>
                <XPProgressBar
                  currentXP={xpInCurrentLevel}
                  xpForNextLevel={xpForNextLevel}
                  level={currentLevel}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="game-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">⭐</span> Star Collection
            </h3>
            <StarCounter
              totalStars={totalStars}
              nextMilestone={nextMilestone}
              milestoneReward={milestoneReward}
              showSparkle
              size="medium"
            />
          </motion.div>

          <motion.div
            className="game-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span> Skill Level
            </h3>
            <div className="flex justify-center">
              <SkillBadge
                skillLevel={skillLevel}
                progress={skillLevel === 'beginner' ? 50 : skillLevel === 'intermediate' ? 75 : 100}
                size="large"
              />
            </div>
          </motion.div>

          <motion.div
            className="game-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📝</span> Today&apos;s Practice
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-4 text-center shadow-md"
                whileHover={{ scale: 1.02 }}
              >
                <motion.span
                  className="text-4xl block mb-2"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  📝
                </motion.span>
                <p className="text-3xl font-bold text-blue-600">
                  {questionsAnsweredToday}
                </p>
                <p className="text-sm text-gray-600 font-medium">Questions</p>
              </motion.div>
              <motion.div
                className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-4 text-center shadow-md"
                whileHover={{ scale: 1.02 }}
              >
                <motion.span
                  className="text-4xl block mb-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {todayAccuracy >= 80 ? '🌟' : todayAccuracy >= 50 ? '✅' : '💪'}
                </motion.span>
                <p className="text-3xl font-bold text-green-600">
                  {todayAccuracy}%
                </p>
                <p className="text-sm text-gray-600 font-medium">Accuracy</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="game-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🔥</span> Streaks
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl p-4 text-center shadow-md"
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  className="text-4xl mb-2"
                  animate={currentStreak > 0 ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {currentStreak >= 7 ? '🔥🔥🔥' : currentStreak >= 3 ? '🔥🔥' : '🔥'}
                </motion.div>
                <p className="text-3xl font-bold text-orange-600">
                  {currentStreak}
                </p>
                <p className="text-sm text-gray-600 font-medium">Current Streak</p>
              </motion.div>
              <motion.div
                className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-4 text-center shadow-md"
                whileHover={{ scale: 1.02 }}
              >
                <motion.span
                  className="text-4xl block mb-2"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🏆
                </motion.span>
                <p className="text-3xl font-bold text-purple-600">
                  {longestStreak}
                </p>
                <p className="text-sm text-gray-600 font-medium">Best Streak</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="game-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🌍</span> Worlds Explored
            </h3>
            <div className="flex flex-wrap justify-center gap-8 py-4">
              {WORLDS.map((world) => {
                const isUnlocked = unlockedWorlds.includes(world.id)
                const progress = worldProgress[world.id]
                const modulesCompleted = progress?.levelsCompleted.length || 0
                const completionPercent = (modulesCompleted / 6) * 100

                return (
                  <WorldProgressRing
                    key={world.id}
                    worldName={world.name}
                    worldEmoji={world.emoji}
                    completionPercentage={completionPercent}
                    modulesCompleted={modulesCompleted}
                    totalModules={6}
                    isLocked={!isUnlocked}
                    starsEarned={progress?.totalStarsInWorld || 0}
                    primaryColor={world.colors.primary}
                    size="medium"
                  />
                )
              })}
            </div>
          </motion.div>

          <motion.div
            className="game-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🏅</span> Level Badges
            </h3>
            <div className="space-y-3">
              {LEVELS.map((level) => {
                const isComplete = completedLevels.includes(level.id)
                let modulesDone = 0
                for (let m = 1; m <= 3; m++) {
                  if (moduleProgress[`${level.id}-${m}`]?.completed) {
                    modulesDone++
                  }
                }

                return (
                  <motion.div
                    key={level.id}
                    className={`
                      flex items-center gap-4 rounded-2xl p-4 transition-all
                      ${isComplete
                        ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400'
                        : 'bg-gray-50'
                      }
                    `}
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <motion.span
                      className="text-4xl"
                      animate={isComplete ? { rotate: [0, 10, -10, 0] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {level.badgeEmoji}
                    </motion.span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-lg">{level.name}</p>
                      <p className="text-sm text-gray-500">{level.description}</p>
                      <div className="flex gap-2 mt-2">
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className={`h-3 flex-1 rounded-full ${
                              i < modulesDone
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                                : 'bg-gray-200'
                            }`}
                            initial={i < modulesDone ? { scaleX: 0 } : {}}
                            animate={i < modulesDone ? { scaleX: 1 } : {}}
                            transition={{ delay: i * 0.2, duration: 0.5 }}
                            style={{ originX: 0 }}
                          />
                        ))}
                      </div>
                    </div>
                    {isComplete ? (
                      <motion.div
                        className="text-3xl"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        ✅
                      </motion.div>
                    ) : (
                      <div className="text-gray-400 font-bold">
                        {modulesDone}/3
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          <motion.div
            className="game-card bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span> Overall Progress
            </h3>
            <div className="text-center">
              <motion.div
                className="relative inline-block"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <span className="text-7xl">
                  {progressPercentage >= 100
                    ? '🏆'
                    : progressPercentage >= 75
                    ? '🌟'
                    : progressPercentage >= 50
                    ? '⭐'
                    : progressPercentage >= 25
                    ? '🌱'
                    : '🎯'}
                </span>
              </motion.div>
              <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent mt-4">
                {progressPercentage}%
              </p>
              <p className="text-gray-600 mt-2">
                {totalModulesCompleted} of {totalPossibleModules} modules completed
              </p>
              <div className="mt-4 h-4 bg-white/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
              </div>
            </div>
          </motion.div>

          <div className="h-8" />
        </div>
      </div>
    </main>
  )
}
