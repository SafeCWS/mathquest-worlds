'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCharacterStore } from '@/lib/stores/characterStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { useUnlocksStore } from '@/lib/stores/unlocksStore'
import { ParallaxBackground } from '@/components/backgrounds/ParallaxBackground'
import { PresetAvatar } from '@/components/character-creator/PresetAvatars'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import { LanguageToggle } from '@/components/LanguageToggle'
import { KidButton } from '@/components/ui/KidButton'
import { SlideOver } from '@/components/ui/SlideOver'
import { sounds } from '@/lib/sounds/webAudioSounds'

export default function WelcomePage() {
  const t = useTranslations('home')
  const tCommon = useTranslations('common')
  const tA11y = useTranslations('a11y')
  const tMascot = useTranslations('mascot')
  const tTiles = useTranslations('tiles')
  const tStats = useTranslations('stats')
  const reduceMotion = useReducedMotion()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [parentsOpen, setParentsOpen] = useState(false)
  const [lockedToast, setLockedToast] = useState<string | null>(null)
  const {
    _hasHydrated,
    hasCreatedCharacter,
    characterName,
    avatarStyle,
    skinTone,
    hairColor,
    primaryColor
  } = useCharacterStore()
  const { totalStars, currentStreak, updateStreak } = useProgressStore()
  const { checkAndUnlockStreakAchievements } = useUnlocksStore()
  const { celebration, showCelebration, dismissCelebration } = useCelebration()

  useEffect(() => {
    setMounted(true)
    updateStreak()
  }, [updateStreak])

  // Check for streak achievements after streak is updated
  useEffect(() => {
    if (mounted && currentStreak > 0) {
      const streakAchievements = checkAndUnlockStreakAchievements(currentStreak)
      if (streakAchievements.length > 0) {
        const achievement = streakAchievements[0]
        showCelebration({
          type: 'streak',
          title: achievement.itemName,
          subtitle: `${currentStreak} day streak achieved!`,
          emoji: achievement.emoji || '🔥'
        })
      }
    }
  }, [mounted, currentStreak, checkAndUnlockStreakAchievements, showCelebration])

  // Wait for both client mount AND Zustand hydration before rendering
  // This fixes the mobile/iPad race condition where localStorage data loads after initial render
  if (!mounted || !_hasHydrated) {
    return (
      <div
        role="status"
        aria-label={tCommon('loading')}
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-400 to-green-400"
      >
        <motion.div
          aria-hidden="true"
          className="text-7xl"
          animate={
            reduceMotion
              ? undefined
              : {
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.2, 1],
                }
          }
          transition={{ duration: 2, repeat: Infinity }}
        >
          🌴
        </motion.div>
      </div>
    )
  }

  // Resolve the kid's display name with the voice-and-tone fallback rule:
  // never show "{name}" placeholder, never show empty string. If the
  // character store has no name, use the localized "friend"/"amiga" slot.
  const displayName = (characterName && characterName.trim()) || tMascot('fallbackName')

  // Greeting copy. New player sees the picker prompt; returning sees a
  // named-entity hello. Spanish parallel handled by next-intl.
  const greeting = hasCreatedCharacter
    ? tMascot('greetingReturning', { name: displayName })
    : tMascot('greetingNew')

  // Tile gating — Phase 2.2 doesn't need real lock logic yet, but the
  // affordance has to exist or kids learn locked tiles don't react. For now
  // every tile is unlocked; the head-shake + toast wiring is in place so
  // future locked-tile gates (Phase 4 game-mode unlocks) light up for free.
  const handleTileTap = (path: string, locked: boolean) => {
    if (locked) {
      setLockedToast(tTiles('lockedToast'))
      window.setTimeout(() => setLockedToast(null), 3000)
      return
    }
    router.push(path)
  }

  return (
    <ParallaxBackground theme="welcome" intensity="medium">
      <main className="min-h-screen flex flex-col items-center justify-start p-4 pt-16 sm:pt-20 relative">
        {/* Mascot greeter — character-as-hero, replaces the title block. */}
        <motion.section
          aria-labelledby="mascot-greeting"
          className="w-full max-w-3xl flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-6 relative z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <motion.div
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <PresetAvatar
              style={hasCreatedCharacter ? avatarStyle : 'explorer'}
              emotion="happy"
              skinTone={skinTone}
              hairColor={hairColor}
              primaryColor={primaryColor}
              size={180}
              animate
            />
          </motion.div>

          {/* Speech bubble — aria-live so the greeting is announced on first
              paint. Tail is a CSS triangle pointing at the avatar. */}
          <div
            id="mascot-greeting"
            aria-live="polite"
            className="relative bg-white rounded-3xl px-6 py-5 shadow-xl
                       border-4 border-white/70 max-w-xs sm:max-w-sm
                       text-xl sm:text-2xl font-bold text-gray-800 leading-snug"
          >
            {greeting}
            {/* Tail — pointing left on tablet+, pointing up on mobile. */}
            <span
              aria-hidden="true"
              className="hidden sm:block absolute left-[-14px] top-1/2 -translate-y-1/2
                         w-0 h-0 border-y-[12px] border-y-transparent
                         border-r-[14px] border-r-white"
            />
            <span
              aria-hidden="true"
              className="sm:hidden absolute top-[-14px] left-1/2 -translate-x-1/2
                         w-0 h-0 border-x-[12px] border-x-transparent
                         border-b-[14px] border-b-white"
            />
          </div>
        </motion.section>

        {/* Stats card — typography lift (Phase 2.4). Numbers in Fredoka 700,
            larger sizes, voice-and-tone safe streak copy. */}
        {hasCreatedCharacter && (
          <motion.section
            aria-label="Your stats"
            className="flex justify-center gap-4 mb-8 flex-wrap relative z-10"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {/* Stars — solid amber. Always shown, even at 0. */}
            <div
              className="flex items-center gap-3 bg-white/90 backdrop-blur-sm
                         px-6 py-4 rounded-2xl shadow-lg border-2 border-amber-200"
            >
              <motion.span
                aria-hidden="true"
                className="text-4xl"
                animate={reduceMotion ? undefined : { rotate: [0, 12, -12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⭐
              </motion.span>
              <span
                className="font-extrabold text-[#F59E0B] tabular-nums"
                style={{ fontSize: 'clamp(2.25rem, 5vw, 3rem)', lineHeight: 1 }}
              >
                {totalStars}
              </span>
              <span className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
                {tStats('starsLabel')}
              </span>
            </div>
            {/* Streak — show "Start a streak today!" at 0 (no shaming),
                show count + suffix when ≥ 1. */}
            <div
              className="flex items-center gap-3 bg-white/90 backdrop-blur-sm
                         px-6 py-4 rounded-2xl shadow-lg border-2 border-orange-200"
            >
              <motion.span
                aria-hidden="true"
                className="text-4xl"
                animate={
                  reduceMotion || currentStreak === 0
                    ? undefined
                    : { scale: [1, 1.15, 1] }
                }
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                🔥
              </motion.span>
              {currentStreak > 0 ? (
                <>
                  <span
                    className="font-extrabold text-[#F97316] tabular-nums"
                    style={{ fontSize: 'clamp(2.25rem, 5vw, 3rem)', lineHeight: 1 }}
                  >
                    {currentStreak}
                  </span>
                  <span className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
                    {tStats('streakSuffix')}
                  </span>
                </>
              ) : (
                <span className="text-base font-semibold text-orange-700">
                  {tStats('streakStart')}
                </span>
              )}
            </div>
          </motion.section>
        )}

        {/* Tile grid — primary actions. 2×2 on mobile, 4×1 on tablet+. */}
        <motion.section
          aria-label={t('chooseAdventure')}
          className="w-full max-w-4xl relative z-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {hasCreatedCharacter ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <MenuTile
                icon="🎮"
                label={tTiles('mathGames')}
                ariaLabel={tA11y('playMathGames')}
                gradient="from-yellow-400 to-orange-500 border-yellow-300"
                onClick={() => handleTileTap('/worlds', false)}
                reduceMotion={reduceMotion ?? false}
                locked={false}
              />
              <MenuTile
                icon="✖️"
                label={tTiles('multiplication')}
                ariaLabel={tA11y('playMultiplicationGames')}
                gradient="from-green-400 to-teal-500 border-green-300"
                onClick={() => handleTileTap('/multiplication', false)}
                reduceMotion={reduceMotion ?? false}
                locked={false}
              />
              <MenuTile
                icon="👗"
                label={tTiles('wardrobe')}
                ariaLabel={tA11y('openWardrobe')}
                gradient="from-purple-400 to-pink-500 border-purple-300"
                onClick={() => handleTileTap('/wardrobe', false)}
                reduceMotion={reduceMotion ?? false}
                locked={false}
              />
              <MenuTile
                icon="📊"
                label={tTiles('progress')}
                ariaLabel={tA11y('openProgress')}
                gradient="from-blue-400 to-cyan-500 border-blue-300"
                onClick={() => handleTileTap('/progress', false)}
                reduceMotion={reduceMotion ?? false}
                locked={false}
              />
            </div>
          ) : (
            // New player — single huge "Start Adventure" tile.
            <div className="flex justify-center">
              <KidButton
                onClick={() => router.push('/create-character')}
                variant="primary"
                aria-label={tA11y('startAdventure')}
                className="w-full max-w-md text-3xl py-8 min-h-[160px] rounded-3xl"
              >
                <span className="block">{t('startAdventure')}</span>
              </KidButton>
            </div>
          )}
        </motion.section>

        {/* Locked-tile toast — appears at the bottom-center, dismisses itself. */}
        <AnimatePresence>
          {lockedToast && (
            <motion.div
              role="status"
              aria-live="polite"
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30
                         bg-gray-900 text-white px-6 py-3 rounded-full
                         shadow-2xl text-base font-semibold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              {lockedToast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top right — language toggle (kept), settings + parent as icon
            buttons that open slide-overs instead of navigating away. */}
        <motion.div
          className="absolute top-4 right-4 z-30 flex gap-2 items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <LanguageToggle />
          {hasCreatedCharacter && (
            <KidButton
              onClick={() => setSettingsOpen(true)}
              variant="icon"
              sound="click"
              sparkle={false}
              aria-label={tA11y('openSettings')}
              className="bg-white/90 backdrop-blur-sm border-2 border-white/60 shadow-md"
            >
              <span aria-hidden="true" className="text-2xl">⚙️</span>
            </KidButton>
          )}
          <KidButton
            onClick={() => setParentsOpen(true)}
            variant="icon"
            sound="click"
            sparkle={false}
            aria-label={tA11y('openParentDashboard')}
            className="bg-white/90 backdrop-blur-sm border-2 border-white/60 shadow-md px-4"
          >
            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              {tCommon('forParents')}
            </span>
          </KidButton>
        </motion.div>

        {/* Settings slide-over — language, sound, "for parents" link. */}
        <SlideOver
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          titleId="settings-title"
        >
          <SettingsPanel
            titleId="settings-title"
            onClose={() => setSettingsOpen(false)}
            onOpenParents={() => {
              setSettingsOpen(false)
              setParentsOpen(true)
            }}
          />
        </SlideOver>

        {/* Parents slide-over — links to the full /parent dashboard. */}
        <SlideOver
          open={parentsOpen}
          onClose={() => setParentsOpen(false)}
          titleId="parents-title"
        >
          <ParentsPanel
            titleId="parents-title"
            onClose={() => setParentsOpen(false)}
          />
        </SlideOver>

        {/* Decorative bottom bouncing items */}
        <motion.div
          aria-hidden="true"
          className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 text-4xl pointer-events-none z-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {['🥥', '🍌', '🌺', '🦋', '🌴'].map((emoji, i) => (
            <motion.span
              key={i}
              animate={reduceMotion ? undefined : { y: [0, -12, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut'
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </motion.div>

        {/* Streak Achievement Celebration Overlay */}
        <CelebrationOverlay
          celebration={celebration}
          onDismiss={dismissCelebration}
          autoDismissMs={4000}
        />
      </main>
    </ParallaxBackground>
  )
}

// ──────────────────────────────────────────────────────────────────────
// MenuTile — one of the four primary action tiles. Wraps KidButton with
// a custom gradient and reserves space for the locked-state head-shake.
// ──────────────────────────────────────────────────────────────────────

type MenuTileProps = {
  icon: string
  label: string
  ariaLabel: string
  /** Tailwind gradient + border class, e.g. "from-yellow-400 to-orange-500 border-yellow-300". */
  gradient: string
  onClick: () => void
  reduceMotion: boolean
  locked: boolean
}

function MenuTile({ icon, label, ariaLabel, gradient, onClick, reduceMotion, locked }: MenuTileProps) {
  const [shake, setShake] = useState(false)

  const handleTap = () => {
    if (locked && !reduceMotion) {
      setShake(true)
      window.setTimeout(() => setShake(false), 280)
    }
    onClick()
  }

  return (
    <motion.div
      animate={shake ? { x: [-6, 6, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.25 }}
    >
      <KidButton
        onClick={handleTap}
        variant="primary"
        aria-label={ariaLabel}
        className={`w-full min-h-[120px] sm:min-h-[140px] rounded-3xl
                    bg-gradient-to-br ${gradient}
                    flex flex-col items-center justify-center gap-2
                    ${locked ? 'opacity-60 grayscale' : ''}`}
      >
        <span aria-hidden="true" className="text-5xl sm:text-6xl">{icon}</span>
        <span className="text-lg sm:text-xl font-bold text-white drop-shadow-sm">
          {label}
        </span>
        {locked && (
          <span aria-hidden="true" className="absolute top-2 right-2 text-2xl">🔒</span>
        )}
      </KidButton>
    </motion.div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// SettingsPanel — content of the settings slide-over. Language toggle,
// sound volume slider, mute toggle, and a link to the parents panel.
// ──────────────────────────────────────────────────────────────────────

type SettingsPanelProps = {
  titleId: string
  onClose: () => void
  onOpenParents: () => void
}

function SettingsPanel({ titleId, onClose, onOpenParents }: SettingsPanelProps) {
  const tSlide = useTranslations('slideOver')
  const tCommon = useTranslations('common')
  const [volume, setVolume] = useState<number>(() => sounds.volume)
  const [muted, setMuted] = useState<boolean>(() => !sounds.soundEnabled)

  const updateVolume = (v: number) => {
    setVolume(v)
    sounds.volume = v
  }

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    sounds.soundEnabled = !next
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="flex items-center justify-between border-b-2 border-gray-100 pb-4">
        <h2 id={titleId} className="text-2xl font-extrabold text-gray-900">
          {tSlide('settingsTitle')}
        </h2>
        <KidButton
          onClick={onClose}
          variant="icon"
          sound="pop"
          sparkle={false}
          aria-label={tSlide('close')}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          <span aria-hidden="true" className="text-xl">✕</span>
        </KidButton>
      </div>

      {/* Language */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {tSlide('language')}
        </label>
        <LanguageToggle />
      </div>

      {/* Sound volume */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="sfx-volume"
          className="text-sm font-semibold text-gray-700 uppercase tracking-wide"
        >
          {tSlide('sfxVolume')}
        </label>
        <input
          id="sfx-volume"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => updateVolume(parseFloat(e.target.value))}
          className="w-full h-3 rounded-full bg-gray-200 appearance-none cursor-pointer
                     accent-orange-500"
        />
      </div>

      {/* Mute toggle */}
      <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
        <span className="text-base font-semibold text-gray-800">
          {tSlide('muteToggle')}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={muted}
          onClick={toggleMute}
          className={`relative w-14 h-8 rounded-full transition-colors
                      ${muted ? 'bg-gray-400' : 'bg-green-500'}`}
        >
          <span className="sr-only">{tSlide('muteToggle')}</span>
          <span
            aria-hidden="true"
            className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform
                        ${muted ? 'translate-x-1' : 'translate-x-7'}`}
          />
        </button>
      </div>

      {/* Spacer pushes parents link to bottom */}
      <div className="flex-1" />

      {/* Open parents panel */}
      <button
        type="button"
        onClick={onOpenParents}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500
                   text-white font-bold text-lg shadow-lg
                   hover:from-indigo-600 hover:to-purple-600 transition-colors
                   flex items-center justify-between"
      >
        <span>{tCommon('forParents')}</span>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// ParentsPanel — content of the parents slide-over. The full dashboard
// is a separate page (/parent) — Phase 2 just offers an entry point so
// kids don't accidentally end up there. PIN-gated by the existing page.
// ──────────────────────────────────────────────────────────────────────

type ParentsPanelProps = {
  titleId: string
  onClose: () => void
}

function ParentsPanel({ titleId, onClose }: ParentsPanelProps) {
  const tSlide = useTranslations('slideOver')

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="flex items-center justify-between border-b-2 border-gray-100 pb-4">
        <h2 id={titleId} className="text-2xl font-extrabold text-gray-900">
          {tSlide('parentsTitle')}
        </h2>
        <KidButton
          onClick={onClose}
          variant="icon"
          sound="pop"
          sparkle={false}
          aria-label={tSlide('close')}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          <span aria-hidden="true" className="text-xl">✕</span>
        </KidButton>
      </div>

      <p className="text-base text-gray-700 leading-relaxed">
        Progress, stars, recent sessions, and skill assessment are on the parent dashboard. PIN required.
      </p>

      <Link href="/parent" onClick={onClose} className="block">
        <button
          type="button"
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500
                     text-white font-bold text-lg shadow-lg
                     hover:from-indigo-600 hover:to-purple-600 transition-colors"
        >
          {tSlide('fullParentDashboard')}
        </button>
      </Link>
    </div>
  )
}
