'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
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
  const {
    totalStars,
    moduleProgress,
    pipsForLevel,
    isLevelGateUnlocked,
  } = useProgressStore()
  const { worldProgress, setCurrentWorld } = useWorldStore()
  // Lock-tap toast state — when kid taps a gate-locked level, we head-shake
  // the node and show a brief toast pointing to the previous level. No
  // dialog, no error, no scolding — just an encouraging "almost there".
  const [lockToast, setLockToast] = useState<string | null>(null)

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
    // Two gates compose: the legacy star-based unlock (cross-world progress)
    // AND the Phase 4.1 per-level "play 3 games" gate. Both must pass.
    const starsOk = isLevelUnlocked(levelId, totalStars)
    const gateOk = isLevelGateUnlocked(levelId)

    if (starsOk && gateOk) {
      router.push(`/worlds/${worldId}/${levelId}/1`)
      return
    }

    // Locked. Pick the most encouraging message we can — gate-locked is
    // more actionable ("3 more games on level X") than star-locked.
    const idx = LEVELS.findIndex((l) => l.id === levelId)
    const prevLevel = idx > 0 ? LEVELS[idx - 1] : null
    if (!gateOk && prevLevel) {
      const remaining = Math.max(0, 3 - pipsForLevel(prevLevel.id))
      const games = remaining === 1 ? 'game' : 'games'
      setLockToast(`Almost there! Just ${remaining} more ${games} on Level ${prevLevel.id}.`)
    } else if (!starsOk) {
      const level = LEVELS.find((l) => l.id === levelId)
      setLockToast(level
        ? `Earn ${level.unlockStars - totalStars} more stars to unlock!`
        : 'Keep playing to unlock!')
    }
    // Auto-clear so we don't pin a stale toast across taps.
    setTimeout(() => setLockToast(null), 2200)
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
              // Phase 4.1 — node visual derives from BOTH gates. A level is
              // visually unlocked only if star-progress AND game-count gate
              // both clear. Tapping a locked node head-shakes (see
              // `whileTap` below) and triggers the toast in handleLevelSelect.
              const starsOk = isLevelUnlocked(level.id, totalStars)
              const gateOk = isLevelGateUnlocked(level.id)
              const isUnlocked = starsOk && gateOk
              const pips = pipsForLevel(level.id)
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
                        : 'bg-gray-400 cursor-pointer'
                    }
                    ${progress.isComplete ? 'ring-4 ring-green-400' : ''}
                  `}
                  style={{
                    left: `${xPos}%`,
                    top: `${(yPos / 600) * 100}%`
                  }}
                  aria-disabled={!isUnlocked}
                  onClick={() => handleLevelSelect(level.id)}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.15 + 0.3 }}
                  whileHover={isUnlocked ? { scale: 1.1 } : {}}
                  // Locked tap: 3-cycle horizontal head-shake at 5px (Toca
                  // Boca-style "you can't do that, but I'm not mad about
                  // it"). 200ms total — fast enough not to feel punitive.
                  whileTap={
                    isUnlocked
                      ? { scale: 0.95 }
                      : { x: [0, -5, 5, -5, 5, 0], transition: { duration: 0.2 } }
                  }
                >
                  {isUnlocked ? (
                    <>
                      <span className="text-3xl">{level.badgeEmoji}</span>
                      <span className="text-xs font-bold text-gray-800 mt-1">
                        Level {level.id}
                      </span>
                      {/* Phase 4.1 pip counter — three stars that fill as
                          the kid completes successful rounds on this level.
                          Filled = bright yellow, empty = dim gray. */}
                      <div className="flex gap-0.5 mt-1" aria-label={`${pips} of 3 games complete`}>
                        {[...Array(3)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${
                              i < pips ? 'text-yellow-600' : 'text-gray-400'
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

      {/* Phase 4.1 — Lock-tap toast. Pinned bottom-center, auto-clears after
          2.2s (set by handleLevelSelect). Encouraging copy only — no error
          framing, no red, no "denied" language. Same Toca Boca rule we
          applied to the Phase 2 menu tile lock affordance. */}
      <AnimatePresence>
        {lockToast && (
          <motion.div
            role="status"
            aria-live="polite"
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50
                       bg-white/95 backdrop-blur-sm shadow-xl
                       rounded-full px-6 py-3 max-w-[90vw]
                       text-base font-medium text-gray-800"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <span aria-hidden="true" className="mr-2">🌟</span>
            {lockToast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
