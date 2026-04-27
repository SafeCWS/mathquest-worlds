'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCharacterStore, PRIMARY_COLORS } from '@/lib/stores/characterStore'
import { PresetAvatar, AvatarSelector } from '@/components/character-creator/PresetAvatars'
import { ColorPicker } from '@/components/character-creator/ColorPicker'
import { ParallaxBackground } from '@/components/backgrounds/ParallaxBackground'
import { KidButton } from '@/components/ui/KidButton'
import { SKIN_TONES, HAIR_COLORS } from '@/lib/constants/characterItems'

// Phase 3.1 + 3.4 + 3.5 — Toca Boca-style customization.
//
// Design rules (from plans/purrfect-gliding-barto.md):
//   • Tap = applied. No confirm step. No "are you sure" dialog.
//   • One section visible at a time (3 tabs: Character / Color / Name).
//   • Live preview is always on screen — top on mobile, left on desktop.
//   • Touch targets ≥ 60px (KidButton + 64/80px ColorPicker swatches).
//   • Voice & tone: factual + warm, no "Easy peasy!" / no triple emoji headers.
//   • i18n: every visible string flows through `characterCreator.*` keys.
//   • "Let's go!" appears only when the kid has typed a name. Until then the
//     mascot speech bubble nudges them toward the Name tab.
//   • "Surprise me!" re-rolls ALL 11 customization fields via randomizeAll().

type TabType = 'avatar' | 'colors' | 'name'

