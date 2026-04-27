'use client'

import React from 'react'
import { motion } from 'motion/react'
import { emotionConfig, adjustColor, renderMouth, type AvatarRenderProps } from './shared'

// Astronaut avatar — extracted from PresetAvatars.tsx (Phase 1.3).
// Rendered by PresetAvatar via the avatarComponents map in ./index.ts.
export function AstronautAvatar({ emotion, skinTone, hairColor, primaryColor, size }: AvatarRenderProps) {
  const config = emotionConfig[emotion]
  return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="skinGradAstro" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(skinTone, 10)} />
            <stop offset="100%" stopColor={adjustColor(skinTone, -10)} />
          </linearGradient>
          <linearGradient id="suitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F5F5F5" />
            <stop offset="100%" stopColor="#BDBDBD" />
          </linearGradient>
          <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64B5F6" />
            <stop offset="50%" stopColor="#1E88E5" />
            <stop offset="100%" stopColor="#0D47A1" />
          </linearGradient>
        </defs>

        {/* Space suit body */}
        <ellipse cx="100" cy="165" rx="40" ry="30" fill="url(#suitGrad)" />
        <circle cx="100" cy="165" r="15" fill={primaryColor} />

        {/* Helmet */}
        <ellipse cx="100" cy="90" rx="55" ry="55" fill="url(#suitGrad)" />
        <ellipse cx="100" cy="88" rx="48" ry="48" fill="#E0E0E0" />

        {/* Visor */}
        <ellipse cx="100" cy="90" rx="38" ry="38" fill="url(#visorGrad)" />

        {/* Face visible through visor */}
        <ellipse cx="100" cy="95" rx="30" ry="32" fill="url(#skinGradAstro)" />

        {/* Cheeks */}
        <ellipse cx="78" cy="102" rx="6" ry="4" fill="#FFB6C1" opacity="0.5" />
        <ellipse cx="122" cy="102" rx="6" ry="4" fill="#FFB6C1" opacity="0.5" />

        {/* Eyes */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*90})`}>
          <ellipse cx="88" cy="90" rx="8" ry="10" fill="white" />
          <ellipse cx="112" cy="90" rx="8" ry="10" fill="white" />
          <circle cx="89" cy="92" r="5" fill="#2196F3" />
          <circle cx="113" cy="92" r="5" fill="#2196F3" />
          <circle cx="91" cy="89" r="2" fill="white" />
          <circle cx="115" cy="89" r="2" fill="white" />
        </g>

        {/* Nose */}
        <ellipse cx="100" cy="100" rx="3" ry="2" fill={adjustColor(skinTone, -15)} opacity="0.5" />

        {/* Mouth */}
        {renderMouth(config.mouthType, 100, 110, 0.7)}

        {/* Helmet details */}
        <ellipse cx="100" cy="45" rx="12" ry="6" fill="#E0E0E0" />
        <rect x="55" cy="130" width="10" height="15" rx="3" fill="#757575" />
        <rect x="135" cy="130" width="10" height="15" rx="3" fill="#757575" />

        {/* Stars reflecting on visor */}
        <motion.circle cx="70" cy="75" r="2" fill="white" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="125" cy="80" r="1.5" fill="white" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} />
      </svg>
  )
}
