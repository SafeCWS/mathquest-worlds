'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useCharacterStore, PRIMARY_COLORS, AvatarStyle } from '@/lib/stores/characterStore'
import { PresetAvatar, AvatarSelector } from '@/components/character-creator/PresetAvatars'
import { ColorPicker } from '@/components/character-creator/ColorPicker'
import { ParallaxBackground } from '@/components/backgrounds/ParallaxBackground'
import { SKIN_TONES, HAIR_COLORS } from '@/lib/constants/characterItems'

type TabType = 'avatar' | 'colors' | 'name'

const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: 'avatar', label: 'Character', icon: '🦸' },
  { id: 'colors', label: 'Colors', icon: '🎨' },
  { id: 'name', label: 'Name', icon: '✏️' }
]

export default function CreateCharacterPage() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('avatar')
  const [nameInput, setNameInput] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)

  const {
    avatarStyle,
    primaryColor,
    skinTone,
    hairColor,
    characterName,
    setAvatarStyle,
    setPrimaryColor,
    setSkinTone,
    setHairColor,
    setCharacterName,
    randomizeCharacter,
    saveCharacter
  } = useCharacterStore()

  useEffect(() => {
    setMounted(true)
    if (characterName) {
      setNameInput(characterName)
    }
  }, [characterName])

  if (!mounted) {
    return (
      <div
        role="status"
        aria-label="Loading character creator"
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-400 to-green-400"
      >
        <motion.div
          aria-hidden="true"
          className="text-7xl"
          animate={reduceMotion ? undefined : { rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨
        </motion.div>
      </div>
    )
  }

  const handleSave = () => {
    if (nameInput.trim()) {
      setCharacterName(nameInput.trim())
    } else {
      setCharacterName('Adventurer')
    }
    saveCharacter()
    setShowConfetti(true)
    setTimeout(() => {
      router.push('/worlds')
    }, 1500)
  }

  const handleRandomize = () => {
    randomizeCharacter()
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
              Choose Your Character! ✨
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
              <h3 id="outfit-color-label" className="text-lg font-bold text-center text-gray-700 mb-3">
                🎨 Outfit Color
              </h3>
              <div
                role="radiogroup"
                aria-labelledby="outfit-color-label"
                className="flex flex-wrap justify-center gap-3"
              >
                {PRIMARY_COLORS.map((color) => (
                  <motion.button
                    key={color}
                    type="button"
                    role="radio"
                    aria-checked={primaryColor === color}
                    aria-label={`Outfit color ${color}`}
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
            </div>
          </motion.div>
        )

      case 'name':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 flex flex-col items-center"
          >
            <h3 className="text-xl font-bold text-center text-gray-700">
              What&apos;s Your Name? 🌟
            </h3>

            <div className="w-full max-w-sm">
              <label htmlFor="character-name" className="sr-only">
                Character name
              </label>
              <input
                id="character-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                aria-label="Type your character name"
                className="w-full px-6 py-4 rounded-2xl border-4 border-yellow-300
                           focus:border-yellow-500 focus:outline-none text-center
                           text-2xl font-bold shadow-lg bg-white/90
                           placeholder:text-gray-500"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Quick name suggestions">
              {['Alex', 'Sam', 'Jordan', 'Riley', 'Max', 'Sky'].map((name) => (
                <motion.button
                  key={name}
                  type="button"
                  aria-label={`Use the name ${name}`}
                  className="px-4 py-2 bg-white/90 rounded-full text-gray-700
                             font-medium shadow hover:bg-yellow-100 transition-colors"
                  onClick={() => setNameInput(name)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {name}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )
    }
  }

  return (
    <ParallaxBackground theme="welcome" intensity="medium">
      <main className="min-h-screen flex flex-col p-4 relative">
        {/* Confetti celebration — purely decorative, hidden from assistive tech */}
        <AnimatePresence>
          {showConfetti && !reduceMotion && (
            <div aria-hidden="true">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="fixed text-3xl pointer-events-none z-50"
                  initial={{
                    left: '50%',
                    top: '50%',
                    opacity: 1,
                    scale: 1
                  }}
                  animate={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: 0,
                    scale: 0,
                    rotate: Math.random() * 720
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                >
                  {['⭐', '🌟', '✨', '🎉', '🎊', '💫'][i % 6]}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          className="text-center mb-4 relative z-10"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            Create Your Adventurer! ✨
          </h1>
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
              animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
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

            {/* Character name display */}
            {nameInput && (
              <motion.div
                className="mt-4 px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-400
                           rounded-full shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <span className="text-white font-bold text-lg drop-shadow">
                  {nameInput}
                </span>
              </motion.div>
            )}

            {/* Randomize button */}
            <motion.button
              type="button"
              aria-label="Randomize character"
              className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500
                         text-white rounded-full font-bold shadow-lg
                         flex items-center gap-2"
              onClick={handleRandomize}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, rotate: 10 }}
            >
              <span aria-hidden="true" className="text-xl">🎲</span>
              Randomize!
            </motion.button>
          </motion.div>

          {/* Customization panel */}
          <motion.div
            className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl
                       border-4 border-white/50 flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {/* Tabs */}
            <div role="tablist" aria-label="Character customization tabs" className="flex border-b-2 border-gray-100">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  aria-label={`Open ${tab.label} tab`}
                  className={`flex-1 py-4 px-4 font-bold text-lg flex items-center
                              justify-center gap-2 transition-colors relative
                              ${activeTab === tab.id
                                ? 'text-orange-600 bg-orange-50'
                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={{ scale: 0.98 }}
                >
                  <span aria-hidden="true" className="text-xl">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500"
                      layoutId="activeTab"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Tab content */}
            <div
              role="tabpanel"
              id={`tabpanel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
              className="flex-1 overflow-y-auto p-4"
            >
              {renderTabContent()}
            </div>
          </motion.div>
        </div>

        {/* Bottom actions */}
        <motion.div
          className="flex justify-center gap-4 mt-4 relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Go back to home"
            className="px-6 py-3 bg-white/90 backdrop-blur text-gray-700
                       rounded-full font-bold shadow-lg border-4 border-white/50"
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back
          </motion.button>
          <motion.button
            type="button"
            aria-label="Save character and start adventure"
            className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500
                       text-white rounded-full font-bold text-xl shadow-xl
                       border-4 border-yellow-300"
            onClick={handleSave}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={
              reduceMotion
                ? undefined
                : {
                    boxShadow: [
                      '0 0 20px rgba(255, 215, 0, 0.4)',
                      '0 0 40px rgba(255, 215, 0, 0.6)',
                      '0 0 20px rgba(255, 215, 0, 0.4)',
                    ],
                  }
            }
            transition={{
              boxShadow: { duration: 1.5, repeat: Infinity }
            }}
          >
            ✨ Start Adventure!
          </motion.button>
        </motion.div>
      </main>
    </ParallaxBackground>
  )
}
