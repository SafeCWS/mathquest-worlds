'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDailyBonusStore } from '@/lib/stores/dailyBonusStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { useCharacterStore } from '@/lib/stores/characterStore'
import { PresetAvatar } from '@/components/character-creator/PresetAvatars'
import { sounds } from '@/lib/sounds/webAudioSounds'

interface DailyBonusOverlayProps {
  onClose?: () => void
  autoShow?: boolean
}

export function DailyBonusOverlay({ onClose, autoShow = true }: DailyBonusOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [bonusInfo, setBonusInfo] = useState<{ bonusStars: number; consecutiveDays: number } | null>(null)
  const [showStarAnimation, setShowStarAnimation] = useState(false)

  const { checkDailyBonus, claimDailyBonus } = useDailyBonusStore()
  const { addStars } = useProgressStore()
  const { avatarStyle, skinTone, hairColor, primaryColor, characterName } = useCharacterStore()

  useEffect(() => {
    if (autoShow) {
      const result = checkDailyBonus()
      if (result.isNewDay) {
        setBonusInfo({ bonusStars: result.bonusStars, consecutiveDays: result.consecutiveDays })
        // Small delay for better UX
        setTimeout(() => setIsVisible(true), 500)
      }
    }
  }, [autoShow, checkDailyBonus])

  const handleClaim = () => {
    if (!bonusInfo) return

    // Claim the bonus
    const stars = claimDailyBonus()
    addStars(stars)

    // Play daily bonus sound
    sounds.playDailyBonus()

    // Show star animation
    setShowStarAnimation(true)

    // Close after animation
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 2000)
  }

  if (!isVisible || !bonusInfo) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Celebration background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                y: [0, -100]
              }}
              transition={{
                duration: 2,
                delay: Math.random() * 1,
                repeat: Infinity,
                repeatDelay: Math.random() * 2
              }}
            >
              {['⭐', '🌟', '✨', '💫'][i % 4]}
            </motion.div>
          ))}
        </div>

        {/* Main card */}
        <motion.div
          className="bg-gradient-to-b from-yellow-100 to-orange-100 rounded-3xl p-8 shadow-2xl
                     border-4 border-yellow-400 max-w-md w-full mx-4 relative overflow-hidden"
          initial={{ scale: 0.5, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.5, y: 50, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          {/* Decorative sun rays */}
          <motion.div
            className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-60 h-60"
            style={{
              background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)'
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />

          {/* Welcome text */}
          <motion.div
            className="text-center mb-6 relative z-10"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-orange-600 mb-2">
              Welcome Back!
            </h2>
            <p className="text-xl text-orange-500">
              {characterName ? `Great to see you, ${characterName}!` : 'Great to see you!'}
            </p>
          </motion.div>

          {/* Avatar celebration */}
          <motion.div
            className="flex justify-center mb-6 relative"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <PresetAvatar
                style={avatarStyle}
                emotion="celebrating"
                skinTone={skinTone}
                hairColor={hairColor}
                primaryColor={primaryColor}
                size={140}
                animate={true}
              />
            </motion.div>

            {/* Sparkles around avatar */}
            {[...Array(6)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-2xl"
                style={{
                  left: `${40 + Math.cos(i * Math.PI / 3) * 35}%`,
                  top: `${50 + Math.sin(i * Math.PI / 3) * 35}%`
                }}
                animate={{
                  scale: [0, 1.2, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.15,
                  repeat: Infinity
                }}
              >
                ✨
              </motion.span>
            ))}
          </motion.div>

          {/* Consecutive days badge */}
          {bonusInfo.consecutiveDays > 1 && (
            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
            >
              <div className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-red-400
                              px-4 py-2 rounded-full shadow-lg">
                <motion.span
                  className="text-2xl"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  🔥
                </motion.span>
                <span className="font-bold text-white text-lg">
                  {bonusInfo.consecutiveDays} Day Streak!
                </span>
              </div>
            </motion.div>
          )}

          {/* Bonus stars display */}
          <motion.div
            className="text-center mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <p className="text-lg text-gray-600 mb-2">Daily Bonus</p>
            <div className="flex justify-center items-center gap-2">
              <motion.span
                className="text-5xl font-bold text-yellow-500"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                +{bonusInfo.bonusStars}
              </motion.span>
              <motion.span
                className="text-4xl"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ⭐
              </motion.span>
            </div>
            {bonusInfo.bonusStars > 1 && (
              <p className="text-sm text-orange-500 mt-1">
                Streak bonus active!
              </p>
            )}
          </motion.div>

          {/* Star animation overlay */}
          <AnimatePresence>
            {showStarAnimation && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[...Array(bonusInfo.bonusStars)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-6xl"
                    initial={{ scale: 2, opacity: 1 }}
                    animate={{
                      scale: [2, 0.5],
                      opacity: [1, 0],
                      y: [-50, -200],
                      x: [(i - Math.floor(bonusInfo.bonusStars / 2)) * 30, (i - Math.floor(bonusInfo.bonusStars / 2)) * 60]
                    }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                  >
                    ⭐
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Claim button */}
          <motion.button
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500
                       text-white font-bold text-2xl rounded-2xl shadow-xl
                       border-4 border-yellow-300"
            onClick={handleClaim}
            disabled={showStarAnimation}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {showStarAnimation ? (
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3, repeat: Infinity }}
              >
                Claimed! 🎉
              </motion.span>
            ) : (
              'Collect Bonus! 🎁'
            )}
          </motion.button>

          {/* Tip for streaks */}
          <motion.p
            className="text-center text-sm text-gray-500 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            💡 Play every day for bigger bonuses!
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Small indicator for home screen
export function DailyBonusIndicator({ onClick }: { onClick?: () => void }) {
  const { isDailyBonusAvailable, getConsecutiveDays } = useDailyBonusStore()
  const [available, setAvailable] = useState(false)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    setAvailable(isDailyBonusAvailable())
    setStreak(getConsecutiveDays())
  }, [isDailyBonusAvailable, getConsecutiveDays])

  if (!available) return null

  return (
    <motion.button
      className="fixed top-4 right-4 z-40 bg-gradient-to-r from-yellow-400 to-orange-500
                 rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
      onClick={onClick}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.span
        className="text-2xl"
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        🎁
      </motion.span>
      <span className="font-bold text-white text-sm">Daily Bonus!</span>
      {streak > 1 && (
        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
          🔥 {streak}
        </span>
      )}
    </motion.button>
  )
}

export default DailyBonusOverlay
