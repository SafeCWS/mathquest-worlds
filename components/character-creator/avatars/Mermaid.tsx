'use client'

import React from 'react'
import { motion } from 'motion/react'
import { emotionConfig, adjustColor, renderMouth, type AvatarRenderProps } from './shared'

// Mermaid avatar — extracted from PresetAvatars.tsx (Phase 1.3).
// Rendered by PresetAvatar via the avatarComponents map in ./index.ts.
export function MermaidAvatar({ emotion, skinTone, hairColor, primaryColor, size }: AvatarRenderProps) {
  const config = emotionConfig[emotion]
  return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="skinGradMermaid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(skinTone, 10)} />
            <stop offset="100%" stopColor={adjustColor(skinTone, -10)} />
          </linearGradient>
          <linearGradient id="tailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="50%" stopColor={adjustColor(primaryColor, -15)} />
            <stop offset="100%" stopColor={adjustColor(primaryColor, -30)} />
          </linearGradient>
          <linearGradient id="finGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(primaryColor, 20)} stopOpacity="0.8" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Tail fin */}
        <motion.g
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ transformOrigin: '100px 185px' }}
        >
          <path d="M 70 180 Q 50 195 60 200 Q 100 190 140 200 Q 150 195 130 180" fill="url(#finGrad)" />
        </motion.g>

        {/* Tail body */}
        <path d="M 70 140 Q 65 160 70 180 L 130 180 Q 135 160 130 140 Q 100 150 70 140" fill="url(#tailGrad)" />
        {/* Scale pattern on tail */}
        {[0, 1, 2].map(row => (
          [0, 1, 2, 3].map(col => (
            <ellipse
              key={`${row}-${col}`}
              cx={80 + col * 15 - (row % 2) * 7}
              cy={150 + row * 12}
              rx="6"
              ry="5"
              fill={adjustColor(primaryColor, -10)}
              opacity="0.5"
            />
          ))
        ))}

        {/* Shell top */}
        <ellipse cx="85" cy="140" rx="12" ry="10" fill="#F48FB1" />
        <ellipse cx="115" cy="140" rx="12" ry="10" fill="#F48FB1" />
        <path d="M 78 145 Q 85 135 92 145" stroke="#E91E63" strokeWidth="1.5" fill="none" />
        <path d="M 108 145 Q 115 135 122 145" stroke="#E91E63" strokeWidth="1.5" fill="none" />

        {/* Neck */}
        <rect x="92" y="118" width="16" height="25" rx="8" fill="url(#skinGradMermaid)" />

        {/* Head */}
        <ellipse cx="100" cy="85" rx="42" ry="45" fill="url(#skinGradMermaid)" />

        {/* Rosy cheeks */}
        <ellipse cx="70" cy="95" rx="10" ry="7" fill="#FFB6C1" opacity="0.6" />
        <ellipse cx="130" cy="95" rx="10" ry="7" fill="#FFB6C1" opacity="0.6" />

        {/* Eyes */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*85})`}>
          <ellipse cx="80" cy="85" rx="11" ry="13" fill="white" />
          <ellipse cx="120" cy="85" rx="11" ry="13" fill="white" />
          <circle cx="82" cy="87" r="6" fill="#00BCD4" />
          <circle cx="122" cy="87" r="6" fill="#00BCD4" />
          <circle cx="84" cy="84" r="2.5" fill="white" />
          <circle cx="124" cy="84" r="2.5" fill="white" />
        </g>

        {/* Eyelashes */}
        <path d="M 68 80 L 72 78" stroke={hairColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M 70 77 L 75 76" stroke={hairColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M 132 80 L 128 78" stroke={hairColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M 130 77 L 125 76" stroke={hairColor} strokeWidth="2" strokeLinecap="round" />

        {/* Nose */}
        <ellipse cx="100" cy="98" rx="4" ry="3" fill={adjustColor(skinTone, -15)} opacity="0.5" />

        {/* Mouth */}
        {renderMouth(config.mouthType, 100, 108)}

        {/* Flowing hair */}
        <path d="M 58 55 Q 35 80 40 130 Q 35 155 45 175" stroke={hairColor} strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M 65 50 Q 40 75 48 120" stroke={hairColor} strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M 142 55 Q 165 80 160 130 Q 165 155 155 175" stroke={hairColor} strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M 135 50 Q 160 75 152 120" stroke={hairColor} strokeWidth="10" fill="none" strokeLinecap="round" />
        {/* Hair top */}
        <ellipse cx="100" cy="48" rx="45" ry="22" fill={hairColor} />

        {/* Shell crown/accessory */}
        <path d="M 80 40 Q 85 30 90 40" fill="#F48FB1" />
        <path d="M 95 38 Q 100 25 105 38" fill="#FFB6C1" />
        <path d="M 110 40 Q 115 30 120 40" fill="#F48FB1" />

        {/* Starfish accessory */}
        <motion.polygon
          points="60,52 62,58 68,58 63,62 65,68 60,64 55,68 57,62 52,58 58,58"
          fill="#FFD700"
          animate={{ rotate: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ transformOrigin: '60px 60px' }}
        />

        {/* Bubbles */}
        <motion.circle cx="45" cy="100" r="4" fill="#90CAF9" opacity="0.5" animate={{ y: [0, -30], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="155" cy="110" r="3" fill="#90CAF9" opacity="0.5" animate={{ y: [0, -25], opacity: [0.5, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} />
        <motion.circle cx="50" cy="130" r="2" fill="#90CAF9" opacity="0.5" animate={{ y: [0, -20], opacity: [0.5, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: 1 }} />
      </svg>
  )
}