export default function CreateCharacterPage() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const t = useTranslations('characterCreator')
  const tA11y = useTranslations('a11y')

  const [activeTab, setActiveTab] = useState<TabType>('avatar')
  const [nameInput, setNameInput] = useState('')

  const {
    _hasHydrated,
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
    randomizeAll,
    saveCharacter,
  } = useCharacterStore()

  // Sync the input field with the persisted name once hydration completes.
  // Before Phase 4.0 this used a local `mounted` flag (set in a no-deps
  // effect) plus the same `characterName` dep — duplicating signals. The
  // store's `_hasHydrated` flag is the canonical "client + persist ready"
  // marker, so we lean on that and drop the local state.
  useEffect(() => {
    if (_hasHydrated && characterName) {
      setNameInput(characterName)
    }
  }, [_hasHydrated, characterName])

  // SSR-safe gate — without this the persisted Zustand state and the server
  // markup disagree on first paint, which causes a hydration mismatch.
  if (!_hasHydrated) {
    return (
      <div
        role="status"
        aria-label={t('title')}
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

  const trimmedName = nameInput.trim()
  const canStart = trimmedName.length > 0

  // "Let's go!" handler. We block on canStart at the call site (the button is
  // hidden until then), but we double-check here so a stray keyboard activation
  // can't push an empty name into the store.
  const handleStart = () => {
    if (!canStart) return
    setCharacterName(trimmedName)
    saveCharacter()
    router.push('/worlds')
  }

  const tabs: { id: TabType; emoji: string; label: string }[] = [
    { id: 'avatar', emoji: '🦸', label: t('tabs.character') },
    { id: 'colors', emoji: '🎨', label: t('tabs.color') },
    { id: 'name', emoji: '✏️', label: t('tabs.name') },
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
            <section aria-labelledby="outfit-color-label">
              <h2
                id="outfit-color-label"
                className="text-base font-semibold text-center text-gray-700 mb-3"
              >
                {t('sections.outfitColor')}
              </h2>
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

            <section aria-labelledby="skin-tone-label">
              <h2
                id="skin-tone-label"
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

            <section aria-labelledby="hair-color-label">
              <h2
                id="hair-color-label"
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
            </section>
          </motion.div>
        )

      case 'name':
        return (
          <motion.div
            key="name"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-5 flex flex-col items-center"
          >
            <h2 className="text-base font-semibold text-center text-gray-700">
              {t('namePrompt')}
            </h2>

            <div className="w-full max-w-sm">
              <label htmlFor="character-name" className="sr-only">
                {t('nameInputLabel')}
              </label>
              <input
                id="character-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={t('nameInputPlaceholder')}
                maxLength={20}
                autoComplete="off"
                aria-label={tA11y('characterNameInput')}
                className="w-full min-h-[60px] px-6 py-4 rounded-2xl border-4 border-yellow-300
                           focus:border-yellow-500 focus:outline-none text-center
                           text-2xl font-bold shadow-lg bg-white/95
                           placeholder:text-gray-400"
              />
            </div>
          </motion.div>
        )
    }
  }

  return (
    <ParallaxBackground theme="welcome" intensity="medium">
      <main className="min-h-screen flex flex-col p-4 relative">
        {/* Single, non-shouty header. The kid sees the title here, then the
            preview, then the active section — no triple-stacked emoji noise. */}
        <motion.header
          className="text-center mb-3 relative z-10"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            {t('title')}
          </h1>
        </motion.header>

        {/* Main grid — preview-top on mobile, preview-left on desktop. */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto w-full relative z-10">
          {/* Live preview panel.
              On mobile we cap the height at 40vh so the tabs always have room. */}
          <motion.section
            aria-label={t('previewAria')}
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

            {/* Name nameplate — appears as soon as the kid types something. */}
            <AnimatePresence>
              {trimmedName && (
                <motion.div
                  key="nameplate"
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-400
                             rounded-full shadow-lg"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <span className="text-white font-bold text-lg drop-shadow">
                    {trimmedName}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Surprise Me! — full re-roll of all 11 fields (Phase 3.1 fix).
                Lives in the preview panel because a kid randomizing wants to see
                the result immediately, not scroll past tabs to find a button. */}
            <div className="mt-5">
              <KidButton
                onClick={() => randomizeAll()}
                variant="primary"
                sound="chime"
                aria-label={t('surpriseMeAria')}
                className="border-yellow-300"
              >
                <span aria-hidden="true" className="mr-2">🪄</span>
                {t('surpriseMe')}
              </KidButton>
            </div>
          </motion.section>

          {/* Customization panel — tabs + active section. */}
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
                  id={`tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  aria-label={tA11y('selectTab', { label: tab.label })}
                  className={`flex-1 min-h-[60px] py-4 px-4 font-bold text-lg flex items-center
                              justify-center gap-2 transition-colors relative
                              ${
                                activeTab === tab.id
                                  ? 'text-orange-600 bg-orange-50'
                                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                              }`}
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                >
                  <span aria-hidden="true" className="text-xl">
                    {tab.emoji}
                  </span>
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

            <div
              role="tabpanel"
              id={`tabpanel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
              className="flex-1 overflow-y-auto p-4"
            >
              <AnimatePresence mode="wait">{renderTabContent()}</AnimatePresence>
            </div>
          </motion.section>
        </div>

        {/* Bottom bar — Back always visible; Let's go appears only with a name.
            When no name yet, a friendly nudge tells the kid where to go.
            Using AnimatePresence so the swap reads as gentle, not jarring. */}
        <motion.div
          className="flex items-center justify-center gap-4 mt-4 relative z-10 min-h-[68px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <KidButton
            onClick={() => router.push('/')}
            variant="soft"
            sound="pop"
            aria-label={t('backHomeAria')}
          >
            ← {t('backHome')}
          </KidButton>

          <AnimatePresence mode="wait">
            {canStart ? (
              <motion.div
                key="lets-go"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <KidButton
                  onClick={handleStart}
                  variant="primary"
                  sound="chime"
                  aria-label={t('nameLetsGoAria')}
                  className="border-yellow-300 text-xl"
                >
                  ✨ {t('nameLetsGo')}
                </KidButton>
              </motion.div>
            ) : (
              <motion.button
                key="name-hint"
                type="button"
                onClick={() => setActiveTab('name')}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="px-5 py-3 rounded-2xl bg-white/90 border-2 border-white/50
                           text-gray-700 font-semibold shadow-md"
                aria-label={t('nameWaitingHint')}
              >
                <span aria-hidden="true" className="mr-1">💬</span>
                {t('nameWaitingHint')}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </ParallaxBackground>
  )
}
