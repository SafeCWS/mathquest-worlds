'use client'

import { motion, useSpring, useTransform } from 'motion/react'
import { useEffect } from 'react'

interface WorldProgressRingProps {
  worldName: string
  worldEmoji: string
  completionPercentage: number
  modulesCompleted: number
  totalModules: number
  isLocked?: boolean
  starsEarned?: number
  primaryColor?: string
  size?: 'small' | 'medium' | 'large'
}

export function WorldProgressRing({
  worldName,
  worldEmoji,
  completionPercentage,
  modulesCompleted,
  totalModules,
  isLocked = false,
  starsEarned = 0,
  primaryColor = '#8B5CF6',
  size = 'medium'
}: WorldProgressRingProps) {
  const springProgress = useSpring(0, { stiffness: 30, damping: 15 })

  useEffect(() => {
    if (!isLocked) {
      springProgress.set(completionPercentage / 100)
    }
  }, [completionPercentage, isLocked, springProgress])

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = useTransform(
    springProgress,
    (v) => circumference * (1 - v)
  )

  const sizeConfig = {
    small: { container: 'w-24 h-24', ring: 80, emoji: 'text-2xl', text: 'text-xs', strokeWidth: 6 },
    medium: { container: 'w-36 h-36', ring: 120, emoji: 'text-4xl', text: 'text-sm', strokeWidth: 8 },
    large: { container: 'w-48 h-48', ring: 160, emoji: 'text-6xl', text: 'text-base', strokeWidth: 10 }
  }

  const config = sizeConfig[size]

  return (
    <motion.div
      className={`relative ${config.container} flex items-center justify-center`}
      whileHover={!isLocked ? { scale: 1.05 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
    >
      <svg
        width={config.ring}
        height={config.ring}
        viewBox="0 0 100 100"
        className="absolute transform -rotate-90"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={isLocked ? '#D1D5DB' : '#E5E7EB'}
          strokeWidth={config.strokeWidth}
          fill="none"
        />
        {!isLocked && (
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke={primaryColor}
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
          />
        )}
        {!isLocked && completionPercentage > 0 && (
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#shimmer)"
            strokeWidth={config.strokeWidth - 2}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            opacity={0.4}
          />
        )}
        <defs>
          <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
            <animate
              attributeName="x1"
              values="-100%;100%"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="x2"
              values="0%;200%"
              dur="2s"
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span
          className={config.emoji}
          animate={isLocked ? {} : { y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {isLocked ? '🔒' : worldEmoji}
        </motion.span>
        {!isLocked && (
          <span className={`${config.text} font-bold text-gray-700 mt-1`}>
            {Math.round(completionPercentage)}%
          </span>
        )}
      </div>
      {!isLocked && (
        <div className="absolute -bottom-2 flex gap-0.5">
          {[...Array(totalModules)].map((_, i) => (
            <motion.div
              key={i}
              className={`
                w-3 h-3 rounded-full
                ${i < modulesCompleted ? 'bg-yellow-400' : 'bg-gray-300'}
              `}
              initial={i < modulesCompleted ? { scale: 0 } : {}}
              animate={i < modulesCompleted ? { scale: 1 } : {}}
              transition={{ delay: i * 0.1, type: 'spring' }}
            >
              {i < modulesCompleted && (
                <motion.span
                  className="block w-full h-full flex items-center justify-center text-[8px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                >
                  ⭐
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      )}
      <motion.p
        className={`absolute -bottom-8 ${config.text} font-medium text-gray-700 whitespace-nowrap`}
      >
        {worldName}
      </motion.p>
      {!isLocked && starsEarned > 0 && (
        <motion.div
          className="absolute -top-2 -right-2 bg-yellow-400 rounded-full px-2 py-0.5 flex items-center gap-0.5 shadow-md"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <span className="text-xs">⭐</span>
          <span className="text-xs font-bold">{starsEarned}</span>
        </motion.div>
      )}
      {completionPercentage >= 100 && (
        <motion.div
          className="absolute -top-3 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-2xl">🏆</span>
        </motion.div>
      )}
    </motion.div>
  )
}
