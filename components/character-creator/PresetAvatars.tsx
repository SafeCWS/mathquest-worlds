'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { avatarRenderers } from './avatars'
import { emotionConfig, type AvatarStyle, type AvatarEmotion } from './avatars/shared'

// Re-export the canonical types so existing importers keep working.
export type { AvatarStyle, AvatarEmotion }

interface PresetAvatarProps {
  style: AvatarStyle
  emotion?: AvatarEmotion
  skinTone?: string
  hairColor?: string
  primaryColor?: string
  size?: number
  animate?: boolean
  onClick?: () => void
  selected?: boolean
}

// Cute, kid-friendly illustrated avatars. The actual SVG art for each style
// lives in ./avatars/<Style>.tsx — Phase 1.3 split kept the public API stable
// while breaking the 1235-LOC monolith into 12 self-contained renderers.
//
// When `onClick` is supplied, this renders as a real <button> for keyboard +
// screen-reader support (Phase 1.4 a11y fix). Otherwise it's a presentational
// <div> so the same component can be reused as a passive avatar (e.g. on the
// home page returning-player view).
export function PresetAvatar({
  style,
  emotion = 'happy',
  skinTone = '#FFDFC4',
  hairColor = '#3D2314',
  primaryColor = '#4A90D9',
  size = 200,
  animate = true,
  onClick,
  selected = false,
  ariaLabel,
  isInRadioGroup = false,
}: PresetAvatarProps & { ariaLabel?: string; isInRadioGroup?: boolean }) {
  const config = emotionConfig[emotion]
  const Renderer = avatarRenderers[style]
  const reduceMotion = useReducedMotion()

  const sharedClass = `relative ${selected ? 'ring-4 ring-yellow-400 ring-offset-2' : ''} rounded-2xl overflow-hidden`
  const animationProps = {
    animate: !reduceMotion && animate ? { y: [0, -config.bounce, 0] } : {},
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
  }

  const inner = (
    <>
      <Renderer
        emotion={emotion}
        skinTone={skinTone}
        hairColor={hairColor}
        primaryColor={primaryColor}
        size={size}
      />

      {/* Selection indicator */}
      {selected && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-4xl"
            animate={reduceMotion ? undefined : { scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            ✓
          </motion.div>
        </motion.div>
      )}
    </>
  )

  if (onClick) {
    // Interactive avatar — renders as a real button (or radio when in a group)
    // so Tab + Enter + Space work and screen readers announce it correctly.
    return (
      <motion.button
        type="button"
        aria-label={ariaLabel ?? `Choose ${style} avatar`}
        {...(isInRadioGroup ? { role: 'radio', 'aria-checked': selected } : {})}
        onClick={onClick}
        className={`${sharedClass} cursor-pointer bg-transparent p-0 border-0`}
        {...animationProps}
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
      >
        {inner}
      </motion.button>
    )
  }

  return (
    <motion.div
      className={sharedClass}
      {...animationProps}
    >
      {inner}
    </motion.div>
  )
}

// Avatar selection grid component
//
// Phase 3.4 — labels and the "Choose your avatar" group label are now read
// from the `characterCreator` i18n namespace so Spanish-speaking kids see
// "Mago" instead of "Wizard". Emojis stay (universally readable, kid-friendly)
// but live in i18n too so we can swap them per locale if needed.
export function AvatarSelector({
  selectedStyle,
  onSelect,
  skinTone,
  primaryColor,
}: {
  selectedStyle: AvatarStyle
  onSelect: (style: AvatarStyle) => void
  skinTone?: string
  primaryColor?: string
}) {
  const t = useTranslations('characterCreator')

  const avatarStyles: AvatarStyle[] = [
    'explorer',
    'wizard',
    'astronaut',
    'pirate',
    'ninja',
    'fairy',
    'robot',
    'superhero',
    'unicorn',
    'scientist',
    'dragon',
    'mermaid',
  ]

  return (
    <div
      role="radiogroup"
      aria-label={t('title')}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4"
    >
      {avatarStyles.map((style) => {
        const label = t(`avatarLabels.${style}`)
        const emoji = t(`avatarEmojis.${style}`)
        // Phase 4.0 carry-over: outer wrapper has no animation props, so it
        // doesn't need to be a Motion node. Plain <div> drops a Motion mount
        // per avatar (12× per render) without changing visuals.
        return (
          <div
            key={style}
            className="flex flex-col items-center gap-2"
          >
            <PresetAvatar
              style={style}
              size={120}
              selected={selectedStyle === style}
              onClick={() => onSelect(style)}
              skinTone={skinTone}
              primaryColor={primaryColor}
              animate={selectedStyle === style}
              isInRadioGroup
              ariaLabel={t('avatarChooseAria', { label })}
            />
            <span className={`text-sm font-medium ${selectedStyle === style ? 'text-yellow-700' : 'text-gray-700'}`}>
              <span aria-hidden="true">{emoji}</span> {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
