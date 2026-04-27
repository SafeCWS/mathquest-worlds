'use client'

import React from 'react'
import { motion } from 'motion/react'
import { emotionConfig, adjustColor, type AvatarRenderProps } from './shared'

// Superhero avatar — extracted from PresetAvatars.tsx (Phase 1.3).
// Rendered by PresetAvatar via the avatarComponents map in ./index.ts.
export function SuperheroAvatar({ emotion, skinTone, hairColor, primaryColor, size }: AvatarRenderProps) {
  const config = emotionConfig[emotion]
  return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="skinGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(skinTone, 10)} />
            <stop offset="100%" stopColor={adjustColor(skinTone, -10)} />
          </linearGradient>
          <linearGradient id="capeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={adjustColor(primaryColor, -30)} />
          </linearGradient>
        </defs>

        {/* Cape */}
        <motion.path
          fill="url(#capeGrad)"
          d="M 50 95 Q 30 130 40 195 L 160 195 Q 170 130 150 95"
          initial={{ d: "M 50 95 Q 30 130 40 195 L 160 195 Q 170 130 150 95" }}
          animate={{ d: [
            "M 50 95 Q 30 130 40 195 L 160 195 Q 170 130 150 95",
            "M 50 95 Q 25 135 45 195 L 155 195 Q 175 135 150 95",
            "M 50 95 Q 30 130 40 195 L 160 195 Q 170 130 150 95"
          ]}}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Body - Hero suit */}
        <ellipse cx="100" cy="160" rx="35" ry="30" fill={primaryColor} />
        {/* Chest emblem */}
        <polygon points="100,140 115,160 100,175 85,160" fill="#FFD700" />
        <polygon points="100,145 110,160 100,170 90,160" fill={adjustColor(primaryColor, 20)} />

        {/* Neck */}
        <rect x="92" y="125" width="16" height="20" rx="8" fill="url(#skinGradHero)" />

        {/* Head */}
        <ellipse cx="100" cy="90" rx="43" ry="46" fill="url(#skinGradHero)" />

        {/* Mask */}
        <path d="M 57 75 L 57 100 Q 100 115 143 100 L 143 75 Q 100 55 57 75" fill={primaryColor} />

        {/* Mask eye holes */}
        <ellipse cx="78" cy="88" rx="15" ry="12" fill="url(#skinGradHero)" />
        <ellipse cx="122" cy="88" rx="15" ry="12" fill="url(#skinGradHero)" />

        {/* Eyes showing through mask */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*88})`}>
          <ellipse cx="78" cy="88" rx="10" ry="11" fill="white" />
          <ellipse cx="122" cy="88" rx="10" ry="11" fill="white" />
          <circle cx="80" cy="89" r="5" fill="#2196F3" />
          <circle cx="124" cy="89" r="5" fill="#2196F3" />
          <circle cx="82" cy="87" r="2" fill="white" />
          <circle cx="126" cy="87" r="2" fill="white" />
        </g>

        {/* Heroic eyebrows */}
        <path d="M 62 78 L 90 82" stroke={hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 138 78 L 110 82" stroke={hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Nose */}
        <ellipse cx="100" cy="100" rx="4" ry="3" fill={adjustColor(skinTone, -15)} opacity="0.5" />

        {/* Determined smile */}
        <path d="M 85 115 Q 100 125 115 115" stroke="#D35400" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Hair showing above mask */}
        <path d="M 62 70 Q 70 50 100 45 Q 130 50 138 70" fill={hairColor} />
        <path d="M 100 45 L 105 35 L 100 42 L 95 35 Z" fill={hairColor} />
      </svg>
  )
}
