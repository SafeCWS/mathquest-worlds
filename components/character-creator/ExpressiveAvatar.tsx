'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useCharacterStore } from '@/lib/stores/characterStore'
import { useState, useEffect } from 'react'

// Emotion types the avatar can express
export type AvatarEmotion =
  | 'neutral'
  | 'happy'
  | 'excited'
  | 'thinking'
  | 'sad'
  | 'celebrating'
  | 'surprised'
  | 'determined'
  | 'sleepy'

interface ExpressiveAvatarProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  emotion?: AvatarEmotion
  animate?: boolean
  showEffects?: boolean
  onAnimationComplete?: () => void
}

export function ExpressiveAvatar({
  size = 'large',
  emotion = 'neutral',
  animate = true,
  showEffects = true,
  onAnimationComplete
}: ExpressiveAvatarProps) {
  const {
    skinTone,
    hairStyle,
    hairColor,
    eyeColor,
    outfit,
    accessories,
    petBuddy
  } = useCharacterStore()

  const [currentEmotion, setCurrentEmotion] = useState(emotion)

  useEffect(() => {
    setCurrentEmotion(emotion)
  }, [emotion])

  const sizes = {
    small: { width: 100, height: 150 },
    medium: { width: 160, height: 240 },
    large: { width: 220, height: 330 },
    xlarge: { width: 280, height: 420 }
  }

  const s = sizes[size]
  const scale = s.width / 220

  // Emotion-based configurations
  const emotionConfig = {
    neutral: {
      eyeScale: 1,
      eyebrowAngle: 0,
      mouthCurve: 0.5,
      blush: 0.3,
      pupilOffset: { x: 0, y: 0 },
      bodyBounce: 5,
      armSwing: 5
    },
    happy: {
      eyeScale: 1.1,
      eyebrowAngle: -5,
      mouthCurve: 0.8,
      blush: 0.6,
      pupilOffset: { x: 0, y: -1 },
      bodyBounce: 10,
      armSwing: 10
    },
    excited: {
      eyeScale: 1.3,
      eyebrowAngle: -10,
      mouthCurve: 1,
      blush: 0.7,
      pupilOffset: { x: 0, y: -2 },
      bodyBounce: 20,
      armSwing: 25
    },
    thinking: {
      eyeScale: 0.9,
      eyebrowAngle: 8,
      mouthCurve: 0.3,
      blush: 0.2,
      pupilOffset: { x: 3, y: -2 },
      bodyBounce: 2,
      armSwing: 2
    },
    sad: {
      eyeScale: 0.85,
      eyebrowAngle: 12,
      mouthCurve: -0.3,
      blush: 0.4,
      pupilOffset: { x: 0, y: 2 },
      bodyBounce: 2,
      armSwing: 3
    },
    celebrating: {
      eyeScale: 1.2,
      eyebrowAngle: -8,
      mouthCurve: 1,
      blush: 0.8,
      pupilOffset: { x: 0, y: 0 },
      bodyBounce: 30,
      armSwing: 45
    },
    surprised: {
      eyeScale: 1.4,
      eyebrowAngle: -15,
      mouthCurve: 0.2,
      blush: 0.5,
      pupilOffset: { x: 0, y: 0 },
      bodyBounce: 15,
      armSwing: 15
    },
    determined: {
      eyeScale: 0.95,
      eyebrowAngle: -5,
      mouthCurve: 0.4,
      blush: 0.3,
      pupilOffset: { x: 0, y: 0 },
      bodyBounce: 3,
      armSwing: 5
    },
    sleepy: {
      eyeScale: 0.5,
      eyebrowAngle: 5,
      mouthCurve: 0.2,
      blush: 0.4,
      pupilOffset: { x: 0, y: 1 },
      bodyBounce: 2,
      armSwing: 2
    }
  }

  const config = emotionConfig[currentEmotion]

  // Hair rendering with improved visuals
  const renderHair = () => {
    const baseStyle = {
      position: 'absolute' as const,
      background: `linear-gradient(135deg, ${hairColor} 0%, ${adjustBrightness(hairColor, -20)} 100%)`,
      transition: 'all 0.4s ease',
      boxShadow: `inset 0 ${-5 * scale}px ${15 * scale}px rgba(255,255,255,0.15),
                  inset 0 ${5 * scale}px ${15 * scale}px rgba(0,0,0,0.2)`
    }

    const hairShine = {
      position: 'absolute' as const,
      width: '30%',
      height: '20%',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
      borderRadius: '50%',
      top: '10%',
      left: '20%'
    }

    switch (hairStyle) {
      case 'hair-short':
        return (
          <div style={{
            ...baseStyle,
            width: 95 * scale,
            height: 45 * scale,
            top: 8 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: '55% 55% 35% 35%'
          }}>
            <div style={hairShine} />
          </div>
        )
      case 'hair-medium':
        return (
          <div style={{
            ...baseStyle,
            width: 105 * scale,
            height: 75 * scale,
            top: 3 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: '55% 55% 45% 45%'
          }}>
            <div style={hairShine} />
          </div>
        )
      case 'hair-long':
        return (
          <>
            <div style={{
              ...baseStyle,
              width: 105 * scale,
              height: 55 * scale,
              top: 3 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: '55% 55% 35% 35%'
            }}>
              <div style={hairShine} />
            </div>
            {/* Long flowing sides */}
            <motion.div
              style={{
                ...baseStyle,
                width: 28 * scale,
                height: 130 * scale,
                top: 28 * scale,
                left: 12 * scale,
                borderRadius: '30% 30% 60% 60%'
              }}
              animate={animate ? { rotate: [-2, 2, -2] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              style={{
                ...baseStyle,
                width: 28 * scale,
                height: 130 * scale,
                top: 28 * scale,
                right: 12 * scale,
                borderRadius: '30% 30% 60% 60%'
              }}
              animate={animate ? { rotate: [2, -2, 2] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )
      case 'hair-curly':
        return (
          <div style={{
            ...baseStyle,
            width: 115 * scale,
            height: 90 * scale,
            top: -2 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: '65% 65% 55% 55%',
            background: `radial-gradient(circle at 30% 30%, ${adjustBrightness(hairColor, 10)} 0%, ${hairColor} 50%, ${adjustBrightness(hairColor, -15)} 100%)`
          }}>
            <div style={hairShine} />
            {/* Curly texture dots */}
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 12 * scale,
                height: 12 * scale,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${adjustBrightness(hairColor, 15)} 0%, transparent 70%)`,
                top: `${20 + (i % 2) * 25}%`,
                left: `${10 + (i * 11)}%`
              }} />
            ))}
          </div>
        )
      case 'hair-ponytail':
        return (
          <>
            <div style={{
              ...baseStyle,
              width: 95 * scale,
              height: 50 * scale,
              top: 6 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: '55% 55% 35% 35%'
            }}>
              <div style={hairShine} />
            </div>
            {/* Bouncy ponytail */}
            <motion.div
              style={{
                ...baseStyle,
                width: 25 * scale,
                height: 70 * scale,
                top: 15 * scale,
                right: 2 * scale,
                borderRadius: '40% 40% 60% 60%',
                transformOrigin: 'top center'
              }}
              animate={animate ? { rotate: [15, 25, 15], scaleY: [1, 1.05, 1] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </>
        )
      case 'hair-pigtails':
        return (
          <>
            <div style={{
              ...baseStyle,
              width: 95 * scale,
              height: 50 * scale,
              top: 6 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: '55% 55% 35% 35%'
            }}>
              <div style={hairShine} />
            </div>
            {/* Bouncy pigtails */}
            <motion.div
              style={{
                ...baseStyle,
                width: 28 * scale,
                height: 85 * scale,
                top: 22 * scale,
                left: -8 * scale,
                borderRadius: '50%',
                transformOrigin: 'top center'
              }}
              animate={animate ? { rotate: [-5, 5, -5], y: [0, 3, 0] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
              style={{
                ...baseStyle,
                width: 28 * scale,
                height: 85 * scale,
                top: 22 * scale,
                right: -8 * scale,
                borderRadius: '50%',
                transformOrigin: 'top center'
              }}
              animate={animate ? { rotate: [5, -5, 5], y: [0, 3, 0] } : {}}
              transition={{ duration: 1, repeat: Infinity, delay: 0.15 }}
            />
          </>
        )
      case 'hair-bun':
        return (
          <>
            <div style={{
              ...baseStyle,
              width: 95 * scale,
              height: 45 * scale,
              top: 12 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              borderRadius: '55% 55% 35% 35%'
            }}>
              <div style={hairShine} />
            </div>
            {/* Cute bun */}
            <motion.div
              style={{
                ...baseStyle,
                width: 40 * scale,
                height: 40 * scale,
                top: -10 * scale,
                left: '50%',
                transform: 'translateX(-50%)',
                borderRadius: '50%'
              }}
              animate={animate ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </>
        )
      case 'hair-afro':
        return (
          <div style={{
            ...baseStyle,
            width: 140 * scale,
            height: 110 * scale,
            top: -18 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle at 40% 35%, ${adjustBrightness(hairColor, 15)} 0%, ${hairColor} 40%, ${adjustBrightness(hairColor, -20)} 100%)`
          }}>
            <div style={hairShine} />
            {/* Volume texture */}
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: (8 + Math.random() * 8) * scale,
                height: (8 + Math.random() * 8) * scale,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${adjustBrightness(hairColor, 20)} 0%, transparent 70%)`,
                top: `${15 + (i % 3) * 25}%`,
                left: `${5 + (i * 7.5)}%`,
                opacity: 0.6
              }} />
            ))}
          </div>
        )
      default:
        return (
          <div style={{
            ...baseStyle,
            width: 95 * scale,
            height: 45 * scale,
            top: 8 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: '55% 55% 35% 35%'
          }}>
            <div style={hairShine} />
          </div>
        )
    }
  }

  // Outfit colors and styles
  const getOutfitStyle = () => {
    const outfitStyles: Record<string, { top: string; bottom: string; accent?: string }> = {
      'outfit-casual': { top: '#4A90D9', bottom: '#2C5282', accent: '#63B3ED' },
      'outfit-dress': { top: '#E53E7E', bottom: '#E53E7E', accent: '#FBB6CE' },
      'outfit-sporty': { top: '#38A169', bottom: '#1A365D', accent: '#68D391' },
      'outfit-overalls': { top: '#DD6B20', bottom: '#DD6B20', accent: '#F6AD55' },
      'outfit-hoodie': { top: '#805AD5', bottom: '#2D3748', accent: '#B794F4' },
      'outfit-jumpsuit': { top: '#D69E2E', bottom: '#D69E2E', accent: '#F6E05E' },
      'outfit-tshirt-jeans': { top: '#F56565', bottom: '#3182CE', accent: '#FC8181' },
      'outfit-skirt-top': { top: '#9F7AEA', bottom: '#ED64A6', accent: '#D6BCFA' },
      'outfit-tropical': { top: '#48BB78', bottom: '#2B6CB0', accent: '#9AE6B4' },
      'outfit-adventurer': { top: '#975A16', bottom: '#744210', accent: '#D69E2E' },
      'outfit-explorer': { top: '#A0AEC0', bottom: '#4A5568', accent: '#CBD5E0' },
      'outfit-safari': { top: '#C4A35A', bottom: '#8B7355', accent: '#ECC94B' },
      'outfit-astronaut': { top: '#E2E8F0', bottom: '#E2E8F0', accent: '#90CDF4' },
      'outfit-starfleet': { top: '#1A365D', bottom: '#1A365D', accent: '#4299E1' },
      'outfit-mermaid': { top: '#38B2AC', bottom: '#319795', accent: '#81E6D9' },
      'outfit-pirate': { top: '#1A202C', bottom: '#1A202C', accent: '#F6AD55' },
      'outfit-fairy': { top: '#FBB6CE', bottom: '#F687B3', accent: '#FED7E2' },
      'outfit-princess': { top: '#D69E2E', bottom: '#F6E05E', accent: '#FEFCBF' }
    }
    return outfitStyles[outfit] || { top: '#4A90D9', bottom: '#2C5282', accent: '#63B3ED' }
  }

  const outfitColors = getOutfitStyle()

  // Pet emojis and animations
  const petEmojis: Record<string, { emoji: string; bounce: number }> = {
    'pet-parrot': { emoji: '🦜', bounce: 15 },
    'pet-monkey': { emoji: '🐒', bounce: 20 },
    'pet-turtle': { emoji: '🐢', bounce: 5 },
    'pet-crab': { emoji: '🦀', bounce: 8 },
    'pet-unicorn': { emoji: '🦄', bounce: 12 },
    'pet-dragon': { emoji: '🐲', bounce: 18 },
    'pet-babydino': { emoji: '🦕', bounce: 10 },
    'pet-alien': { emoji: '👽', bounce: 15 }
  }

  // Render celebration effects
  const renderCelebrationEffects = () => {
    if (!showEffects || currentEmotion !== 'celebrating') return null

    return (
      <AnimatePresence>
        {/* Confetti burst */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`confetti-${i}`}
            className="absolute"
            style={{
              left: '50%',
              bottom: '60%',
              fontSize: 16 * scale,
              zIndex: 100
            }}
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              x: Math.cos((i / 12) * Math.PI * 2) * 100 * scale,
              y: Math.sin((i / 12) * Math.PI * 2) * 80 * scale - 50,
              rotate: Math.random() * 720
            }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            {['⭐', '🌟', '✨', '💫', '🎉', '🎊'][i % 6]}
          </motion.div>
        ))}

        {/* Sparkle ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            left: '50%',
            top: '40%',
            width: 150 * scale,
            height: 150 * scale,
            transform: 'translate(-50%, -50%)',
            border: `3px solid gold`,
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
            zIndex: 50
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>
    )
  }

  // Render thinking effects
  const renderThinkingEffects = () => {
    if (!showEffects || currentEmotion !== 'thinking') return null

    return (
      <div className="absolute" style={{ top: -30 * scale, right: 0 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`thought-${i}`}
            className="absolute rounded-full bg-white/80"
            style={{
              width: (8 + i * 5) * scale,
              height: (8 + i * 5) * scale,
              right: i * 15 * scale,
              top: -i * 20 * scale,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            animate={{
              y: [0, -5, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
        <motion.div
          className="absolute bg-white rounded-2xl px-3 py-2 shadow-lg"
          style={{
            right: 35 * scale,
            top: -70 * scale,
            fontSize: 20 * scale
          }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🤔
        </motion.div>
      </div>
    )
  }

  // Render emotion-specific mouth
  const renderMouth = () => {
    const mouthWidth = 32 * scale

    if (currentEmotion === 'surprised') {
      // Open "O" mouth
      return (
        <motion.div
          className="absolute bg-gradient-to-b from-red-400 to-red-500 rounded-full"
          style={{
            bottom: 18 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 18 * scale,
            height: 20 * scale,
            boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.3)'
          }}
          animate={animate ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )
    }

    if (currentEmotion === 'celebrating' || currentEmotion === 'excited') {
      // Big happy open mouth
      return (
        <motion.div
          className="absolute overflow-hidden"
          style={{
            bottom: 14 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: mouthWidth,
            height: 18 * scale,
            background: 'linear-gradient(to bottom, #e85d75 0%, #d4627a 100%)',
            borderRadius: '0 0 50% 50%',
            boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.2)'
          }}
          animate={animate ? { scaleX: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          {/* Tongue */}
          <motion.div
            className="absolute rounded-full"
            style={{
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 12 * scale,
              height: 10 * scale,
              backgroundColor: '#ff9999',
            }}
            animate={{ y: [0, 2, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </motion.div>
      )
    }

    if (currentEmotion === 'sad') {
      // Frowny mouth
      return (
        <motion.div
          className="absolute"
          style={{
            bottom: 20 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 24 * scale,
            height: 10 * scale,
            borderTop: `${4 * scale}px solid #d4627a`,
            borderRadius: '50% 50% 0 0',
            borderLeft: `${2 * scale}px solid transparent`,
            borderRight: `${2 * scale}px solid transparent`
          }}
          animate={animate ? { y: [0, 1, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )
    }

    // Default smile
    return (
      <motion.div
        className="absolute"
        style={{
          bottom: 15 * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          width: mouthWidth,
          height: 16 * scale * config.mouthCurve,
          borderBottom: `${4 * scale}px solid #d4627a`,
          borderRadius: '0 0 50% 50%',
          borderLeft: `${3 * scale}px solid transparent`,
          borderRight: `${3 * scale}px solid transparent`
        }}
        animate={animate ? { scaleX: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
    )
  }

  return (
    <motion.div
      className="relative"
      style={{ width: s.width, height: s.height }}
      animate={animate ? { y: [0, -config.bodyBounce, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Celebration/Thinking effects */}
      {renderCelebrationEffects()}
      {renderThinkingEffects()}

      {/* Ground shadow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 85 * scale,
          height: 18 * scale,
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)'
        }}
        animate={animate ? { scaleX: [1, 1.1, 1], opacity: [0.3, 0.2, 0.3] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* LEGS */}
      <div
        className="absolute"
        style={{
          bottom: 15 * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 10 * scale
        }}
      >
        <motion.div
          style={{
            width: 28 * scale,
            height: 85 * scale,
            background: `linear-gradient(90deg, ${adjustBrightness(skinTone, -10)} 0%, ${skinTone} 50%, ${adjustBrightness(skinTone, -5)} 100%)`,
            borderRadius: `${8 * scale}px ${8 * scale}px ${16 * scale}px ${16 * scale}px`,
            boxShadow: `inset -4px 0 10px rgba(0,0,0,0.1),
                        0 4px 8px rgba(0,0,0,0.15)`
          }}
          animate={animate && currentEmotion === 'celebrating' ? { rotate: [-5, 5, -5] } : {}}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
        <motion.div
          style={{
            width: 28 * scale,
            height: 85 * scale,
            background: `linear-gradient(90deg, ${adjustBrightness(skinTone, -5)} 0%, ${skinTone} 50%, ${adjustBrightness(skinTone, -10)} 100%)`,
            borderRadius: `${8 * scale}px ${8 * scale}px ${16 * scale}px ${16 * scale}px`,
            boxShadow: `inset 4px 0 10px rgba(0,0,0,0.1),
                        0 4px 8px rgba(0,0,0,0.15)`
          }}
          animate={animate && currentEmotion === 'celebrating' ? { rotate: [5, -5, 5] } : {}}
          transition={{ duration: 0.3, repeat: Infinity, delay: 0.15 }}
        />
      </div>

      {/* OUTFIT - Pants/Skirt */}
      <div
        className="absolute"
        style={{
          bottom: 68 * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 75 * scale,
          height: 55 * scale,
          background: `linear-gradient(180deg, ${outfitColors.bottom} 0%, ${adjustBrightness(outfitColors.bottom, -15)} 100%)`,
          borderRadius: `${6 * scale}px ${6 * scale}px ${22 * scale}px ${22 * scale}px`,
          boxShadow: `inset 0 -8px 20px rgba(0,0,0,0.2),
                      0 4px 10px rgba(0,0,0,0.15)`
        }}
      />

      {/* BODY - Torso */}
      <div
        className="absolute"
        style={{
          bottom: 105 * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 80 * scale,
          height: 75 * scale,
          background: `linear-gradient(180deg, ${skinTone} 0%, ${adjustBrightness(skinTone, -8)} 100%)`,
          borderRadius: `${35 * scale}px ${35 * scale}px ${12 * scale}px ${12 * scale}px`,
          boxShadow: `inset -6px 0 18px rgba(0,0,0,0.1),
                      0 4px 12px rgba(0,0,0,0.12)`
        }}
      />

      {/* OUTFIT - Top/Shirt */}
      <div
        className="absolute overflow-hidden"
        style={{
          bottom: 110 * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 75 * scale,
          height: 65 * scale,
          background: `linear-gradient(180deg, ${outfitColors.top} 0%, ${adjustBrightness(outfitColors.top, -12)} 100%)`,
          borderRadius: `${28 * scale}px ${28 * scale}px ${6 * scale}px ${6 * scale}px`,
          boxShadow: `inset 0 -8px 20px rgba(0,0,0,0.2)`
        }}
      >
        {/* Collar/neckline */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 25 * scale,
            height: 15 * scale,
            background: skinTone,
            borderRadius: '0 0 50% 50%'
          }}
        />
        {/* Shirt highlight */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '10%',
            width: '30%',
            height: '40%',
            background: `linear-gradient(135deg, ${outfitColors.accent || 'rgba(255,255,255,0.2)'} 0%, transparent 100%)`,
            borderRadius: '50%',
            opacity: 0.3
          }}
        />
      </div>

      {/* ARMS */}
      <motion.div
        className="absolute"
        style={{
          bottom: 125 * scale,
          left: 8 * scale,
          width: 22 * scale,
          height: 60 * scale,
          background: `linear-gradient(90deg, ${adjustBrightness(skinTone, -8)} 0%, ${skinTone} 60%, ${adjustBrightness(skinTone, -5)} 100%)`,
          borderRadius: 12 * scale,
          transformOrigin: 'top center',
          boxShadow: 'inset -3px 0 8px rgba(0,0,0,0.1)'
        }}
        animate={animate ? {
          rotate: [-config.armSwing, config.armSwing, -config.armSwing],
          y: currentEmotion === 'celebrating' ? [0, -10, 0] : 0
        } : {}}
        transition={{
          duration: currentEmotion === 'celebrating' ? 0.3 : 1.5,
          repeat: Infinity
        }}
      />
      <motion.div
        className="absolute"
        style={{
          bottom: 125 * scale,
          right: 8 * scale,
          width: 22 * scale,
          height: 60 * scale,
          background: `linear-gradient(90deg, ${adjustBrightness(skinTone, -5)} 0%, ${skinTone} 40%, ${adjustBrightness(skinTone, -8)} 100%)`,
          borderRadius: 12 * scale,
          transformOrigin: 'top center',
          boxShadow: 'inset 3px 0 8px rgba(0,0,0,0.1)'
        }}
        animate={animate ? {
          rotate: [config.armSwing, -config.armSwing, config.armSwing],
          y: currentEmotion === 'celebrating' ? [0, -10, 0] : 0
        } : {}}
        transition={{
          duration: currentEmotion === 'celebrating' ? 0.3 : 1.5,
          repeat: Infinity,
          delay: 0.2
        }}
      />

      {/* HEAD */}
      <motion.div
        className="absolute"
        style={{
          bottom: 170 * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 85 * scale,
          height: 90 * scale,
          background: `radial-gradient(ellipse at 35% 30%, ${adjustBrightness(skinTone, 8)} 0%, ${skinTone} 50%, ${adjustBrightness(skinTone, -10)} 100%)`,
          borderRadius: '52% 52% 48% 48%',
          boxShadow: `
            inset -10px -10px 25px rgba(0,0,0,0.1),
            inset 10px 10px 25px rgba(255,255,255,0.15),
            0 8px 20px rgba(0,0,0,0.15)
          `
        }}
        animate={currentEmotion === 'thinking' ? { x: [0, 5, 0] } : {}}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {/* Cheeks (blush) - intensity based on emotion */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 18 * scale,
            height: 12 * scale,
            background: 'radial-gradient(ellipse, #FFB6C1 0%, transparent 70%)',
            left: 8 * scale,
            top: 52 * scale
          }}
          animate={{ opacity: config.blush }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 18 * scale,
            height: 12 * scale,
            background: 'radial-gradient(ellipse, #FFB6C1 0%, transparent 70%)',
            right: 8 * scale,
            top: 52 * scale
          }}
          animate={{ opacity: config.blush }}
        />

        {/* EYES - Expressive and big */}
        <div
          className="absolute flex"
          style={{
            top: 30 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            gap: 6 * scale
          }}
        >
          {/* Left eye */}
          <motion.div
            className="relative bg-white rounded-full overflow-hidden"
            style={{
              width: 26 * scale * config.eyeScale,
              height: 28 * scale * config.eyeScale,
              boxShadow: '0 4px 10px rgba(0,0,0,0.15), inset 0 2px 5px rgba(0,0,0,0.05)'
            }}
            animate={animate ? {
              scaleY: currentEmotion === 'sleepy'
                ? [0.3, 0.5, 0.3]
                : [1, 1, 0.1, 1, 1]
            } : {}}
            transition={{
              duration: currentEmotion === 'sleepy' ? 2 : 4,
              repeat: Infinity
            }}
          >
            {/* Iris with gradient */}
            <motion.div
              className="absolute rounded-full overflow-hidden"
              style={{
                width: 16 * scale,
                height: 16 * scale,
                background: `radial-gradient(circle at 30% 30%, ${adjustBrightness(eyeColor, 20)} 0%, ${eyeColor} 50%, ${adjustBrightness(eyeColor, -20)} 100%)`,
                top: '28%',
                left: '28%',
                boxShadow: `inset 0 ${-3 * scale}px ${6 * scale}px rgba(0,0,0,0.2)`
              }}
              animate={{
                x: config.pupilOffset.x * scale,
                y: config.pupilOffset.y * scale
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Pupil */}
              <div
                className="absolute bg-black rounded-full"
                style={{
                  width: 7 * scale,
                  height: 7 * scale,
                  top: '22%',
                  left: '22%'
                }}
              />
              {/* Main sparkle */}
              <motion.div
                className="absolute bg-white rounded-full"
                style={{
                  width: 6 * scale,
                  height: 6 * scale,
                  top: 2 * scale,
                  left: 2 * scale
                }}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              {/* Secondary sparkle */}
              <div
                className="absolute bg-white rounded-full"
                style={{
                  width: 3 * scale,
                  height: 3 * scale,
                  bottom: 3 * scale,
                  right: 3 * scale,
                  opacity: 0.6
                }}
              />
            </motion.div>
          </motion.div>

          {/* Right eye */}
          <motion.div
            className="relative bg-white rounded-full overflow-hidden"
            style={{
              width: 26 * scale * config.eyeScale,
              height: 28 * scale * config.eyeScale,
              boxShadow: '0 4px 10px rgba(0,0,0,0.15), inset 0 2px 5px rgba(0,0,0,0.05)'
            }}
            animate={animate ? {
              scaleY: currentEmotion === 'sleepy'
                ? [0.3, 0.5, 0.3]
                : [1, 1, 0.1, 1, 1]
            } : {}}
            transition={{
              duration: currentEmotion === 'sleepy' ? 2 : 4,
              repeat: Infinity,
              delay: 0.1
            }}
          >
            {/* Iris with gradient */}
            <motion.div
              className="absolute rounded-full overflow-hidden"
              style={{
                width: 16 * scale,
                height: 16 * scale,
                background: `radial-gradient(circle at 30% 30%, ${adjustBrightness(eyeColor, 20)} 0%, ${eyeColor} 50%, ${adjustBrightness(eyeColor, -20)} 100%)`,
                top: '28%',
                left: '28%',
                boxShadow: `inset 0 ${-3 * scale}px ${6 * scale}px rgba(0,0,0,0.2)`
              }}
              animate={{
                x: config.pupilOffset.x * scale,
                y: config.pupilOffset.y * scale
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Pupil */}
              <div
                className="absolute bg-black rounded-full"
                style={{
                  width: 7 * scale,
                  height: 7 * scale,
                  top: '22%',
                  left: '22%'
                }}
              />
              {/* Main sparkle */}
              <motion.div
                className="absolute bg-white rounded-full"
                style={{
                  width: 6 * scale,
                  height: 6 * scale,
                  top: 2 * scale,
                  left: 2 * scale
                }}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              {/* Secondary sparkle */}
              <div
                className="absolute bg-white rounded-full"
                style={{
                  width: 3 * scale,
                  height: 3 * scale,
                  bottom: 3 * scale,
                  right: 3 * scale,
                  opacity: 0.6
                }}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Eyebrows - expressive */}
        <motion.div
          className="absolute"
          style={{
            top: 24 * scale,
            left: '32%',
            width: 17 * scale,
            height: 4 * scale,
            backgroundColor: hairColor,
            borderRadius: '50%',
            opacity: 0.75,
            transformOrigin: 'center'
          }}
          animate={{
            rotate: -10 + config.eyebrowAngle,
            y: currentEmotion === 'surprised' ? -5 : 0
          }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className="absolute"
          style={{
            top: 24 * scale,
            right: '32%',
            width: 17 * scale,
            height: 4 * scale,
            backgroundColor: hairColor,
            borderRadius: '50%',
            opacity: 0.75,
            transformOrigin: 'center'
          }}
          animate={{
            rotate: 10 - config.eyebrowAngle,
            y: currentEmotion === 'surprised' ? -5 : 0
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Nose - subtle */}
        <div
          className="absolute"
          style={{
            bottom: 28 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 8 * scale,
            height: 6 * scale,
            background: `radial-gradient(ellipse, ${adjustBrightness(skinTone, -15)} 0%, transparent 70%)`,
            borderRadius: '50%'
          }}
        />

        {/* MOUTH - Emotion-based */}
        {renderMouth()}
      </motion.div>

      {/* HAIR - On top of head */}
      <div className="absolute" style={{ bottom: 170 * scale, left: '50%', transform: 'translateX(-50%)', width: 85 * scale }}>
        {renderHair()}
      </div>

      {/* ACCESSORIES */}
      {accessories.includes('acc-glasses') && (
        <div
          className="absolute"
          style={{
            bottom: 210 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 28 * scale
          }}
        >
          👓
        </div>
      )}
      {accessories.includes('acc-bow') && (
        <motion.div
          className="absolute"
          style={{
            bottom: 255 * scale,
            right: 65 * scale,
            fontSize: 24 * scale
          }}
          animate={{ rotate: [-8, 8, -8], scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🎀
        </motion.div>
      )}
      {(accessories.includes('acc-crown') || accessories.includes('acc-star-crown')) && (
        <motion.div
          className="absolute"
          style={{
            bottom: 270 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 32 * scale
          }}
          animate={{ y: [-3, 3, -3], rotate: [-2, 2, -2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          👑
        </motion.div>
      )}
      {accessories.includes('acc-flower') && (
        <motion.div
          className="absolute"
          style={{
            bottom: 250 * scale,
            left: 62 * scale,
            fontSize: 22 * scale
          }}
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🌺
        </motion.div>
      )}

      {/* PET */}
      {petBuddy && petBuddy !== 'pet-none' && petEmojis[petBuddy] && (
        <motion.div
          className="absolute"
          style={{
            bottom: 35 * scale,
            right: -25 * scale,
            fontSize: 45 * scale
          }}
          animate={{
            y: [0, -petEmojis[petBuddy].bounce, 0],
            rotate: [-8, 8, -8],
            scale: currentEmotion === 'celebrating' ? [1, 1.2, 1] : 1
          }}
          transition={{
            duration: currentEmotion === 'celebrating' ? 0.5 : 1.8,
            repeat: Infinity
          }}
        >
          {petEmojis[petBuddy].emoji}
        </motion.div>
      )}
    </motion.div>
  )
}

// Utility function to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}
