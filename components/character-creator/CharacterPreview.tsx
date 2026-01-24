'use client'

import { motion } from 'motion/react'
import { useCharacterStore } from '@/lib/stores/characterStore'
import { PresetAvatar } from './PresetAvatars'

// Helper to get pet emoji
const getPetEmoji = (pet: string): string => {
  const pets: Record<string, string> = {
    'pet-none': '',
    'pet-parrot': '🦜',
    'pet-monkey': '🐒',
    'pet-turtle': '🐢',
    'pet-crab': '🦀',
    'pet-alien': '👽',
    'pet-seahorse': '🐴',
    'pet-unicorn': '🦄',
    'pet-babydino': '🦕',
    'pet-gummybear': '🧸',
    'pet-phoenix': '🔥',
    'pet-dragon': '🐲'
  }
  return pets[pet] || ''
}

interface CharacterPreviewProps {
  size?: 'small' | 'medium' | 'large'
  animate?: boolean
  showPet?: boolean
}

export function CharacterPreview({
  size = 'medium',
  animate = true,
  showPet = true
}: CharacterPreviewProps) {
  const {
    avatarStyle,
    skinTone,
    hairColor,
    primaryColor,
    petBuddy,
    emotion
  } = useCharacterStore()

  // Map size to pixel values for PresetAvatar
  const sizeMap = {
    small: 60,
    medium: 120,
    large: 180
  }

  const containerSizes = {
    small: 'w-16 h-20',
    medium: 'w-32 h-40',
    large: 'w-48 h-56'
  }

  const petTextSize = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl'
  }

  // Map emotion to PresetAvatar emotion type
  const emotionMap: Record<string, 'neutral' | 'happy' | 'excited' | 'thinking' | 'sad' | 'celebrating'> = {
    neutral: 'neutral',
    happy: 'happy',
    excited: 'excited',
    thinking: 'thinking',
    sad: 'sad',
    celebrating: 'celebrating'
  }

  return (
    <div className={`relative ${containerSizes[size]} flex items-center justify-center`}>
      {/* Main Avatar using PresetAvatar */}
      <motion.div
        animate={animate ? { y: [0, -3, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PresetAvatar
          style={avatarStyle}
          emotion={emotionMap[emotion] || 'happy'}
          skinTone={skinTone}
          hairColor={hairColor}
          primaryColor={primaryColor}
          size={sizeMap[size]}
          animate={animate}
        />
      </motion.div>

      {/* Pet buddy */}
      {showPet && petBuddy && petBuddy !== 'pet-none' && (
        <motion.div
          className={`absolute bottom-0 right-0 ${petTextSize[size]}`}
          animate={
            animate
              ? {
                  y: [0, -8, 0],
                  x: [0, 3, 0]
                }
              : {}
          }
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {getPetEmoji(petBuddy)}
        </motion.div>
      )}

      {/* Sparkle effects */}
      {animate && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-sm"
              style={{
                top: `${10 + i * 20}%`,
                left: `${5 + i * 25}%`
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.5
              }}
            >
              ✨
            </motion.span>
          ))}
        </>
      )}
    </div>
  )
}
