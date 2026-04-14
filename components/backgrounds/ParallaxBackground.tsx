'use client'

import { motion } from 'motion/react'
import { useRef, useMemo } from 'react'
import {
  AnimatedSun,
  AnimatedCloud,
  PalmTree,
  Vine,
  TropicalFlower,
  Butterfly,
  Parrot,
  GrassGround,
  Mountains,
  Sparkle
} from './SVGElements'

export type WorldTheme = 'jungle' | 'space' | 'ocean' | 'fairy' | 'dino' | 'candy' | 'welcome'

interface ParallaxBackgroundProps {
  theme?: WorldTheme
  intensity?: 'subtle' | 'medium' | 'intense'
  children?: React.ReactNode
}

// Theme configurations
const themeConfigs: Record<WorldTheme, {
  skyGradient: string[]
  groundColor: string
  accentColor: string
  particles: string[]
}> = {
  welcome: {
    skyGradient: ['#87CEEB', '#98FB98', '#228B22'],
    groundColor: '#4CAF50',
    accentColor: '#FFD700',
    particles: ['🌴', '🦜', '🌺', '🦋', '⭐', '🌸']
  },
  jungle: {
    skyGradient: ['#87CEEB', '#90EE90', '#228B22'],
    groundColor: '#2E7D32',
    accentColor: '#FFD700',
    particles: ['🌴', '🦜', '🐒', '🌺', '🦋', '🍃', '🐸']
  },
  space: {
    skyGradient: ['#0D0D1A', '#1A1A2E', '#2D2D5E'],
    groundColor: '#1A1A2E',
    accentColor: '#7B68EE',
    particles: ['⭐', '🌟', '🚀', '🛸', '🌙', '💫', '✨']
  },
  ocean: {
    skyGradient: ['#87CEEB', '#00CED1', '#006994'],
    groundColor: '#006994',
    accentColor: '#40E0D0',
    particles: ['🐠', '🐙', '🦀', '🐚', '🌊', '🐬', '🪸']
  },
  fairy: {
    skyGradient: ['#FFB6C1', '#DDA0DD', '#9B59B6'],
    groundColor: '#9B59B6',
    accentColor: '#FFD700',
    particles: ['🧚', '🦋', '🌸', '✨', '🌈', '💖', '🦄']
  },
  dino: {
    skyGradient: ['#FF6B35', '#CD853F', '#8B4513'],
    groundColor: '#8B4513',
    accentColor: '#FF6B35',
    particles: ['🦕', '🦖', '🌋', '🥚', '🦴', '🪨', '🌿']
  },
  candy: {
    skyGradient: ['#FFB6C1', '#FF69B4', '#FF1493'],
    groundColor: '#FF69B4',
    accentColor: '#00BFFF',
    particles: ['🍭', '🍬', '🧁', '🍩', '🍪', '🌈', '🍫']
  }
}

