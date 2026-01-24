'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useCharacterStore, PRIMARY_COLORS } from '@/lib/stores/characterStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { PresetAvatar, AvatarSelector } from '@/components/character-creator/PresetAvatars'
import { ColorPicker } from '@/components/character-creator/ColorPicker'
import { ParallaxBackground } from '@/components/backgrounds/ParallaxBackground'
import { SKIN_TONES, HAIR_COLORS } from '@/lib/constants/characterItems'

type TabType = 'avatar' | 'colors'

export default function WardrobePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('avatar')

  const {
    hasCreatedCharacter,
    characterName,
    avatarStyle,
    primaryColor,
    skinTone,
    hairColor,
    setAvatarStyle,
    setPrimaryColor,
    setSkinTone,
    setHairColor
  } = useCharacterStore()

  const { totalStars, currentStreak } = useProgressStore()

  useEffect(() => {
    setMounted(true)
    if (!hasCreatedCharacter) {
      router.push('/')
    }
  }, [hasCreatedCharacter, router])

  if (!mounted || !hasCreatedCharacter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-400 to-pink-400">
        <motion.div
          className="text-7xl"
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          👗
        </motion.div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'avatar':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-bold text-center text-gray-700">
              Choose Your Look! 🦸
            </h3>
            <AvatarSelector
              selectedStyle={avatarStyle}
              onSelect={setAvatarStyle}
              skinTone={skinTone}
              primaryColor={primaryColor}
            />
          </motion.div>
        )

      case 'colors':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-bold text-center text-gray-700 mb-3">
                🎨 Outfit Color
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {PRIMARY_COLORS.map((color) => (
                  <motion.button
                    key={color}
                    className={`w-12 h-12 rounded-full border-4 shadow-lg ${
                      primaryColor === color ? 'border-yellow-400 scale-110' : 'border-white/50'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setPrimaryColor(color)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-center text-gray-700 mb-3">
                👤 Skin Tone
              </h3>
              <ColorPicker
                colors={SKIN_TONES}
                selectedColor={skinTone}
                onSelect={setSkinTone}
                size="large"
              />
            </div>

            <div>
              <h3 className="text-lg font-bold text-center text-gray-700 mb-3">
                💇 Hair Color
              </h3>
              <ColorPicker
                colors={HAIR_COLORS.filter(h => h.unlockType === 'free').map(h => h.color)}
                selectedColor={hairColor}
                onSelect={setHairColor}
                size="medium"
              />
              {/* Show locked fantasy colors */}
              <div className="mt-4">
                <p className="text-center text-sm text-gray-500 mb-2">
                  ✨ Fantasy Colors (Unlock with ⭐)
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {HAIR_COLORS.filter(h => h.unlockType === 'stars').map((h) => {
                    const isUnlocked = totalStars >= (h.unlockValue as number)
                    return (
                      <motion.button
                        key={h.color}
                        className={`w-10 h-10 rounded-full border-3 shadow relative ${
                          hairColor === h.color ? 'border-yellow-400' : 'border-white/50'
                        } ${!isUnlocked ? 'opacity-50' : ''}`}
                        style={{ backgroundColor: h.color }}
                        onClick={() => isUnlocked && setHairColor(h.color)}
                        whileHover={isUnlocked ? { scale: 1.1 } : {}}
                        whileTap={isUnlocked ? { scale: 0.95 } : {}}
                        disabled={!isUnlocked}
                      >
                        {!isUnlocked && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs">
                            🔒
                          </span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )
    }
  }

  return (
    <ParallaxBackground theme="fairy" intensity="subtle">
      <main className="min-h-screen flex flex-col p-4 relative">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-4 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            onClick={() => router.push('/worlds')}
            className="text-2xl bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg font-bold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back
          </motion.button>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            ✨ Wardrobe ✨
          </h1>
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-lg">
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⭐
            </motion.span>
            <span className="font-bold text-yellow-600">{totalStars}</span>
          </div>
        </motion.div>

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto w-full relative z-10">
          {/* Preview panel */}
          <motion.div
            className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl
                       border-4 border-white/50 flex flex-col items-center justify-center
                       lg:w-1/3"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Large avatar preview */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <PresetAvatar
                style={avatarStyle}
                emotion="happy"
                skinTone={skinTone}
                hairColor={hairColor}
                primaryColor={primaryColor}
                size={220}
                animate={true}
              />
            </motion.div>

            {/* Character name */}
            <motion.div
              className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-400 to-pink-400
                         rounded-full shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <span className="text-white font-bold text-lg drop-shadow">
                {characterName || 'Adventurer'}
              </span>
            </motion.div>

            {/* Stats */}
            <div className="mt-4 flex gap-3">
              <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                <span>⭐</span>
                <span className="font-bold text-yellow-700">{totalStars}</span>
              </div>
              {currentStreak > 0 && (
                <div className="flex items-center gap-1 bg-orange-100 px-3 py-1 rounded-full">
                  <span>🔥</span>
                  <span className="font-bold text-orange-700">{currentStreak}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Customization panel */}
          <motion.div
            className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl
                       border-4 border-white/50 flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Tabs */}
            <div className="flex border-b-2 border-gray-100">
              <motion.button
                className={`flex-1 py-4 px-4 font-bold text-lg flex items-center
                            justify-center gap-2 transition-colors relative
                            ${activeTab === 'avatar'
                              ? 'text-purple-500 bg-purple-50'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                onClick={() => setActiveTab('avatar')}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xl">🦸</span>
                <span>Character</span>
                {activeTab === 'avatar' && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"
                    layoutId="wardrobeTab"
                  />
                )}
              </motion.button>
              <motion.button
                className={`flex-1 py-4 px-4 font-bold text-lg flex items-center
                            justify-center gap-2 transition-colors relative
                            ${activeTab === 'colors'
                              ? 'text-purple-500 bg-purple-50'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                onClick={() => setActiveTab('colors')}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xl">🎨</span>
                <span>Colors</span>
                {activeTab === 'colors' && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"
                    layoutId="wardrobeTab"
                  />
                )}
              </motion.button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {renderTabContent()}
            </div>
          </motion.div>
        </div>
      </main>
    </ParallaxBackground>
  )
}
