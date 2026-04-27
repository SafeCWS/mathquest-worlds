'use client'

import React from 'react'
import { motion } from 'motion/react'
import { emotionConfig, adjustColor, renderMouth, type AvatarRenderProps } from './shared'

// Scientist avatar — extracted from PresetAvatars.tsx (Phase 1.3).
// Rendered by PresetAvatar via the avatarComponents map in ./index.ts.
export function ScientistAvatar({ emotion, skinTone, hairColor, primaryColor, size }: AvatarRenderProps) {
  const config = emotionConfig[emotion]
  return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="skinGradScientist" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(skinTone, 10)} />
            <stop offset="100%" stopColor={adjustColor(skinTone, -10)} />
          </linearGradient>
        </defs>

        {/* Lab coat body */}
        <path d="M 55 145 L 50 195 L 150 195 L 145 145 Q 100 155 55 145" fill="white" stroke="#E0E0E0" strokeWidth="2" />
        {/* Coat lapels */}
        <path d="M 70 145 L 85 195" stroke={primaryColor} strokeWidth="4" />
        <path d="M 130 145 L 115 195" stroke={primaryColor} strokeWidth="4" />
        {/* Pocket */}
        <rect x="110" y="160" width="20" height="15" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="1" rx="2" />
        {/* Pens in pocket */}
        <rect x="115" y="158" width="3" height="12" fill={primaryColor} rx="1" />
        <rect x="120" y="156" width="3" height="14" fill="#E53E3E" rx="1" />

        {/* Shirt/tie */}
        <rect x="95" y="140" width="10" height="25" fill={primaryColor} />

        {/* Neck */}
        <rect x="92" y="128" width="16" height="18" rx="8" fill="url(#skinGradScientist)" />

        {/* Head */}
        <ellipse cx="100" cy="90" rx="42" ry="45" fill="url(#skinGradScientist)" />

        {/* Cheeks */}
        <ellipse cx="72" cy="100" rx="8" ry="5" fill="#FFB6C1" opacity="0.4" />
        <ellipse cx="128" cy="100" rx="8" ry="5" fill="#FFB6C1" opacity="0.4" />

        {/* Big round glasses */}
        <circle cx="78" cy="88" r="18" fill="none" stroke="#37474F" strokeWidth="3" />
        <circle cx="122" cy="88" r="18" fill="none" stroke="#37474F" strokeWidth="3" />
        <line x1="96" y1="88" x2="104" y2="88" stroke="#37474F" strokeWidth="3" />
        {/* Glasses lens shine */}
        <circle cx="72" cy="82" r="4" fill="white" opacity="0.3" />
        <circle cx="116" cy="82" r="4" fill="white" opacity="0.3" />

        {/* Eyes behind glasses */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*88})`}>
          <ellipse cx="78" cy="88" rx="9" ry="11" fill="white" />
          <ellipse cx="122" cy="88" rx="9" ry="11" fill="white" />
          <circle cx="79" cy="90" r="5" fill="#4A3728" />
          <circle cx="123" cy="90" r="5" fill="#4A3728" />
          <circle cx="81" cy="87" r="2" fill="white" />
          <circle cx="125" cy="87" r="2" fill="white" />
        </g>

        {/* Nose */}
        <ellipse cx="100" cy="100" rx="4" ry="3" fill={adjustColor(skinTone, -15)} opacity="0.5" />

        {/* Mouth */}
        {renderMouth(config.mouthType, 100, 112)}

        {/* Messy scientist hair */}
        <path d="M 58 60 Q 50 45 65 40 Q 80 30 100 35 Q 120 30 135 40 Q 150 45 142 60" fill={hairColor} />
        <path d="M 55 55 Q 45 40 55 30" stroke={hairColor} strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M 145 55 Q 155 40 145 30" stroke={hairColor} strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M 85 35 Q 90 20 100 25" stroke={hairColor} strokeWidth="6" fill="none" strokeLinecap="round" />

        {/* Test tube (optional accessory) */}
        <motion.g
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: '155px 100px' }}
        >
          <rect x="150" y="85" width="12" height="30" rx="3" fill="white" stroke="#90CAF9" strokeWidth="2" />
          <rect x="152" y="100" width="8" height="13" rx="2" fill="#4CAF50" opacity="0.7" />
          {/* Bubbles */}
          <motion.circle cx="156" cy="105" r="2" fill="white" opacity="0.8" animate={{ y: [-2, -8, -2] }} transition={{ duration: 1, repeat: Infinity }} />
        </motion.g>
      </svg>
  )
}
