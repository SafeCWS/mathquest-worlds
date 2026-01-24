'use client'

import { motion } from 'motion/react'

// Animated Sun with rays
export function AnimatedSun({ size = 100, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
    >
      {/* Sun rays */}
      {[...Array(12)].map((_, i) => (
        <motion.line
          key={i}
          x1="50"
          y1="10"
          x2="50"
          y2="20"
          stroke="#FFD93D"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${i * 30} 50 50)`}
          animate={{ opacity: [0.5, 1, 0.5], strokeWidth: [2, 4, 2] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
      {/* Sun body */}
      <defs>
        <radialGradient id="sunGradient" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#FFF176" />
          <stop offset="50%" stopColor="#FFD93D" />
          <stop offset="100%" stopColor="#FFA726" />
        </radialGradient>
        <filter id="sunGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.circle
        cx="50"
        cy="50"
        r="25"
        fill="url(#sunGradient)"
        filter="url(#sunGlow)"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      {/* Happy face */}
      <circle cx="42" cy="47" r="3" fill="#FF8C00" />
      <circle cx="58" cy="47" r="3" fill="#FF8C00" />
      <path
        d="M 40 55 Q 50 65 60 55"
        stroke="#FF8C00"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </motion.svg>
  )
}

// Fluffy Cloud
export function AnimatedCloud({ size = 120, variant = 1, className = '' }: { size?: number; variant?: 1 | 2 | 3; className?: string }) {
  const clouds = {
    1: (
      <g>
        <ellipse cx="45" cy="50" rx="30" ry="20" fill="white" />
        <ellipse cx="70" cy="55" rx="25" ry="18" fill="white" />
        <ellipse cx="30" cy="55" rx="20" ry="15" fill="white" />
        <ellipse cx="55" cy="45" rx="22" ry="18" fill="white" />
      </g>
    ),
    2: (
      <g>
        <ellipse cx="50" cy="55" rx="35" ry="22" fill="white" />
        <ellipse cx="25" cy="55" rx="18" ry="14" fill="white" />
        <ellipse cx="75" cy="55" rx="20" ry="15" fill="white" />
        <ellipse cx="40" cy="45" rx="20" ry="16" fill="white" />
        <ellipse cx="60" cy="45" rx="18" ry="14" fill="white" />
      </g>
    ),
    3: (
      <g>
        <ellipse cx="50" cy="55" rx="40" ry="25" fill="white" />
        <ellipse cx="20" cy="58" rx="16" ry="12" fill="white" />
        <ellipse cx="80" cy="58" rx="16" ry="12" fill="white" />
        <ellipse cx="35" cy="42" rx="18" ry="15" fill="white" />
        <ellipse cx="65" cy="42" rx="18" ry="15" fill="white" />
        <ellipse cx="50" cy="38" rx="15" ry="12" fill="white" />
      </g>
    )
  }

  return (
    <motion.svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 100 70"
      className={className}
      initial={{ opacity: 0.9 }}
      animate={{ y: [0, -5, 0], opacity: [0.85, 0.95, 0.85] }}
      transition={{ duration: 4 + variant, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <filter id={`cloudShadow${variant}`}>
          <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000" floodOpacity="0.1" />
        </filter>
        <linearGradient id={`cloudGradient${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8F4FD" />
        </linearGradient>
      </defs>
      <g filter={`url(#cloudShadow${variant})`} fill={`url(#cloudGradient${variant})`}>
        {clouds[variant]}
      </g>
    </motion.svg>
  )
}

// Jungle Palm Tree
export function PalmTree({ size = 200, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" className={className}>
      <defs>
        <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6D4C2F" />
          <stop offset="50%" stopColor="#8B6914" />
          <stop offset="100%" stopColor="#5D4025" />
        </linearGradient>
        <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50" />
          <stop offset="50%" stopColor="#2E7D32" />
          <stop offset="100%" stopColor="#1B5E20" />
        </linearGradient>
      </defs>
      {/* Trunk */}
      <path
        d="M 45 120 Q 42 90 48 60 Q 52 40 50 30"
        stroke="url(#trunkGradient)"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      {/* Trunk texture lines */}
      {[...Array(6)].map((_, i) => (
        <ellipse
          key={i}
          cx="48"
          cy={50 + i * 12}
          rx="6"
          ry="2"
          fill="rgba(0,0,0,0.15)"
        />
      ))}
      {/* Leaves */}
      <motion.g
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ transformOrigin: '50px 30px' }}
      >
        <motion.path
          d="M 50 30 Q 20 20 -5 35 Q 25 32 50 30"
          fill="url(#leafGradient)"
          animate={{ rotate: [-5, 0, -5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{ transformOrigin: '50px 30px' }}
        />
        <motion.path
          d="M 50 30 Q 80 20 105 35 Q 75 32 50 30"
          fill="url(#leafGradient)"
          animate={{ rotate: [5, 0, 5] }}
          transition={{ duration: 2.8, repeat: Infinity }}
          style={{ transformOrigin: '50px 30px' }}
        />
        <motion.path
          d="M 50 30 Q 30 0 10 -10 Q 35 10 50 30"
          fill="url(#leafGradient)"
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 3.2, repeat: Infinity }}
          style={{ transformOrigin: '50px 30px' }}
        />
        <motion.path
          d="M 50 30 Q 70 0 90 -10 Q 65 10 50 30"
          fill="url(#leafGradient)"
          animate={{ rotate: [3, -3, 3] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ transformOrigin: '50px 30px' }}
        />
        <motion.path
          d="M 50 30 Q 50 -5 50 -20 Q 50 5 50 30"
          fill="url(#leafGradient)"
          animate={{ scaleY: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: '50px 30px' }}
        />
        {/* Coconuts */}
        <circle cx="45" cy="35" r="5" fill="#8B4513" />
        <circle cx="55" cy="35" r="5" fill="#8B4513" />
        <circle cx="50" cy="40" r="5" fill="#6D4C2F" />
      </motion.g>
    </svg>
  )
}

// Jungle Vine
export function Vine({ height = 200, side = 'left', className = '' }: { height?: number; side?: 'left' | 'right'; className?: string }) {
  const path = side === 'left'
    ? 'M 5 0 Q 30 50 10 100 Q 35 150 15 200 Q 40 250 20 300'
    : 'M 35 0 Q 10 50 30 100 Q 5 150 25 200 Q 0 250 20 300'

  return (
    <motion.svg
      width={40}
      height={height}
      viewBox={`0 0 40 300`}
      className={className}
      style={{ height }}
      animate={{ x: side === 'left' ? [0, 5, 0] : [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id="vineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#558B2F" />
          <stop offset="100%" stopColor="#33691E" />
        </linearGradient>
      </defs>
      <path
        d={path}
        stroke="url(#vineGradient)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Leaves on vine */}
      {[...Array(5)].map((_, i) => (
        <motion.ellipse
          key={i}
          cx={side === 'left' ? 15 + (i % 2) * 10 : 25 - (i % 2) * 10}
          cy={30 + i * 55}
          rx="12"
          ry="6"
          fill="#4CAF50"
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          style={{ transformOrigin: `${side === 'left' ? 15 : 25}px ${30 + i * 55}px` }}
        />
      ))}
    </motion.svg>
  )
}

// Tropical Flower
export function TropicalFlower({ size = 60, color = '#FF6B6B', className = '' }: { size?: number; color?: string; className?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      className={className}
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
      <defs>
        <radialGradient id={`flowerGrad${color.replace('#', '')}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={adjustColorBrightness(color, -30)} />
        </radialGradient>
      </defs>
      {/* Petals */}
      {[...Array(6)].map((_, i) => (
        <motion.ellipse
          key={i}
          cx="30"
          cy="12"
          rx="10"
          ry="15"
          fill={`url(#flowerGrad${color.replace('#', '')})`}
          transform={`rotate(${i * 60} 30 30)`}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
      {/* Center */}
      <circle cx="30" cy="30" r="10" fill="#FFD93D" />
      <circle cx="30" cy="30" r="6" fill="#FF9800" />
    </motion.svg>
  )
}

// Butterfly
export function Butterfly({ size = 40, color = '#E91E63', className = '' }: { size?: number; color?: string; className?: string }) {
  return (
    <motion.svg
      width={size}
      height={size * 0.8}
      viewBox="0 0 50 40"
      className={className}
    >
      <defs>
        <linearGradient id={`wingGrad${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="50%" stopColor={adjustColorBrightness(color, 20)} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      {/* Left wings */}
      <motion.g
        animate={{ scaleX: [1, 0.7, 1] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        style={{ transformOrigin: '25px 20px' }}
      >
        <ellipse cx="15" cy="15" rx="12" ry="10" fill={`url(#wingGrad${color.replace('#', '')})`} opacity="0.9" />
        <ellipse cx="12" cy="28" rx="8" ry="7" fill={`url(#wingGrad${color.replace('#', '')})`} opacity="0.9" />
        {/* Wing spots */}
        <circle cx="15" cy="13" r="3" fill="white" opacity="0.5" />
      </motion.g>
      {/* Right wings */}
      <motion.g
        animate={{ scaleX: [1, 0.7, 1] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        style={{ transformOrigin: '25px 20px' }}
      >
        <ellipse cx="35" cy="15" rx="12" ry="10" fill={`url(#wingGrad${color.replace('#', '')})`} opacity="0.9" />
        <ellipse cx="38" cy="28" rx="8" ry="7" fill={`url(#wingGrad${color.replace('#', '')})`} opacity="0.9" />
        {/* Wing spots */}
        <circle cx="35" cy="13" r="3" fill="white" opacity="0.5" />
      </motion.g>
      {/* Body */}
      <ellipse cx="25" cy="20" rx="3" ry="12" fill="#333" />
      {/* Antennae */}
      <path d="M 24 8 Q 20 2 18 0" stroke="#333" strokeWidth="1" fill="none" />
      <path d="M 26 8 Q 30 2 32 0" stroke="#333" strokeWidth="1" fill="none" />
      <circle cx="18" cy="0" r="1.5" fill="#333" />
      <circle cx="32" cy="0" r="1.5" fill="#333" />
    </motion.svg>
  )
}

// Parrot Bird
export function Parrot({ size = 80, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      animate={{ y: [0, -5, 0], rotate: [-2, 2, -2] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Body */}
      <ellipse cx="40" cy="50" rx="18" ry="22" fill="#FF5722" />
      <ellipse cx="40" cy="48" rx="15" ry="18" fill="#FF7043" />
      {/* Head */}
      <circle cx="40" cy="25" r="15" fill="#4CAF50" />
      <circle cx="40" cy="23" r="12" fill="#66BB6A" />
      {/* Beak */}
      <path d="M 52 25 Q 65 28 55 35 Q 52 32 52 25" fill="#FFD93D" />
      <path d="M 52 28 L 58 30" stroke="#FF9800" strokeWidth="1" />
      {/* Eyes */}
      <circle cx="35" cy="22" r="5" fill="white" />
      <circle cx="35" cy="22" r="3" fill="#333" />
      <circle cx="34" cy="21" r="1" fill="white" />
      {/* Wing */}
      <motion.ellipse
        cx="28"
        cy="50"
        rx="10"
        ry="18"
        fill="#2196F3"
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 1, repeat: Infinity }}
        style={{ transformOrigin: '35px 40px' }}
      />
      {/* Tail feathers */}
      <motion.g
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ transformOrigin: '40px 55px' }}
      >
        <ellipse cx="40" cy="75" rx="4" ry="12" fill="#FF5722" />
        <ellipse cx="35" cy="74" rx="3" ry="10" fill="#2196F3" />
        <ellipse cx="45" cy="74" rx="3" ry="10" fill="#4CAF50" />
      </motion.g>
    </motion.svg>
  )
}

// Ground with grass
export function GrassGround({ className = '' }: { className?: string }) {
  return (
    <svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50" />
          <stop offset="40%" stopColor="#388E3C" />
          <stop offset="100%" stopColor="#2E7D32" />
        </linearGradient>
      </defs>
      {/* Main ground */}
      <path
        d="M 0 40 Q 50 30 100 40 Q 150 50 200 35 Q 250 45 300 40 Q 350 30 400 45 L 400 120 L 0 120 Z"
        fill="url(#groundGradient)"
      />
      {/* Grass blades */}
      {[...Array(40)].map((_, i) => (
        <motion.path
          key={i}
          d={`M ${i * 10 + 5} 40 Q ${i * 10 + 5 + (i % 2 ? 3 : -3)} 25 ${i * 10 + 5} 15`}
          stroke="#66BB6A"
          strokeWidth="2"
          fill="none"
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.05 }}
          style={{ transformOrigin: `${i * 10 + 5}px 40px` }}
        />
      ))}
    </svg>
  )
}

// Mountain Range
export function Mountains({ className = '' }: { className?: string }) {
  return (
    <svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id="mountainGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5D4037" />
          <stop offset="100%" stopColor="#3E2723" />
        </linearGradient>
        <linearGradient id="mountainGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6D4C41" />
          <stop offset="100%" stopColor="#4E342E" />
        </linearGradient>
        <linearGradient id="snowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0E0E0" />
        </linearGradient>
      </defs>
      {/* Back mountains */}
      <path d="M -20 200 L 80 80 L 140 140 L 200 60 L 280 150 L 340 90 L 420 200 Z" fill="url(#mountainGrad1)" opacity="0.6" />
      {/* Front mountains */}
      <path d="M -30 200 L 60 100 L 120 160 L 180 80 L 260 140 L 320 100 L 400 200 Z" fill="url(#mountainGrad2)" />
      {/* Snow caps */}
      <path d="M 60 100 L 75 115 L 45 115 Z" fill="url(#snowGrad)" />
      <path d="M 180 80 L 200 100 L 160 100 Z" fill="url(#snowGrad)" />
      <path d="M 320 100 L 338 118 L 302 118 Z" fill="url(#snowGrad)" />
    </svg>
  )
}

// Sparkle/Star effect
export function Sparkle({ size = 20, color = '#FFD700', className = '' }: { size?: number; color?: string; className?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      animate={{
        scale: [0.8, 1.2, 0.8],
        opacity: [0.6, 1, 0.6],
        rotate: [0, 180, 360]
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <path
        d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"
        fill={color}
      />
    </motion.svg>
  )
}

// Utility function to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}
