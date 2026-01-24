'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useCharacterStore } from '@/lib/stores/characterStore'
import { useEffect, useState } from 'react'

interface Avatar3DProps {
  size?: 'small' | 'medium' | 'large' | 'hero'
  state?: 'idle' | 'happy' | 'celebrate' | 'thinking' | 'sad' | 'teaching' | 'wave'
  showPet?: boolean
  showName?: boolean
}

export function Avatar3D({
  size = 'medium',
  state = 'idle',
  showPet = true,
  showName = false
}: Avatar3DProps) {
  const {
    skinTone,
    hairStyle,
    hairColor,
    petBuddy,
    characterName,
    accessories
  } = useCharacterStore()

  const [particles, setParticles] = useState<number[]>([])

  // Celebration particles
  useEffect(() => {
    if (state === 'celebrate' || state === 'happy') {
      setParticles([1, 2, 3, 4, 5, 6, 7, 8])
      const timer = setTimeout(() => setParticles([]), 2000)
      return () => clearTimeout(timer)
    }
  }, [state])

  const sizes = {
    small: { container: 'w-20 h-24', head: 48, body: 'h-12', eye: 8, mouth: 12 },
    medium: { container: 'w-32 h-40', head: 80, body: 'h-20', eye: 12, mouth: 18 },
    large: { container: 'w-48 h-56', head: 120, body: 'h-28', eye: 16, mouth: 24 },
    hero: { container: 'w-64 h-72', head: 160, body: 'h-36', eye: 20, mouth: 30 }
  }

  const s = sizes[size]

  // Hair styles as CSS
  const hairStyles: Record<string, React.CSSProperties> = {
    'hair-short': { borderRadius: '50% 50% 40% 40%', height: '30%', top: '-5%' },
    'hair-medium': { borderRadius: '50% 50% 30% 30%', height: '45%', top: '-10%' },
    'hair-long': { borderRadius: '40% 40% 20% 20%', height: '80%', top: '-15%', width: '120%', left: '-10%' },
    'hair-curly': { borderRadius: '60% 60% 50% 50%', height: '50%', top: '-12%' },
    'hair-ponytail': { borderRadius: '50%', height: '35%', top: '-8%' },
    'hair-pigtails': { borderRadius: '50%', height: '35%', top: '-8%' }
  }

  const petEmojis: Record<string, string> = {
    'pet-parrot': '🦜',
    'pet-monkey': '🐒',
    'pet-turtle': '🐢',
    'pet-crab': '🦀',
    'pet-unicorn': '🦄',
    'pet-dragon': '🐲',
    'pet-babydino': '🦕',
    'pet-seahorse': '🐴',
    'pet-alien': '👽',
    'pet-gummybear': '🧸',
    'pet-phoenix': '🔥'
  }

  const accessoryEmojis: Record<string, string> = {
    'acc-glasses': '👓',
    'acc-sunglasses': '🕶️',
    'acc-bow': '🎀',
    'acc-crown': '👑',
    'acc-star-crown': '👑',
    'acc-cap': '🧢',
    'acc-flower': '🌺'
  }

  // Animation variants based on state
  const bodyAnimation: Record<string, { y?: number[]; rotate?: number[]; scale?: number[]; transition: object }> = {
    idle: {
      y: [0, -4, 0],
      transition: { duration: 2, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }
    },
    happy: {
      y: [0, -15, 0],
      rotate: [-3, 3, -3],
      transition: { duration: 0.4, repeat: 3 }
    },
    celebrate: {
      y: [0, -25, 0, -20, 0],
      rotate: [-5, 5, -5, 5, 0],
      scale: [1, 1.1, 1, 1.1, 1],
      transition: { duration: 0.8, repeat: 2 }
    },
    thinking: {
      rotate: [-5, 5],
      transition: { duration: 1.5, repeat: Infinity, repeatType: 'reverse' }
    },
    sad: {
      y: [0, 2, 0],
      transition: { duration: 1, repeat: Infinity }
    },
    teaching: {
      y: [0, -5, 0],
      rotate: [0, 3, 0, -3, 0],
      transition: { duration: 1.5, repeat: Infinity }
    },
    wave: {
      rotate: [-10, 10, -10],
      transition: { duration: 0.5, repeat: 3 }
    }
  }

  const eyeAnimation = {
    idle: { scale: [1, 1, 0.1, 1] },
    happy: { scale: [1, 1.2, 1] },
    celebrate: { scale: [1, 1.3, 1], y: [-2, 2, -2] },
    thinking: { x: [-2, 2, -2], scale: 1 },
    sad: { y: [0, 3, 0], scale: 0.9 },
    teaching: { scale: [1, 1.1, 1] },
    wave: { scale: 1 }
  }

  const mouthShapes = {
    idle: '😊',
    happy: '😄',
    celebrate: '🤩',
    thinking: '🤔',
    sad: '😢',
    teaching: '😃',
    wave: '😊'
  }

  return (
    <div className={`relative ${s.container} flex flex-col items-center justify-end`}>
      {/* Celebration particles - pointer-events-none so they don't block clicks */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p}
            className="absolute text-2xl z-20 pointer-events-none"
            style={{
              left: `${20 + Math.random() * 60}%`,
              bottom: '50%'
            }}
            initial={{ opacity: 1, y: 0, scale: 0 }}
            animate={{
              opacity: [1, 1, 0],
              y: [-50, -100, -150],
              scale: [0, 1.2, 0.5],
              x: Math.random() > 0.5 ? [0, 20, 40] : [0, -20, -40],
              rotate: [0, 180, 360]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, delay: p * 0.1 }}
          >
            {['⭐', '🌟', '✨', '💫', '🎉', '🎊', '💖', '🌈'][p % 8]}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Character body container */}
      <motion.div
        className="relative flex flex-col items-center"
        animate={bodyAnimation[state]}
      >
        {/* Hair (behind head) */}
        <div
          className="absolute z-0"
          style={{
            width: s.head,
            height: s.head * 0.6,
            backgroundColor: hairColor,
            ...hairStyles[hairStyle] || hairStyles['hair-short'],
            boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.1)'
          }}
        />

        {/* Head */}
        <motion.div
          className="relative z-10 rounded-full shadow-lg"
          style={{
            width: s.head,
            height: s.head,
            backgroundColor: skinTone,
            boxShadow: `
              inset -8px -8px 20px rgba(0,0,0,0.15),
              inset 8px 8px 20px rgba(255,255,255,0.3),
              0 8px 20px rgba(0,0,0,0.2)
            `
          }}
        >
          {/* Cheeks (blush) */}
          <div
            className="absolute rounded-full opacity-40"
            style={{
              width: s.head * 0.2,
              height: s.head * 0.12,
              backgroundColor: '#ffb6c1',
              left: '10%',
              top: '55%'
            }}
          />
          <div
            className="absolute rounded-full opacity-40"
            style={{
              width: s.head * 0.2,
              height: s.head * 0.12,
              backgroundColor: '#ffb6c1',
              right: '10%',
              top: '55%'
            }}
          />

          {/* Eyes container */}
          <div
            className="absolute flex justify-center gap-4"
            style={{ top: '35%', left: '50%', transform: 'translateX(-50%)' }}
          >
            {/* Left eye */}
            <motion.div
              className="relative bg-white rounded-full shadow-inner"
              style={{ width: s.eye * 2, height: s.eye * 2 }}
              animate={eyeAnimation[state]}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Pupil */}
              <motion.div
                className="absolute bg-gray-900 rounded-full"
                style={{
                  width: s.eye,
                  height: s.eye,
                  top: '25%',
                  left: '25%'
                }}
                animate={state === 'thinking' ? { x: [-3, 3] } : {}}
                transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
              >
                {/* Eye sparkle */}
                <div
                  className="absolute bg-white rounded-full"
                  style={{
                    width: s.eye * 0.4,
                    height: s.eye * 0.4,
                    top: '15%',
                    left: '15%'
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Right eye */}
            <motion.div
              className="relative bg-white rounded-full shadow-inner"
              style={{ width: s.eye * 2, height: s.eye * 2 }}
              animate={eyeAnimation[state]}
              transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
            >
              <motion.div
                className="absolute bg-gray-900 rounded-full"
                style={{
                  width: s.eye,
                  height: s.eye,
                  top: '25%',
                  left: '25%'
                }}
                animate={state === 'thinking' ? { x: [-3, 3] } : {}}
                transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
              >
                <div
                  className="absolute bg-white rounded-full"
                  style={{
                    width: s.eye * 0.4,
                    height: s.eye * 0.4,
                    top: '15%',
                    left: '15%'
                  }}
                />
              </motion.div>
            </motion.div>
          </div>

          {/* Mouth */}
          <motion.div
            className="absolute flex items-center justify-center"
            style={{
              bottom: '18%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: s.mouth
            }}
            animate={
              state === 'celebrate'
                ? { scale: [1, 1.3, 1], rotate: [0, 5, -5, 0] }
                : state === 'happy'
                ? { scale: [1, 1.2, 1] }
                : {}
            }
            transition={{ duration: 0.5, repeat: state === 'celebrate' ? 3 : 0 }}
          >
            {state === 'idle' && (
              <div
                className="rounded-b-full bg-pink-400"
                style={{
                  width: s.mouth,
                  height: s.mouth * 0.4,
                  borderTop: '2px solid #d4627a'
                }}
              />
            )}
            {state === 'happy' && (
              <div
                className="rounded-b-full bg-pink-400"
                style={{
                  width: s.mouth * 1.3,
                  height: s.mouth * 0.6,
                  borderTop: '2px solid #d4627a'
                }}
              />
            )}
            {state === 'celebrate' && (
              <div
                className="rounded-full bg-pink-400"
                style={{
                  width: s.mouth * 1.5,
                  height: s.mouth,
                  borderTop: '2px solid #d4627a'
                }}
              />
            )}
            {state === 'sad' && (
              <div
                className="rounded-t-full bg-pink-300"
                style={{
                  width: s.mouth,
                  height: s.mouth * 0.3,
                  marginTop: s.mouth * 0.3
                }}
              />
            )}
            {(state === 'thinking' || state === 'teaching') && (
              <div
                className="rounded-full bg-pink-400"
                style={{
                  width: s.mouth * 0.6,
                  height: s.mouth * 0.6
                }}
              />
            )}
          </motion.div>

          {/* Accessories on head */}
          {accessories.includes('acc-bow') && (
            <motion.span
              className="absolute text-2xl"
              style={{ top: '-10%', right: '10%' }}
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🎀
            </motion.span>
          )}
          {accessories.includes('acc-crown') || accessories.includes('acc-star-crown') ? (
            <motion.span
              className="absolute text-2xl"
              style={{ top: '-15%', left: '50%', transform: 'translateX(-50%)' }}
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              👑
            </motion.span>
          ) : null}
        </motion.div>

        {/* Body */}
        <div
          className={`relative ${s.body} rounded-b-3xl -mt-2 z-0`}
          style={{
            width: s.head * 0.8,
            background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}
        >
          {/* Arms for wave/celebrate */}
          {(state === 'wave' || state === 'celebrate') && (
            <motion.div
              className="absolute bg-current rounded-full"
              style={{
                width: s.head * 0.15,
                height: s.head * 0.4,
                backgroundColor: skinTone,
                right: '-20%',
                top: '10%',
                transformOrigin: 'bottom'
              }}
              animate={{ rotate: [0, -45, 0, -45, 0] }}
              transition={{ duration: 0.5, repeat: state === 'celebrate' ? 4 : 2 }}
            />
          )}
        </div>
      </motion.div>

      {/* Pet buddy */}
      {showPet && petBuddy && petBuddy !== 'pet-none' && (
        <motion.div
          className="absolute bottom-0 -right-2 text-3xl z-20"
          animate={{
            y: [0, -8, 0],
            rotate: state === 'celebrate' ? [0, 15, -15, 0] : [0, 5, 0]
          }}
          transition={{
            duration: state === 'celebrate' ? 0.5 : 1.5,
            repeat: Infinity
          }}
        >
          {petEmojis[petBuddy] || '🐾'}
        </motion.div>
      )}

      {/* Character name */}
      {showName && characterName && (
        <motion.div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-1 rounded-full shadow-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="font-bold text-purple-600">{characterName}</span>
        </motion.div>
      )}
    </div>
  )
}