export function ParallaxBackground({
  theme = 'welcome',
  intensity = 'medium',
  children
}: ParallaxBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const config = themeConfigs[theme]

  const intensityMultiplier = {
    subtle: 0.5,
    medium: 1,
    intense: 1.5
  }[intensity]

  // Generate floating particles
  const floatingParticles = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      emoji: config.particles[Math.floor(Math.random() * config.particles.length)],
      x: Math.random() * 100,
      y: Math.random() * 80 + 10,
      size: 20 + Math.random() * 25,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 5,
      direction: Math.random() > 0.5 ? 1 : -1
    }))
  }, [theme])

  // Generate sparkles
  const sparkles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      size: 12 + Math.random() * 16
    }))
  }, [])

  // Generate space stars (stable across renders)
  const spaceStars = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: (i * 37 + 13) % 100, // deterministic spread
      y: (i * 23 + 7) % 70,
      size: 2 + (i % 3),
      duration: 2 + (i % 4),
      delay: (i * 0.3) % 2,
    }))
  }, [])

  const isWelcomeOrJungle = theme === 'welcome' || theme === 'jungle'
  const isSpace = theme === 'space'
  const isFairy = theme === 'fairy'

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${config.skyGradient.join(', ')})`
      }}
    >
      {/* Layer 1: Sky elements (furthest back) */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Sun for day themes */}
        {isWelcomeOrJungle && (
          <motion.div
            className="absolute"
            style={{ top: '5%', right: '10%' }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <AnimatedSun size={120 * intensityMultiplier} />
          </motion.div>
        )}

        {/* Stars for space theme */}
        {isSpace && (
          <>
            {spaceStars.map((star) => (
              <div
                key={`star-${star.id}`}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: star.size,
                  height: star.size,
                  animation: `sparkle-pulse ${star.duration}s ease-in-out infinite`,
                  animationDelay: `${star.delay}s`,
                }}
              />
            ))}
            {/* Shooting stars */}
            <motion.div
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: '20%',
                left: '-5%',
                boxShadow: '0 0 10px 2px white, -30px 0 20px white, -60px 0 15px white'
              }}
              animate={{
                x: ['0%', '120vw'],
                y: ['0%', '30%'],
                opacity: [0, 1, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 8,
                ease: 'easeIn'
              }}
            />
          </>
        )}

        {/* Clouds for most themes */}
        {!isSpace && (
          <>
            <motion.div
              className="absolute"
              style={{ top: '8%', left: '5%' }}
              animate={{ x: [0, 50, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <AnimatedCloud size={180 * intensityMultiplier} variant={1} />
            </motion.div>
            <motion.div
              className="absolute"
              style={{ top: '15%', right: '15%' }}
              animate={{ x: [0, -30, 0] }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            >
              <AnimatedCloud size={140 * intensityMultiplier} variant={2} />
            </motion.div>
            <motion.div
              className="absolute"
              style={{ top: '5%', left: '40%' }}
              animate={{ x: [0, 40, 0] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            >
              <AnimatedCloud size={160 * intensityMultiplier} variant={3} />
            </motion.div>
          </>
        )}
      </div>

      {/* Layer 2: Mid-ground decorations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Mountains for certain themes */}
        {(theme === 'jungle' || theme === 'welcome' || theme === 'dino') && (
          <div className="absolute bottom-0 left-0 right-0 opacity-40">
            <Mountains />
          </div>
        )}

        {/* Floating particles (CSS-animated for GPU performance) */}
        {floatingParticles.map((particle) => (
          <div
            key={`particle-${particle.id}`}
            className="absolute pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              fontSize: particle.size,
              animation: `float-${['gentle', 'drift', 'sway'][particle.id % 3]} ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
              willChange: 'transform',
            }}
          >
            {particle.emoji}
          </div>
        ))}

        {/* Butterflies for jungle/fairy themes */}
        {(isWelcomeOrJungle || isFairy) && (
          <>
            <motion.div
              className="absolute"
              style={{ left: '15%', top: '30%' }}
              animate={{
                x: [0, 100, 200, 150, 0],
                y: [0, -50, 0, 50, 0]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Butterfly size={35 * intensityMultiplier} color={isFairy ? '#E91E63' : '#FF6B6B'} />
            </motion.div>
            <motion.div
              className="absolute"
              style={{ right: '20%', top: '40%' }}
              animate={{
                x: [0, -80, -160, -100, 0],
                y: [0, 40, 0, -40, 0]
              }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            >
              <Butterfly size={28 * intensityMultiplier} color={isFairy ? '#9C27B0' : '#4CAF50'} />
            </motion.div>
          </>
        )}

        {/* Parrot for jungle */}
        {isWelcomeOrJungle && (
          <motion.div
            className="absolute"
            style={{ right: '10%', top: '25%' }}
            animate={{
              x: [0, -30, 0],
              y: [0, -15, 0],
              rotate: [-5, 5, -5]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Parrot size={70 * intensityMultiplier} />
          </motion.div>
        )}
      </div>

      {/* Layer 3: Foreground elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Palm trees for jungle */}
        {isWelcomeOrJungle && (
          <>
            <motion.div
              className="absolute bottom-0 left-0"
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: 'bottom center' }}
            >
              <PalmTree size={250 * intensityMultiplier} />
            </motion.div>
            <motion.div
              className="absolute bottom-0 right-0"
              style={{ transform: 'scaleX(-1)' }}
              animate={{ rotate: [2, -2, 2] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <PalmTree size={220 * intensityMultiplier} />
            </motion.div>
          </>
        )}

        {/* Vines for jungle */}
        {isWelcomeOrJungle && (
          <>
            <div className="absolute top-0 left-0">
              <Vine height={350 * intensityMultiplier} side="left" />
            </div>
            <div className="absolute top-0 right-0">
              <Vine height={300 * intensityMultiplier} side="right" />
            </div>
          </>
        )}

        {/* Flowers for jungle/fairy */}
        {(isWelcomeOrJungle || isFairy) && (
          <>
            <motion.div
              className="absolute"
              style={{ bottom: '15%', left: '10%' }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <TropicalFlower size={50 * intensityMultiplier} color={isFairy ? '#E91E63' : '#FF6B6B'} />
            </motion.div>
            <motion.div
              className="absolute"
              style={{ bottom: '20%', right: '12%' }}
              animate={{ rotate: [0, -360] }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            >
              <TropicalFlower size={40 * intensityMultiplier} color={isFairy ? '#9C27B0' : '#FFC107'} />
            </motion.div>
            <motion.div
              className="absolute"
              style={{ bottom: '25%', left: '25%' }}
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <TropicalFlower size={35 * intensityMultiplier} color="#FF69B4" />
            </motion.div>
          </>
        )}

        {/* Sparkles for fairy/candy themes (CSS-animated) */}
        {(isFairy || theme === 'candy') && (
          <>
            {sparkles.map((sparkle) => (
              <div
                key={`sparkle-${sparkle.id}`}
                className="absolute"
                style={{
                  left: `${sparkle.x}%`,
                  top: `${sparkle.y}%`,
                  animation: `sparkle-pulse 2s ease-in-out infinite`,
                  animationDelay: `${sparkle.delay}s`,
                  willChange: 'transform, opacity',
                }}
              >
                <Sparkle size={sparkle.size * intensityMultiplier} color={config.accentColor} />
              </div>
            ))}
          </>
        )}

        {/* Ground layer */}
        {!isSpace && (
          <div className="absolute bottom-0 left-0 right-0">
            <GrassGround />
          </div>
        )}
      </div>

      {/* Layer 4: Gradient overlays for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 100%, ${config.groundColor}40 0%, transparent 50%),
            radial-gradient(ellipse at 0% 50%, ${config.skyGradient[0]}30 0%, transparent 30%),
            radial-gradient(ellipse at 100% 50%, ${config.skyGradient[0]}30 0%, transparent 30%)
          `
        }}
      />

      {/* Subtle ambient glow (static, zero GPU cost) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 30%, ${config.accentColor}15 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, ${config.skyGradient[1]}10 0%, transparent 40%)
          `
        }}
      />

      {/* Content container */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  )
}
