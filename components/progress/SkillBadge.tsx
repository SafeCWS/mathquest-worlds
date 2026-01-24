'use client'

import { motion } from 'motion/react'
import { useState, useEffect } from 'react'

type SkillTier = 'beginner' | 'intermediate' | 'advanced'

interface SkillBadgeProps {
  skillLevel: SkillTier
  progress?: number
  showUnlockAnimation?: boolean
  size?: 'small' | 'medium' | 'large'
}

const tierConfig = {
  beginner: {
    emoji: '🌱',
    label: 'Beginner',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-400',
    glowColor: 'rgba(74, 222, 128, 0.6)',
    nextTier: 'intermediate' as SkillTier,
    description: 'Just getting started!'
  },
  intermediate: {
    emoji: '⭐',
    label: 'Intermediate',
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-400',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    nextTier: 'advanced' as SkillTier,
    description: 'Great progress!'
  },
  advanced: {
    emoji: '🏆',
    label: 'Advanced',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-400',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    nextTier: null,
    description: 'Math Master!'
  }
}

export function SkillBadge({
  skillLevel,
  progress = 0,
  showUnlockAnimation = false,
  size = 'medium'
}: SkillBadgeProps) {
  const [isUnlocking, setIsUnlocking] = useState(showUnlockAnimation)
  const config = tierConfig[skillLevel]

  useEffect(() => {
    if (showUnlockAnimation) {
      setIsUnlocking(true)
      const timer = setTimeout(() => setIsUnlocking(false), 2500)
      return () => clearTimeout(timer)
    }
  }, [showUnlockAnimation])

  const sizeClasses = {
    small: { container: 'w-20 h-24', emoji: 'text-3xl', label: 'text-xs', progress: 'h-1' },
    medium: { container: 'w-32 h-36', emoji: 'text-5xl', label: 'text-sm', progress: 'h-2' },
    large: { container: 'w-44 h-52', emoji: 'text-7xl', label: 'text-base', progress: 'h-3' }
  }

  const sizeConfig = sizeClasses[size]

  return (
    <div className={`relative ${sizeConfig.container}`}>
      <motion.div
        className={`
          relative ${sizeConfig.container} rounded-2xl
          ${config.bgColor} ${config.borderColor} border-4
          flex flex-col items-center justify-center
          shadow-lg overflow-hidden
        `}
        initial={isUnlocking ? { scale: 0, rotate: -180 } : { scale: 1 }}
        animate={isUnlocking
          ? { scale: [0, 1.2, 1], rotate: [180, 360, 360] }
          : { scale: 1 }
        }
        transition={isUnlocking
          ? { duration: 0.8, type: 'spring', stiffness: 200 }
          : {}
        }
        style={{
          boxShadow: isUnlocking ? `0 0 30px ${config.glowColor}` : undefined
        }}
      >
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 30% 30%, white 0%, transparent 60%)`
          }}
        />
        <motion.span
          className={sizeConfig.emoji}
          animate={isUnlocking
            ? { scale: [1, 1.5, 1], rotate: [0, 360] }
            : { y: [0, -3, 0] }
          }
          transition={isUnlocking
            ? { duration: 0.6, delay: 0.3 }
            : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          {config.emoji}
        </motion.span>
        <motion.div
          className={`
            mt-2 px-3 py-1 rounded-full font-bold ${sizeConfig.label}
            bg-gradient-to-r ${config.color} text-white shadow-md
          `}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {config.label}
        </motion.div>
        {config.nextTier && (
          <div className={`mt-2 w-4/5 ${config.bgColor} rounded-full overflow-hidden`}>
            <div className={`${sizeConfig.progress} bg-gray-300 rounded-full overflow-hidden`}>
              <motion.div
                className={`h-full bg-gradient-to-r ${config.color} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        )}
        <p className={`mt-1 ${sizeConfig.label} text-gray-600 text-center px-2`}>
          {config.description}
        </p>
      </motion.div>
      {isUnlocking && (
        <motion.div className="absolute inset-0 pointer-events-none">
          {[...Array(16)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-xl"
              style={{
                left: '50%',
                top: '50%'
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((i * Math.PI * 2) / 16) * 80,
                y: Math.sin((i * Math.PI * 2) / 16) * 80,
                opacity: 0,
                scale: 0
              }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            >
              {['✨', '⭐', '🌟', '💫'][i % 4]}
            </motion.span>
          ))}
        </motion.div>
      )}
      {skillLevel === 'advanced' && (
        <motion.div
          className="absolute -top-2 -right-2"
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-2xl">👑</span>
        </motion.div>
      )}
    </div>
  )
}
