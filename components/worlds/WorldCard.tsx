'use client'

import { motion } from 'motion/react'
import type { World } from '@/lib/constants/worlds'

interface WorldCardProps {
  world: World
  isUnlocked: boolean
  isActive: boolean
  totalStars: number
  onClick: () => void
  progress?: {
    levelsCompleted: number[]
    totalStarsInWorld: number
  }
}

export function WorldCard({
  world,
  isUnlocked,
  isActive,
  totalStars,
  onClick,
  progress
}: WorldCardProps) {
  const starsNeeded = world.unlockStars - totalStars

  return (
    <motion.button
      className={`
        relative w-full aspect-[4/5] rounded-3xl overflow-hidden
        transition-all duration-300 transform
        ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'}
        ${isActive ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}
      `}
      style={{
        background: isUnlocked ? world.colors.background : 'linear-gradient(180deg, #9CA3AF 0%, #6B7280 100%)'
      }}
      onClick={isUnlocked ? onClick : undefined}
      whileHover={isUnlocked ? { scale: 1.02, y: -5 } : {}}
      whileTap={isUnlocked ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* World content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        {/* World emoji */}
        <motion.span
          className="text-6xl md:text-7xl mb-2"
          animate={
            isUnlocked
              ? {
                  y: [0, -8, 0],
                  rotate: [-5, 5, -5]
                }
              : {}
          }
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {isUnlocked ? world.emoji : '🔒'}
        </motion.span>

        {/* World name */}
        <h3
          className={`text-xl md:text-2xl font-bold text-center mb-1 drop-shadow-lg ${
            isUnlocked ? 'text-white' : 'text-gray-300'
          }`}
        >
          {world.name}
        </h3>

        {/* World description or unlock requirement */}
        {isUnlocked ? (
          <p className="text-sm text-white/80 text-center">
            {world.description}
          </p>
        ) : (
          <div className="flex items-center gap-1 mt-2 bg-black/30 px-3 py-1 rounded-full">
            <span className="text-lg">⭐</span>
            <span className="text-white font-medium">
              {starsNeeded > 0 ? `${starsNeeded} more` : 'Unlock now!'}
            </span>
          </div>
        )}

        {/* Progress indicator for unlocked worlds */}
        {isUnlocked && progress && (
          <div className="mt-3 flex items-center gap-2">
            {/* Level progress */}
            <div className="flex gap-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < progress.levelsCompleted.length
                      ? 'bg-yellow-400'
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            {/* Stars earned */}
            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
              <span className="text-sm">⭐</span>
              <span className="text-white text-sm font-medium">
                {progress.totalStarsInWorld}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Decorative elements for unlocked worlds */}
      {isUnlocked && (
        <>
          {/* Floating objects */}
          {world.countingObjects.slice(0, 3).map((obj, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${10 + i * 30}%`,
                top: `${10 + (i % 2) * 10}%`
              }}
              animate={{
                y: [0, -10, 0],
                rotate: [-10, 10, -10]
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.3
              }}
            >
              {obj}
            </motion.span>
          ))}

          {/* Sparkles */}
          {[...Array(3)].map((_, i) => (
            <motion.span
              key={`sparkle-${i}`}
              className="absolute text-lg"
              style={{
                right: `${10 + i * 20}%`,
                bottom: `${15 + i * 10}%`
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.4
              }}
            >
              ✨
            </motion.span>
          ))}
        </>
      )}

      {/* Lock overlay for locked worlds */}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
          >
            <span className="text-6xl">🔒</span>
          </motion.div>
        </div>
      )}

      {/* Completed badge */}
      {isUnlocked && progress && progress.levelsCompleted.length >= 6 && (
        <motion.div
          className="absolute top-2 right-2 bg-yellow-400 rounded-full p-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <span className="text-2xl">🏆</span>
        </motion.div>
      )}
    </motion.button>
  )
}
