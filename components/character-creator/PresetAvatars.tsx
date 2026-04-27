'use client'

import React from 'react'
import { motion } from 'motion/react'
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
}: PresetAvatarProps) {
  const config = emotionConfig[emotion]
  const Renderer = avatarRenderers[style]

  return (
    <motion.div
      className={`relative cursor-pointer ${selected ? 'ring-4 ring-yellow-400 ring-offset-2' : ''} rounded-2xl overflow-hidden`}
      onClick={onClick}
      animate={animate ? { y: [0, -config.bounce, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
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
          className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-4xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            ✓
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Avatar selection grid component
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

  const avatarLabels: Record<AvatarStyle, string> = {
    explorer: '🌴 Explorer',
    wizard: '✨ Wizard',
    astronaut: '🚀 Astronaut',
    pirate: '🏴‍☠️ Pirate',
    ninja: '🥷 Ninja',
    fairy: '🧚 Fairy',
    robot: '🤖 Robot',
    superhero: '🦸 Superhero',
    unicorn: '🦄 Unicorn',
    scientist: '🔬 Scientist',
    dragon: '🐲 Dragon',
    mermaid: '🧜‍♀️ Mermaid',
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {avatarStyles.map((style) => (
        <motion.div
          key={style}
          className="flex flex-col items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <PresetAvatar
            style={style}
            size={120}
            selected={selectedStyle === style}
            onClick={() => onSelect(style)}
            skinTone={skinTone}
            primaryColor={primaryColor}
            animate={selectedStyle === style}
          />
          <span className={`text-sm font-medium ${selectedStyle === style ? 'text-yellow-600' : 'text-gray-600'}`}>
            {avatarLabels[style]}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
