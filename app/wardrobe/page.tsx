'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCharacterStore, PRIMARY_COLORS } from '@/lib/stores/characterStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { PresetAvatar, AvatarSelector } from '@/components/character-creator/PresetAvatars'
import { ColorPicker } from '@/components/character-creator/ColorPicker'
import { ParallaxBackground } from '@/components/backgrounds/ParallaxBackground'
import { KidButton } from '@/components/ui/KidButton'
import { SKIN_TONES, HAIR_COLORS } from '@/lib/constants/characterItems'

// Phase 3 bonus — wardrobe parity with create-character.
//
// Same Toca Boca rules apply: tap = applied, ≥60px touch targets, single
// header, voice-and-tone clean, i18n on every visible string. The wardrobe
// also keeps its star-gated fantasy hair colors (kid sees what they're
// working toward), but the unlock-row label is now i18n-driven.

type TabType = 'avatar' | 'colors'

export default function WardrobePage() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const t = useTranslations('wardrobe')
  const tCreator = useTranslations('characterCreator')
  const tA11y = useTranslations('a11y')

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
    setHairColor,
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
      <div
        role="status"
        aria-label={t('title')}
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-400 to-pink-400"
      >
        <motion.div
          aria-hidden="true"
          className="text-7xl"
          animate={reduceMotion ? undefined : { rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          👗
        </motion.div>
      </div>
    )
  }

  const tabs: { id: TabType; emoji: string; label: string }[] = [
    { id: 'avatar', emoji: '🦸', label: t('tabs.character') },
    { id: 'colors', emoji: '🎨', label: t('tabs.color') },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'avatar':
        return (
          <motion.div
            key="avatar"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
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
            key="colors"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <section aria-labelledby="wardrobe-outfit-label">
              <h2
                id="wardrobe-outfit-label"
                className="text-base font-semibold text-center text-gray-700 mb-3"
              >
                {t('sections.outfitColor')}
              </h2>
              <div
                role="radiogroup"
                aria-labelledby="wardrobe-outfit-label"
                className="flex flex-wrap justify-center gap-3"
              >
                {PRIMARY_COLORS.map((color) => (
                  <motion.button
                    key={color}
                    type="button"
                    role="radio"
                    aria-checked={primaryColor === color}
                    aria-label={tA11y('selectColor', { label: color })}
                    className={`w-16 h-16 rounded-full border-4 shadow-lg ${
                      primaryColor === color
                        ? 'border-yellow-400 scale-110'
                        : 'border-white/50'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setPrimaryColor(color)}
                    whileHover={reduceMotion ? undefined : { scale: 1.15 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                  />
                ))}
              </div>
            </section>

            <section aria-labelledby="wardrobe-skin-label">
              <h2
                id="wardrobe-skin-label"
                className="text-base font-semibold text-center text-gray-700 mb-3"
              >
                {t('sections.skinTone')}
              </h2>
              <ColorPicker
                colors={SKIN_TONES}
                selectedColor={skinTone}
                onSelect={setSkinTone}
                size="large"
                groupLabel={t('sections.skinTone')}
              />
            </section>

            <section aria-labelledby="wardrobe-hair-label">
              <h2
                id="wardrobe-hair-label"
                className="text-base font-semibold text-center text-gray-700 mb-3"
              >
                {t('sections.hairColor')}
              </h2>
              <ColorPicker
                colors={HAIR_COLORS.filter((h) => h.unlockType === 'free').map(
                  (h) => h.color
                )}
                selectedColor={hairColor}
                onSelect={setHairColor}
                size="medium"
                groupLabel={t('sections.hairColor')}
              />

              {/* Star-gated fantasy hair colors — kept from the legacy page so
                  the kid can see what they're earning. Each locked swatch is
                  64px to keep the touch-target floor consistent. */}
              <div className="mt-5">
                <p className="text-center text-sm text-gray-600 mb-2">
                  {t('sections.fantasyHint')}
                </p>
                <div
                  role="radiogroup"
                  aria-label={t('sections.fantasyHint')}
                  className="flex flex-wrap justify-center gap-2"
                >
                  {HAIR_COLORS.filter((h) => h.unlockType === 'stars').map((h) => {
                    const isUnlocked = totalStars >= (h.unlockValue as number)
                    return (
                      <motion.button
                        key={h.color}
                        type="button"
                        role="radio"
                        aria-checked={hairColor === h.color}
                        aria-disabled={!isUnlocked}
                        aria-label={
                          isUnlocked
                            ? tA11y('selectColor', { label: h.color })
                            : `Locked: ${h.color}`
                        }
                        className={`w-16 h-16 rounded-full border-4 shadow relative ${
                          hairColor === h.color
                            ? 'border-yellow-400'
                            : 'border-white/50'
                        } ${!isUnlocked ? 'opacity-50' : ''}`}
                        style={{ backgroundColor: h.color }}
                        onClick={() => isUnlocked && setHairColor(h.color)}
                        whileHover={
                          reduceMotion || !isUnlocked ? undefined : { scale: 1.1 }
                        }
                        whileTap={
                          reduceMotion || !isUnlocked ? undefined : { scale: 0.95 }
                        }
                        disabled={!isUnlocked}
                      >
                        {!isUnlocked && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 flex items-center justify-center text-base"
                          >
                            🔒
                          </span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </section>
          </motion.div>
        )
    }
  }

  return (
    <ParallaxBackground theme="fairy" intensity="subtle">
      <main className="min-h-screen flex flex-col p-4 relative">
        {/* Header — back button on the left, title centered, stars on the right. */}
        <motion.header
          className="flex items-center justify-between mb-3 relative z-10"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <KidButton
            onClick={() => router.push('/worlds')}
            variant="soft"
            sound="pop"
            aria-label={t('backToWorldsAria')}
          >
            ← {t('backToWorlds')}
          </KidButton>

          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
            {t('title')}
          </h1>

          <div
            className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-lg min-h-[60px]"
            aria-label={t('starsAria', { count: totalStars })}
          >
            <motion.span
              aria-hidden="true"
              animate={reduceMotion ? undefined : { rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⭐
            </motion.span>
            <span className="font-bold text-yellow-600">{totalStars}</span>
          </div>
        </motion.header>

        {/* Main grid — preview top on mobile, left on desktop. */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto w-full relative z-10">
          <motion.section
            aria-label={tCreator('previewAria')}
            className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl
                       border-4 border-white/50 flex flex-col items-center justify-center
                       lg:w-1/3 min-h-[40vh] lg:min-h-0"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
          >
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

            {characterName && (
              <motion.div
                className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-400 to-pink-400
                           rounded-full shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <span className="text-white font-bold text-lg drop-shadow">
                  {characterName}
                </span>
              </motion.div>
            )}

            <div className="mt-4 flex gap-3">
              <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                <span aria-hidden="true">⭐</span>
                <span className="font-bold text-yellow-700">{totalStars}</span>
              </div>
              {currentStreak > 0 && (
                <div className="flex items-center gap-1 bg-orange-100 px-3 py-1 rounded-full">
                  <span aria-hidden="true">🔥</span>
                  <span className="font-bold text-orange-700">{currentStreak}</span>
                </div>
              )}
            </div>
          </motion.section>

          <motion.section
            className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl
                       border-4 border-white/50 flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div
              role="tablist"
              aria-label={t('title')}
              className="flex border-b-2 border-gray-100"
            >
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`wardrobe-tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`wardrobe-panel-${tab.id}`}
                  aria-label={tA11y('selectTab', { label: tab.label })}
                  className={`flex-1 min-h-[60px] py-4 px-4 font-bold text-lg flex items-center
                              justify-center gap-2 transition-colors relative
                              ${
                                activeTab === tab.id
                                  ? 'text-purple-600 bg-purple-50'
                                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                >
                  <span aria-hidden="true" className="text-xl">
                    {tab.emoji}
                  </span>
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"
                      layoutId="wardrobeTab"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            <div
              role="tabpanel"
              id={`wardrobe-panel-${activeTab}`}
              aria-labelledby={`wardrobe-tab-${activeTab}`}
              className="flex-1 overflow-y-auto p-4"
            >
              <AnimatePresence mode="wait">{renderTabContent()}</AnimatePresence>
            </div>
          </motion.section>
        </div>
      </main>
    </ParallaxBackground>
  )
}
