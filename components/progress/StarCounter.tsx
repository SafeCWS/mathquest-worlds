'use client'

import { motion, useSpring, useTransform, AnimatePresence } from 'motion/react'
import { useEffect, useState, useRef } from 'react'

interface StarCounterProps {
  totalStars: number
  nextMilestone?: number
  milestoneReward?: string
  showSparkle?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function StarCounter({
  totalStars,
  nextMilestone = 100,
  milestoneReward = 'New World!',
  showSparkle = false,
  size = 'medium'
}: StarCounterProps) {
  const [prevStars, setPrevStars] = useState(totalStars)
  const [showNewStar, setShowNewStar] = useState(false)
  const [sparklePositions, setSparklePositions] = useState<{ x: number; y: number }[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const springStars = useSpring(totalStars, { stiffness: 100, damping: 20 })
  const displayStars = useTransform(springStars, (v) => Math.round(v))

  useEffect(() => {
    springStars.set(totalStars)
    if (totalStars > prevStars) {
      setShowNewStar(true)
      const newSparkles = Array.from({ length: 8 }, () => ({
        x: Math.random() * 60 - 30,
        y: Math.random() * 60 - 30
      }))
      setSparklePositions(newSparkles)
      const timer = setTimeout(() => setShowNewStar(false), 1000)
      return () => clearTimeout(timer)
    }
    setPrevStars(totalStars)
  }, [totalStars, prevStars, springStars])

  const starsToMilestone = Math.max(0, nextMilestone - totalStars)
  const milestoneProgress = Math.min((totalStars / nextMilestone) * 100, 100)

  const sizeConfig = {
    small: {
      container: 'p-3',
      star: 'text-3xl',
      number: 'text-2xl',
      milestone: 'text-xs',
      progressHeight: 'h-2'
    },
    medium: {
      container: 'p-4',
      star: 'text-5xl',
      number: 'text-4xl',
      milestone: 'text-sm',
      progressHeight: 'h-3'
    },
    large: {
      container: 'p-6',
      star: 'text-7xl',
      number: 'text-6xl',
      milestone: 'text-base',
      progressHeight: 'h-4'
    }
  }

  const config = sizeConfig[size]

  return (
    <div
      ref={containerRef}
      className={`relative bg-gradient-to-br from-yellow-100 via-orange-100 to-yellow-100 rounded-3xl ${config.container} shadow-lg border-4 border-yellow-300`}
    >
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-50"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 60%)'
        }}
      />
      <div className="relative flex items-center gap-4">
        <motion.div
          className="relative"
          animate={showNewStar ? { scale: [1, 1.3, 1], rotate: [0, 20, -20, 0] } : { y: [0, -3, 0] }}
          transition={showNewStar ? { duration: 0.5 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className={config.star}>⭐</span>
          {showSparkle && (
            <>
              {[...Array(4)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-lg"
                  style={{
                    top: `${20 + Math.sin(i * Math.PI / 2) * 30}%`,
                    left: `${20 + Math.cos(i * Math.PI / 2) * 30}%`
                  }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                >
                  ✨
                </motion.span>
              ))}
            </>
          )}
        </motion.div>
        <div className="flex flex-col">
          <motion.span
            className={`${config.number} font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent`}
          >
            <motion.span>{displayStars}</motion.span>
          </motion.span>
          <span className={`${config.milestone} text-yellow-700 font-medium`}>Total Stars</span>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <span className={`${config.milestone} text-gray-600`}>Next: {milestoneReward}</span>
          <span className={`${config.milestone} text-yellow-600 font-bold`}>{starsToMilestone} to go!</span>
        </div>
        <div className={`relative ${config.progressHeight} bg-yellow-200 rounded-full overflow-hidden`}>
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${milestoneProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              backgroundSize: '200% 100%'
            }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className={`${config.milestone} text-gray-500`}>{totalStars}</span>
          <span className={`${config.milestone} text-gray-500`}>{nextMilestone}</span>
        </div>
      </div>
      <AnimatePresence>
        {showNewStar && (
          <>
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl pointer-events-none"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              +1 ⭐
            </motion.div>
            {sparklePositions.map((pos, i) => (
              <motion.span
                key={i}
                className="absolute pointer-events-none text-xl"
                style={{ top: '50%', left: '50%' }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: pos.x,
                  y: pos.y,
                  opacity: 0,
                  scale: 0,
                  rotate: Math.random() * 360
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {['✨', '⭐', '💫', '🌟'][i % 4]}
              </motion.span>
            ))}
          </>
        )}
      </AnimatePresence>
      {milestoneProgress >= 100 && (
        <motion.div
          className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-2 shadow-lg"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="text-2xl">🎉</span>
        </motion.div>
      )}
    </div>
  )
}
