'use client'

import { motion } from 'motion/react'
import { useMemo } from 'react'

interface AnimatedBackgroundProps {
  worldId: string
  colors: {
    background: string
    primary: string
    secondary: string
  }
}

// World-specific floating objects
const WORLD_OBJECTS: Record<string, string[]> = {
  lovelycat: ['🐱', '😺', '🐈', '🎀', '💗', '🌸', '🧶', '🐾', '💖', '✨', '☁️', '⭐', '🎀', '💕'],
  jungle: ['🌴', '🦜', '🐒', '🌺', '🦋', '🍃', '🌿', '🐸', '🦎', '🌻'],
  space: ['🚀', '🌟', '⭐', '🛸', '🌙', '☄️', '🪐', '💫', '✨', '👽'],
  ocean: ['🐠', '🐙', '🦀', '🐚', '🌊', '🐬', '🐡', '🦈', '🐋', '🪸'],
  fairy: ['🧚', '🦋', '🌸', '✨', '🌈', '💖', '🌺', '🎀', '🦄', '💫'],
  dino: ['🦕', '🦖', '🌋', '🥚', '🦴', '🌿', '🪨', '☄️', '🔥', '🌴'],
  candy: ['🍭', '🍬', '🧁', '🍩', '🍪', '🎂', '🍫', '🍰', '🍡', '🌈']
}

export function AnimatedBackground({ worldId, colors }: AnimatedBackgroundProps) {
  // Generate random floating objects
  const floatingObjects = useMemo(() => {
    const objects = WORLD_OBJECTS[worldId] || WORLD_OBJECTS.jungle
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      emoji: objects[Math.floor(Math.random() * objects.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 20 + Math.random() * 30,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 10,
      direction: Math.random() > 0.5 ? 1 : -1
    }))
  }, [worldId])

  // Generate sparkle particles
  const sparkles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      size: 8 + Math.random() * 12
    }))
  }, [])

  // Generate floating bubbles/clouds
  const bubbles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 40 + Math.random() * 80,
      delay: Math.random() * 8,
      duration: 15 + Math.random() * 10
    }))
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${colors.background} 0%, ${colors.primary}40 50%, ${colors.secondary}30 100%)`
        }}
      />

      {/* Animated wave at bottom */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ height: '15vh' }}
      >
        <motion.path
          fill={colors.primary}
          fillOpacity="0.3"
          d="M0,60 C360,100 720,20 1080,60 C1260,80 1380,40 1440,60 L1440,120 L0,120 Z"
          initial={{ d: 'M0,60 C360,100 720,20 1080,60 C1260,80 1380,40 1440,60 L1440,120 L0,120 Z' }}
          animate={{
            d: [
              'M0,60 C360,100 720,20 1080,60 C1260,80 1380,40 1440,60 L1440,120 L0,120 Z',
              'M0,60 C360,20 720,100 1080,60 C1260,40 1380,80 1440,60 L1440,120 L0,120 Z',
              'M0,60 C360,100 720,20 1080,60 C1260,80 1380,40 1440,60 L1440,120 L0,120 Z'
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          fill={colors.secondary}
          fillOpacity="0.2"
          d="M0,80 C240,40 480,100 720,80 C960,60 1200,100 1440,80 L1440,120 L0,120 Z"
          initial={{ d: 'M0,80 C240,40 480,100 720,80 C960,60 1200,100 1440,80 L1440,120 L0,120 Z' }}
          animate={{
            d: [
              'M0,80 C240,40 480,100 720,80 C960,60 1200,100 1440,80 L1440,120 L0,120 Z',
              'M0,80 C240,100 480,40 720,80 C960,100 1200,60 1440,80 L1440,120 L0,120 Z',
              'M0,80 C240,40 480,100 720,80 C960,60 1200,100 1440,80 L1440,120 L0,120 Z'
            ]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </svg>

      {/* Floating bubbles/clouds in background */}
      {bubbles.map((bubble) => (
        <motion.div
          key={`bubble-${bubble.id}`}
          className="absolute rounded-full"
          style={{
            left: `${bubble.x}%`,
            bottom: '-10%',
            width: bubble.size,
            height: bubble.size,
            background: `radial-gradient(circle at 30% 30%, ${colors.primary}40, ${colors.secondary}20)`,
            filter: 'blur(2px)'
          }}
          animate={{
            y: [0, -window.innerHeight - 200],
            x: [0, Math.sin(bubble.id) * 100],
            opacity: [0, 0.6, 0.6, 0]
          }}
          transition={{
            duration: bubble.duration,
            repeat: Infinity,
            delay: bubble.delay,
            ease: 'linear'
          }}
        />
      ))}

      {/* Floating world objects */}
      {floatingObjects.map((obj) => (
        <motion.div
          key={`obj-${obj.id}`}
          className="absolute"
          style={{
            left: `${obj.x}%`,
            top: `${obj.y}%`,
            fontSize: obj.size
          }}
          animate={{
            y: [0, -30 * obj.direction, 0, 30 * obj.direction, 0],
            x: [0, 20 * obj.direction, 0, -20 * obj.direction, 0],
            rotate: [0, 10 * obj.direction, 0, -10 * obj.direction, 0],
            scale: [1, 1.1, 1, 0.9, 1]
          }}
          transition={{
            duration: obj.duration,
            repeat: Infinity,
            delay: obj.delay,
            ease: 'easeInOut'
          }}
        >
          {obj.emoji}
        </motion.div>
      ))}

      {/* Sparkle particles */}
      {sparkles.map((sparkle) => (
        <motion.div
          key={`sparkle-${sparkle.id}`}
          className="absolute"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            fontSize: sparkle.size
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: sparkle.delay,
            ease: 'easeInOut'
          }}
        >
          ✨
        </motion.div>
      ))}

      {/* Moving gradient orbs */}
      <motion.div
        className="absolute w-64 h-64 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${colors.primary}, transparent)`,
          filter: 'blur(40px)',
          top: '10%',
          left: '10%'
        }}
        animate={{
          x: [0, 100, 0, -50, 0],
          y: [0, 50, 100, 50, 0],
          scale: [1, 1.2, 1, 0.8, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full opacity-15"
        style={{
          background: `radial-gradient(circle, ${colors.secondary}, transparent)`,
          filter: 'blur(30px)',
          bottom: '20%',
          right: '15%'
        }}
        animate={{
          x: [0, -80, 0, 60, 0],
          y: [0, -60, -100, -40, 0],
          scale: [1, 0.8, 1.1, 0.9, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
    </div>
  )
}
