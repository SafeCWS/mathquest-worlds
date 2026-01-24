'use client'

import { motion } from 'motion/react'
import { useCharacterStore } from '@/lib/stores/characterStore'

interface DressUpAvatarProps {
  size?: 'small' | 'medium' | 'large'
  animate?: boolean
}

export function DressUpAvatar({ size = 'large', animate = true }: DressUpAvatarProps) {
  const {
    bodyType,
    skinTone,
    hairStyle,
    hairColor,
    eyeColor,
    outfit,
    accessories,
    petBuddy
  } = useCharacterStore()

  const sizes = {
    small: { width: 120, height: 180 },
    medium: { width: 180, height: 270 },
    large: { width: 240, height: 360 }
  }

  const s = sizes[size]
  const scale = s.width / 240 // Base scale

  // Body type visual differences
  const bodyStyles: Record<string, { headSize: number; bodyWidth: number; legLength: number; armLength: number }> = {
    'body-1': { headSize: 75, bodyWidth: 65, legLength: 75, armLength: 50 }, // Slim
    'body-2': { headSize: 80, bodyWidth: 75, legLength: 80, armLength: 55 }, // Regular
    'body-3': { headSize: 80, bodyWidth: 85, legLength: 75, armLength: 55 }, // Curvy
    'body-4': { headSize: 78, bodyWidth: 80, legLength: 85, armLength: 60 }, // Athletic
    'body-5': { headSize: 70, bodyWidth: 60, legLength: 65, armLength: 45 }, // Petite
    'body-6': { headSize: 82, bodyWidth: 70, legLength: 95, armLength: 60 }, // Tall
  }
  const body = bodyStyles[bodyType] || bodyStyles['body-2']

  // Hair styles as visual shapes
  const renderHair = () => {
    const baseStyle = {
      position: 'absolute' as const,
      backgroundColor: hairColor,
      transition: 'all 0.3s ease'
    }

    switch (hairStyle) {
      case 'hair-short':
        return (
          <div style={{
            ...baseStyle,
            width: 90 * scale,
            height: 40 * scale,
            top: 10 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: '50% 50% 30% 30%'
          }} />
        )
      case 'hair-medium':
        return (
          <div style={{
            ...baseStyle,
            width: 100 * scale,
            height: 70 * scale,
            top: 5 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: '50% 50% 40% 40%'
          }} />
        )
      case 'hair-long':
        return (
          <>
            <div style={{
              ...baseStyle,
              width: 100 * scale,
              height: 50 * scale,
              top: 5 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: '50% 50% 30% 30%'
            }} />
            {/* Long hair sides */}
            <div style={{
              ...baseStyle,
              width: 25 * scale,
              height: 120 * scale,
              top: 30 * scale,
              left: 15 * scale,
              borderRadius: '0 0 50% 50%'
            }} />
            <div style={{
              ...baseStyle,
              width: 25 * scale,
              height: 120 * scale,
              top: 30 * scale,
              right: 15 * scale,
              borderRadius: '0 0 50% 50%'
            }} />
          </>
        )
      case 'hair-curly':
        return (
          <div style={{
            ...baseStyle,
            width: 110 * scale,
            height: 80 * scale,
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: '60% 60% 50% 50%',
            boxShadow: `inset 0 ${-10 * scale}px ${20 * scale}px rgba(0,0,0,0.2)`
          }} />
        )
      case 'hair-ponytail':
        return (
          <>
            <div style={{
              ...baseStyle,
              width: 90 * scale,
              height: 45 * scale,
              top: 8 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: '50% 50% 30% 30%'
            }} />
            {/* Ponytail */}
            <div style={{
              ...baseStyle,
              width: 20 * scale,
              height: 60 * scale,
              top: 20 * scale,
              right: 5 * scale,
              borderRadius: '50%',
              transform: 'rotate(20deg)'
            }} />
          </>
        )
      case 'hair-pigtails':
        return (
          <>
            <div style={{
              ...baseStyle,
              width: 90 * scale,
              height: 45 * scale,
              top: 8 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: '50% 50% 30% 30%'
            }} />
            {/* Pigtails */}
            <div style={{
              ...baseStyle,
              width: 25 * scale,
              height: 80 * scale,
              top: 25 * scale,
              left: -5 * scale,
              borderRadius: '50%'
            }} />
            <div style={{
              ...baseStyle,
              width: 25 * scale,
              height: 80 * scale,
              top: 25 * scale,
              right: -5 * scale,
              borderRadius: '50%'
            }} />
          </>
        )
      case 'hair-bun':
        return (
          <>
            <div style={{
              ...baseStyle,
              width: 90 * scale,
              height: 40 * scale,
              top: 15 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: '50% 50% 30% 30%'
            }} />
            {/* Bun */}
            <div style={{
              ...baseStyle,
              width: 35 * scale,
              height: 35 * scale,
              top: -5 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: '50%'
            }} />
          </>
        )
      case 'hair-afro':
        return (
          <div style={{
            ...baseStyle,
            width: 130 * scale,
            height: 100 * scale,
            top: -15 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: '50%'
          }} />
        )
      default:
        return (
          <div style={{
            ...baseStyle,
            width: 90 * scale,
            height: 40 * scale,
            top: 10 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: '50% 50% 30% 30%'
          }} />
        )
    }
  }

  // Outfit colors and styles
  const getOutfitStyle = () => {
    const outfitStyles: Record<string, { top: string; bottom: string; pattern?: string }> = {
      'outfit-casual': { top: '#4A90D9', bottom: '#2C5282' },
      'outfit-dress': { top: '#E53E7E', bottom: '#E53E7E' },
      'outfit-sporty': { top: '#38A169', bottom: '#1A365D' },
      'outfit-overalls': { top: '#DD6B20', bottom: '#DD6B20' },
      'outfit-hoodie': { top: '#805AD5', bottom: '#2D3748' },
      'outfit-jumpsuit': { top: '#D69E2E', bottom: '#D69E2E' },
      'outfit-tshirt-jeans': { top: '#F56565', bottom: '#3182CE' },
      'outfit-skirt-top': { top: '#9F7AEA', bottom: '#ED64A6' },
      'outfit-tropical': { top: '#48BB78', bottom: '#2B6CB0' },
      'outfit-adventurer': { top: '#975A16', bottom: '#744210' },
      'outfit-explorer': { top: '#A0AEC0', bottom: '#4A5568' },
      'outfit-safari': { top: '#C4A35A', bottom: '#8B7355' },
      'outfit-astronaut': { top: '#E2E8F0', bottom: '#E2E8F0' },
      'outfit-starfleet': { top: '#1A365D', bottom: '#1A365D' },
      'outfit-mermaid': { top: '#38B2AC', bottom: '#319795' },
      'outfit-pirate': { top: '#1A202C', bottom: '#1A202C' },
      'outfit-fairy': { top: '#FBB6CE', bottom: '#F687B3' },
      'outfit-princess': { top: '#D69E2E', bottom: '#F6E05E' }
    }
    return outfitStyles[outfit] || { top: '#4A90D9', bottom: '#2C5282' }
  }

  const outfitColors = getOutfitStyle()

  // Pet emojis
  const petEmojis: Record<string, string> = {
    'pet-parrot': '🦜',
    'pet-monkey': '🐒',
    'pet-turtle': '🐢',
    'pet-crab': '🦀',
    'pet-unicorn': '🦄',
    'pet-dragon': '🐲',
    'pet-babydino': '🦕',
    'pet-alien': '👽'
  }

  return (
    <motion.div
      className="relative"
      style={{ width: s.width, height: s.height }}
      animate={animate ? { y: [0, -5, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Shadow */}
      <div
        className="absolute rounded-full bg-black/20"
        style={{
          width: 80 * scale,
          height: 15 * scale,
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />

      {/* BODY LAYER - Legs (DYNAMIC based on bodyType) */}
      <div
        className="absolute"
        style={{
          bottom: 15 * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8 * scale,
          transition: 'all 0.3s ease'
        }}
      >
        {/* Left leg */}
        <div
          style={{
            width: (body.bodyWidth * 0.35) * scale,
            height: body.legLength * scale,
            backgroundColor: skinTone,
            borderRadius: `0 0 ${15 * scale}px ${15 * scale}px`,
            boxShadow: 'inset -3px 0 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}
        />
        {/* Right leg */}
        <div
          style={{
            width: (body.bodyWidth * 0.35) * scale,
            height: body.legLength * scale,
            backgroundColor: skinTone,
            borderRadius: `0 0 ${15 * scale}px ${15 * scale}px`,
            boxShadow: 'inset 3px 0 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}
        />
      </div>

      {/* OUTFIT - Pants/Skirt (DYNAMIC) */}
      <div
        className="absolute"
        style={{
          bottom: (body.legLength * 0.8) * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          width: body.bodyWidth * scale,
          height: 50 * scale,
          backgroundColor: outfitColors.bottom,
          borderRadius: `${5 * scale}px ${5 * scale}px ${20 * scale}px ${20 * scale}px`,
          boxShadow: 'inset 0 -5px 15px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
      />

      {/* BODY - Torso (DYNAMIC) */}
      <div
        className="absolute"
        style={{
          bottom: (body.legLength + 20) * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          width: body.bodyWidth * scale,
          height: 70 * scale,
          backgroundColor: skinTone,
          borderRadius: `${30 * scale}px ${30 * scale}px ${10 * scale}px ${10 * scale}px`,
          boxShadow: 'inset -5px 0 15px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease'
        }}
      />

      {/* OUTFIT - Top/Shirt (DYNAMIC) */}
      <div
        className="absolute"
        style={{
          bottom: (body.legLength + 25) * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          width: (body.bodyWidth - 5) * scale,
          height: 60 * scale,
          backgroundColor: outfitColors.top,
          borderRadius: `${25 * scale}px ${25 * scale}px ${5 * scale}px ${5 * scale}px`,
          boxShadow: 'inset 0 -5px 15px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
      />

      {/* Arms (DYNAMIC) */}
      <motion.div
        className="absolute"
        style={{
          bottom: (body.legLength + 40) * scale,
          left: ((120 - body.bodyWidth) / 2) * scale,
          width: 20 * scale,
          height: body.armLength * scale,
          backgroundColor: skinTone,
          borderRadius: 10 * scale,
          transformOrigin: 'top center',
          boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease'
        }}
        animate={animate ? { rotate: [-5, 5, -5] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.div
        className="absolute"
        style={{
          bottom: (body.legLength + 40) * scale,
          right: ((120 - body.bodyWidth) / 2) * scale,
          width: 20 * scale,
          height: body.armLength * scale,
          backgroundColor: skinTone,
          borderRadius: 10 * scale,
          transformOrigin: 'top center',
          boxShadow: 'inset 2px 0 5px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease'
        }}
        animate={animate ? { rotate: [5, -5, 5] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      />

      {/* HEAD (DYNAMIC based on bodyType) */}
      <div
        className="absolute"
        style={{
          bottom: (body.legLength + 85) * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          width: body.headSize * scale,
          height: (body.headSize + 5) * scale,
          backgroundColor: skinTone,
          borderRadius: '50% 50% 45% 45%',
          boxShadow: `
            inset -8px -8px 20px rgba(0,0,0,0.1),
            inset 8px 8px 20px rgba(255,255,255,0.2),
            0 5px 15px rgba(0,0,0,0.15)
          `,
          transition: 'all 0.3s ease'
        }}
      >
        {/* Cheeks (blush) */}
        <div
          className="absolute rounded-full"
          style={{
            width: 15 * scale,
            height: 10 * scale,
            backgroundColor: '#FFB6C1',
            opacity: 0.5,
            left: 8 * scale,
            top: 50 * scale
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 15 * scale,
            height: 10 * scale,
            backgroundColor: '#FFB6C1',
            opacity: 0.5,
            right: 8 * scale,
            top: 50 * scale
          }}
        />

        {/* Eyes - BIG and expressive like Duolingo */}
        <div
          className="absolute flex gap-2"
          style={{
            top: 30 * scale,
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          {/* Left eye - BIGGER */}
          <motion.div
            className="relative bg-white rounded-full"
            style={{
              width: 24 * scale,
              height: 26 * scale,
              boxShadow: '0 4px 8px rgba(0,0,0,0.15), inset 0 2px 4px rgba(0,0,0,0.05)'
            }}
            animate={animate ? { scaleY: [1, 1, 0.1, 1, 1] } : {}}
            transition={{ duration: 4, repeat: Infinity }}
          >
            {/* Iris - larger and more colorful */}
            <div
              className="absolute rounded-full"
              style={{
                width: 14 * scale,
                height: 14 * scale,
                backgroundColor: eyeColor,
                top: '30%',
                left: '30%',
                boxShadow: `inset 0 ${-2 * scale}px ${4 * scale}px rgba(0,0,0,0.2)`
              }}
            >
              {/* Pupil */}
              <div
                className="absolute bg-black rounded-full"
                style={{
                  width: 6 * scale,
                  height: 6 * scale,
                  top: '25%',
                  left: '25%'
                }}
              />
              {/* Double sparkle highlights */}
              <div
                className="absolute bg-white rounded-full"
                style={{
                  width: 5 * scale,
                  height: 5 * scale,
                  top: 2 * scale,
                  left: 2 * scale,
                  opacity: 0.9
                }}
              />
              <div
                className="absolute bg-white rounded-full"
                style={{
                  width: 2 * scale,
                  height: 2 * scale,
                  bottom: 2 * scale,
                  right: 2 * scale,
                  opacity: 0.6
                }}
              />
            </div>
          </motion.div>
          {/* Right eye - BIGGER */}
          <motion.div
            className="relative bg-white rounded-full"
            style={{
              width: 24 * scale,
              height: 26 * scale,
              boxShadow: '0 4px 8px rgba(0,0,0,0.15), inset 0 2px 4px rgba(0,0,0,0.05)'
            }}
            animate={animate ? { scaleY: [1, 1, 0.1, 1, 1] } : {}}
            transition={{ duration: 4, repeat: Infinity, delay: 0.1 }}
          >
            {/* Iris - larger and more colorful */}
            <div
              className="absolute rounded-full"
              style={{
                width: 14 * scale,
                height: 14 * scale,
                backgroundColor: eyeColor,
                top: '30%',
                left: '30%',
                boxShadow: `inset 0 ${-2 * scale}px ${4 * scale}px rgba(0,0,0,0.2)`
              }}
            >
              {/* Pupil */}
              <div
                className="absolute bg-black rounded-full"
                style={{
                  width: 6 * scale,
                  height: 6 * scale,
                  top: '25%',
                  left: '25%'
                }}
              />
              {/* Double sparkle highlights */}
              <div
                className="absolute bg-white rounded-full"
                style={{
                  width: 5 * scale,
                  height: 5 * scale,
                  top: 2 * scale,
                  left: 2 * scale,
                  opacity: 0.9
                }}
              />
              <div
                className="absolute bg-white rounded-full"
                style={{
                  width: 2 * scale,
                  height: 2 * scale,
                  bottom: 2 * scale,
                  right: 2 * scale,
                  opacity: 0.6
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Eyebrows - Add expressiveness */}
        <motion.div
          className="absolute"
          style={{
            top: 25 * scale,
            left: '35%',
            width: 15 * scale,
            height: 3 * scale,
            backgroundColor: hairColor,
            borderRadius: '50%',
            opacity: 0.7,
            transform: 'rotate(-10deg)'
          }}
          animate={animate ? { y: [0, -1, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute"
          style={{
            top: 25 * scale,
            right: '35%',
            width: 15 * scale,
            height: 3 * scale,
            backgroundColor: hairColor,
            borderRadius: '50%',
            opacity: 0.7,
            transform: 'rotate(10deg)'
          }}
          animate={animate ? { y: [0, -1, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
        />

        {/* Smile - BIGGER and more expressive */}
        <motion.div
          className="absolute"
          style={{
            bottom: 15 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 30 * scale,
            height: 14 * scale,
            borderBottom: `${4 * scale}px solid #d4627a`,
            borderRadius: '0 0 50% 50%',
            borderLeft: `${3 * scale}px solid transparent`,
            borderRight: `${3 * scale}px solid transparent`
          }}
          animate={animate ? { scaleX: [1, 1.15, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Tongue (appears sometimes for personality) */}
        <motion.div
          className="absolute rounded-full"
          style={{
            bottom: 16 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 8 * scale,
            height: 5 * scale,
            backgroundColor: '#ff9999',
            borderRadius: '0 0 50% 50%'
          }}
          animate={animate ? {
            opacity: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            scaleY: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
          } : {}}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      {/* HAIR - On top of head (DYNAMIC) */}
      <div className="absolute" style={{
        bottom: (body.legLength + 85) * scale,
        left: '50%',
        transform: 'translateX(-50%)',
        width: body.headSize * scale,
        transition: 'all 0.3s ease'
      }}>
        {renderHair()}
      </div>

      {/* ACCESSORIES */}
      {accessories.includes('acc-glasses') && (
        <div
          className="absolute"
          style={{
            bottom: 205 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 24 * scale
          }}
        >
          👓
        </div>
      )}
      {accessories.includes('acc-bow') && (
        <motion.div
          className="absolute"
          style={{
            bottom: 245 * scale,
            right: 70 * scale,
            fontSize: 20 * scale
          }}
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          🎀
        </motion.div>
      )}
      {(accessories.includes('acc-crown') || accessories.includes('acc-star-crown')) && (
        <motion.div
          className="absolute"
          style={{
            bottom: 260 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 28 * scale
          }}
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          👑
        </motion.div>
      )}
      {accessories.includes('acc-flower') && (
        <div
          className="absolute"
          style={{
            bottom: 240 * scale,
            left: 65 * scale,
            fontSize: 18 * scale
          }}
        >
          🌺
        </div>
      )}

      {/* PET */}
      {petBuddy && petBuddy !== 'pet-none' && (
        <motion.div
          className="absolute"
          style={{
            bottom: 30 * scale,
            right: -20 * scale,
            fontSize: 40 * scale
          }}
          animate={{ y: [0, -8, 0], rotate: [-5, 5, -5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {petEmojis[petBuddy] || '🐾'}
        </motion.div>
      )}
    </motion.div>
  )
}
