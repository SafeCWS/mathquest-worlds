'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useGamePreferencesStore, MathOperation, GameStyle } from '@/lib/stores/gamePreferencesStore'
import { useCharacterStore } from '@/lib/stores/characterStore'
import { PresetAvatar } from '@/components/character-creator/PresetAvatars'
import { ParallaxBackground } from '@/components/backgrounds/ParallaxBackground'
import { LanguageToggle } from '@/components/LanguageToggle'

// Guide character IDs map to translation keys for both name and voice.
// IDs are stable (used for random selection); display strings come from
// `i18n/messages/*.json` so they translate with the locale.
type GuideId = 'owl' | 'fox' | 'panda'
const GUIDE_CHARACTERS: { id: GuideId; emoji: string }[] = [
  { id: 'owl', emoji: '🦉' },
  { id: 'fox', emoji: '🦊' },
  { id: 'panda', emoji: '🐼' }
]

// OPERATIONS / GAME_STYLES keep their stable IDs (state keys, store
// values). Display strings (`name`, `description`) are pulled by ID at
// render time via t(`operations.${id}`) etc.
const OPERATIONS: {
  id: MathOperation
  emoji: string
  color: string
  example: string
}[] = [
  { id: 'counting', emoji: '🔢', color: 'from-blue-400 to-blue-600', example: '🐱🐱🐱 = 3' },
  { id: 'addition', emoji: '➕', color: 'from-green-400 to-green-600', example: '2 + 3 = 5' },
  { id: 'subtraction', emoji: '➖', color: 'from-orange-400 to-red-500', example: '5 - 2 = 3' }
]

const GAME_STYLES: { id: GameStyle; emoji: string }[] = [
  { id: 'tap', emoji: '👆' },
  { id: 'drag', emoji: '🖐️' },
  { id: 'mixed', emoji: '🎲' }
]

