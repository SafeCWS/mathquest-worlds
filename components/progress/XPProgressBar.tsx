'use client'

import { motion, useSpring, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'

interface XPProgressBarProps {
  currentXP: number
  xpForNextLevel: number
  level: number
  onLevelUp?: () => void
}

export function XPProgressBar({
  currentXP,
  xpForNextLevel,
  level,
  onLevelUp
}: XPProgressBarProps) {
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [prevLevel, setPrevLevel] = useState(level)

  const progress = currentXP / xpForNextLevel
  const springProgress = useSpring(0, { stiffness: 50, damping: 15 })
  const progressWidth = useTransform(springProgress, (v) => `${v * 100}%`)

  useEffect(() => {
    springProgress.set(progress)
  }, [progress, springProgress])

  useEffect(() => {
    if (level > prevLevel) {
      setShowLevelUp(true)
      onLevelUp?.()
      const timer = setTimeout(() => setShowLevelUp(false), 2000)
      return () => clearTimeout(timer)
    }
    setPrevLevel(level)
  }, [level, prevLevel, onLevelUp])

  const glowIntensity = Math.min(progress * 1.5, 1)

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between mb-2">
        <motion.div className="flex items-center gap-2" animate={showLevelUp ? { scale: [1, 1.2, 1] } : {}}>
          <span className="text-3xl">{level >= 10 ? '👑' : level >= 5 ? '🌟' : '💫'}</span>
          <span className="text-xl font-bold text-purple-700">Level {level}</span>
        </motion.div>
        <div className="text-lg font-bold text-purple-600">
          <motion.span key={currentXP} initial={{ scale: 1.3, color: '#FFD700' }} animate={{ scale: 1, color: '#7C3AED' }} transition={{ duration: 0.3 }}>{currentXP}</motion.span>
          <span className="text-gray-500"> / {xpForNextLevel}</span>
        </div>
      </div>
      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden border-4 border-purple-300 shadow-inner">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 20px)' }} />
        <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ width: progressWidth, background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 50%, #F59E0B 100%)', boxShadow: glowIntensity > 0.5 ? `0 0 ${20 * glowIntensity}px rgba(236, 72, 153, ${glowIntensity})` : 'none' }}>
          <motion.div className="absolute inset-0 rounded-full opacity-50" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)' }} />
          <motion.div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', backgroundSize: '200% 100%' }} animate={{ backgroundPosition: ['200% 0', '-200% 0'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
        </motion.div>
        {progress > 0.1 && [...Array(3)].map((_, i) => (<motion.span key={i} className="absolute text-lg pointer-events-none" style={{ left: `${Math.min(progress * 100 - 5, 90)}%`, top: '50%' }} animate={{ y: [-10, -25, -10], x: [0, (i - 1) * 10, 0], opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}>{['✨', '💫', '⭐'][i]}</motion.span>))}
      </div>
      {showLevelUp && (<motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-white px-6 py-3 rounded-full font-bold text-2xl shadow-2xl" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }}>LEVEL UP! 🎉</motion.div>{[...Array(12)].map((_, i) => (<motion.span key={i} className="absolute text-2xl" initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos((i * Math.PI * 2) / 12) * 100, y: Math.sin((i * Math.PI * 2) / 12) * 100, opacity: 0, scale: 0 }} transition={{ duration: 1, ease: 'easeOut' }}>{['🌟', '⭐', '✨', '💫', '🎊', '🎉'][i % 6]}</motion.span>))}</motion.div>)}
      <motion.p className="text-center text-sm text-purple-500 mt-2 font-medium" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>{xpForNextLevel - currentXP} XP to Level {level + 1}! 💪</motion.p>
    </div>
  )
}