export default function PreferencesPage() {
  const router = useRouter()
  const t = useTranslations('preferences')
  const tCommon = useTranslations('common')
  const tMascot = useTranslations('mascot')
  // Phase 4 yokoten cleanup: removed dead `mounted` state. Both
  // characterStore (`charHydrated`) and gamePreferencesStore (`_hasHydrated`)
  // already gate the loading return below — `mounted` was redundant.
  const [guide] = useState(
    () => GUIDE_CHARACTERS[Math.floor(Math.random() * GUIDE_CHARACTERS.length)]
  )
  const guideNameKey =
    guide.id === 'owl' ? 'guideNameOwl' : guide.id === 'fox' ? 'guideNameFox' : 'guideNamePanda'
  const guideVoiceKey =
    guide.id === 'owl' ? 'guideVoiceOwl' : guide.id === 'fox' ? 'guideVoiceFox' : 'guideVoicePanda'
  const [step, setStep] = useState<'operations' | 'style'>('operations')

  const { operations, gameStyle, setOperations, setGameStyle, _hasHydrated } =
    useGamePreferencesStore()
  const { characterName, avatarStyle, skinTone, hairColor, primaryColor, _hasHydrated: charHydrated } =
    useCharacterStore()

  const [selectedOps, setSelectedOps] = useState<MathOperation[]>(operations)
  const [selectedStyle, setSelectedStyle] = useState<GameStyle>(gameStyle)

  // Sync state when store hydrates
  useEffect(() => {
    if (_hasHydrated) {
      setSelectedOps(operations)
      setSelectedStyle(gameStyle)
    }
  }, [_hasHydrated, operations, gameStyle])

  if (!_hasHydrated || !charHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-400 to-pink-400">
        <motion.div
          className="text-8xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ⚙️
        </motion.div>
      </div>
    )
  }

  const toggleOperation = (id: MathOperation) => {
    setSelectedOps((prev) => {
      if (prev.includes(id)) {
        // Don't allow deselecting if it's the last one
        if (prev.length <= 1) return prev
        return prev.filter((op) => op !== id)
      }
      return [...prev, id]
    })
  }

  const handleContinue = () => {
    if (step === 'operations') {
      setStep('style')
    } else {
      // Save preferences and go to worlds
      setOperations(selectedOps)
      setGameStyle(selectedStyle)
      router.push('/worlds')
    }
  }

  const handleBack = () => {
    if (step === 'style') {
      setStep('operations')
    } else {
      router.push('/')
    }
  }

  return (
    <ParallaxBackground theme="welcome" intensity="subtle">
      <main className="min-h-screen flex flex-col p-4 relative">
        <div className="absolute top-4 right-4 z-30">
          <LanguageToggle />
        </div>
        {/* Header with guide character */}
        <motion.div
          className="flex items-start gap-4 mb-6"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          {/* Guide character */}
          <motion.span
            className="text-6xl md:text-8xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {guide.emoji}
          </motion.span>

          {/* Speech bubble */}
          <motion.div
            className="bg-white/95 backdrop-blur rounded-3xl p-4 md:p-6 shadow-xl relative flex-1 max-w-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <div
              className="absolute -left-3 top-6 w-0 h-0
                          border-t-[12px] border-t-transparent
                          border-b-[12px] border-b-transparent
                          border-r-[12px] border-r-white/95"
            />
            <p className="text-xl md:text-2xl font-bold text-gray-800">
              {step === 'operations'
                ? t('questionWhatToLearn', { name: characterName || tMascot('fallbackName') })
                : t('questionHowToPlay')}
            </p>
            <p className="text-sm md:text-lg text-gray-600 mt-1">{t(guideVoiceKey)}</p>
            <p className="sr-only">{t(guideNameKey)}</p>
          </motion.div>

          {/* Player avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <PresetAvatar
              style={avatarStyle}
              skinTone={skinTone}
              hairColor={hairColor}
              primaryColor={primaryColor}
              size={80}
              animate={true}
            />
          </motion.div>
        </motion.div>

        {/* Content area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {step === 'operations' ? (
              <motion.div
                key="operations"
                className="w-full max-w-4xl"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                {/* Operation selection cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                  {OPERATIONS.map((op, i) => (
                    <motion.button
                      key={op.id}
                      className={`relative p-6 md:p-8 rounded-3xl shadow-2xl transition-all game-interactive
                                ${
                                  selectedOps.includes(op.id)
                                    ? `bg-gradient-to-br ${op.color} scale-105 ring-4 ring-white ring-offset-2`
                                    : 'bg-white hover:scale-105'
                                }`}
                      onClick={() => toggleOperation(op.id)}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Emoji */}
                      <motion.div
                        className="text-6xl md:text-7xl mb-4"
                        animate={
                          selectedOps.includes(op.id) ? { rotate: [0, 10, -10, 0] } : {}
                        }
                        transition={{ duration: 0.5 }}
                      >
                        {op.emoji}
                      </motion.div>

                      {/* Name */}
                      <h3
                        className={`text-2xl md:text-3xl font-bold mb-2
                                    ${selectedOps.includes(op.id) ? 'text-white' : 'text-gray-800'}`}
                      >
                        {t(`operations.${op.id}`)}
                      </h3>

                      {/* Description */}
                      <p
                        className={`text-lg ${selectedOps.includes(op.id) ? 'text-white/90' : 'text-gray-600'}`}
                      >
                        {t(`operations.${op.id}Description`)}
                      </p>

                      {/* Example */}
                      <div
                        className={`mt-4 text-xl font-mono px-4 py-2 rounded-xl
                                     ${
                                       selectedOps.includes(op.id)
                                         ? 'bg-white/30 text-white'
                                         : 'bg-gray-100 text-gray-700'
                                     }`}
                      >
                        {op.example}
                      </div>

                      {/* Checkmark */}
                      {selectedOps.includes(op.id) && (
                        <motion.div
                          className="absolute top-4 right-4 bg-white rounded-full p-2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <span className="text-2xl">✅</span>
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Hint text */}
                <motion.p
                  className="text-center text-white text-lg mb-4 drop-shadow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {t('hint')}
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="style"
                className="w-full max-w-3xl"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                {/* Game style selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                  {GAME_STYLES.map((style, i) => (
                    <motion.button
                      key={style.id}
                      className={`p-6 md:p-8 rounded-3xl shadow-2xl transition-all game-interactive
                                ${
                                  selectedStyle === style.id
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 scale-105 ring-4 ring-white'
                                    : 'bg-white hover:scale-105'
                                }`}
                      onClick={() => setSelectedStyle(style.id)}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="text-6xl md:text-7xl mb-4"
                        animate={
                          selectedStyle === style.id ? { scale: [1, 1.2, 1] } : {}
                        }
                        transition={{ duration: 0.3 }}
                      >
                        {style.emoji}
                      </motion.div>
                      <h3
                        className={`text-2xl md:text-3xl font-bold mb-2
                                    ${selectedStyle === style.id ? 'text-white' : 'text-gray-800'}`}
                      >
                        {t(`gameStyles.${style.id}`)}
                      </h3>
                      <p
                        className={`text-lg ${selectedStyle === style.id ? 'text-white/90' : 'text-gray-600'}`}
                      >
                        {t(`gameStyles.${style.id}Description`)}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom navigation */}
        <motion.div
          className="flex justify-center gap-4 mt-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            className="px-6 py-3 bg-white/90 backdrop-blur text-gray-700
                       rounded-full font-bold text-lg shadow-lg game-interactive"
            onClick={handleBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tCommon('back')}
          </motion.button>

          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500
                       text-white rounded-full font-bold text-xl shadow-xl
                       border-4 border-yellow-300 game-interactive"
            onClick={handleContinue}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                '0 0 20px rgba(255, 215, 0, 0.4)',
                '0 0 40px rgba(255, 215, 0, 0.6)',
                '0 0 20px rgba(255, 215, 0, 0.4)'
              ]
            }}
            transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
          >
            {step === 'operations' ? tCommon('next') : t('letsPlay')}
          </motion.button>
        </motion.div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-4">
          <div
            className={`w-3 h-3 rounded-full transition-all ${step === 'operations' ? 'bg-white scale-125' : 'bg-white/50'}`}
          />
          <div
            className={`w-3 h-3 rounded-full transition-all ${step === 'style' ? 'bg-white scale-125' : 'bg-white/50'}`}
          />
        </div>
      </main>
    </ParallaxBackground>
  )
}
