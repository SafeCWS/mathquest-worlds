'use client'

import React from 'react'
import { motion } from 'motion/react'
import { emotionConfig, adjustColor, type AvatarRenderProps } from './shared'

// Ninja avatar — extracted from PresetAvatars.tsx (Phase 1.3).
// Rendered by PresetAvatar via the avatarComponents map in ./index.ts.
export function NinjaAvatar({ emotion, skinTone, hairColor, primaryColor, size }: AvatarRenderProps) {
  const config = emotionConfig[emotion]
  return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="skinGradNinja" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(skinTone, 10)} />
            <stop offset="100%" stopColor={adjustColor(skinTone, -10)} />
          </linearGradient>
        </defs>

        {/* Ninja outfit body */}
        <path d="M 55 145 L 50 195 L 150 195 L 145 145 Q 100 155 55 145" fill="#1A1A2E" />

        {/* Belt */}
        <rect x="60" y="155" width="80" height="10" fill={primaryColor} />
        <rect x="95" y="152" width="10" height="16" fill={adjustColor(primaryColor, -20)} />

        {/* Neck */}
        <rect x="92" y="128" width="16" height="22" rx="8" fill="url(#skinGradNinja)" />

        {/* Head shape */}
        <ellipse cx="100" cy="92" rx="45" ry="48" fill="url(#skinGradNinja)" />

        {/* Ninja mask covering lower face */}
        <path d="M 55 85 L 55 130 Q 100 145 145 130 L 145 85" fill="#1A1A2E" />

        {/* Eye area visible */}
        <ellipse cx="100" cy="85" rx="40" ry="18" fill="url(#skinGradNinja)" />

        {/* Eyes - intense ninja look */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*85})`}>
          <ellipse cx="78" cy="85" rx="14" ry="10" fill="white" />
          <ellipse cx="122" cy="85" rx="14" ry="10" fill="white" />
          <ellipse cx="80" cy="86" r="6" fill="#2C3E50" />
          <ellipse cx="124" cy="86" r="6" fill="#2C3E50" />
          <circle cx="82" cy="84" r="2.5" fill="white" />
          <circle cx="126" cy="84" r="2.5" fill="white" />
        </g>

        {/* Intense eyebrows */}
        <path d="M 62 75 L 92 78" stroke={hairColor} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 138 75 L 108 78" stroke={hairColor} strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* Headband */}
        <rect x="50" y="60" width="100" height="15" fill={primaryColor} />
        {/* Headband tails */}
        <motion.path
          d="M 145 67 Q 165 65 175 80"
          stroke={primaryColor}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ transformOrigin: '145px 67px' }}
        />
        <motion.path
          d="M 148 70 Q 170 75 185 95"
          stroke={primaryColor}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          animate={{ rotate: [5, -5, 5] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{ transformOrigin: '148px 70px' }}
        />
        {/* Metal plate on headband */}
        <rect x="85" y="62" width="30" height="11" fill="#B0BEC5" rx="2" />
        <text x="100" y="70" textAnchor="middle" fontSize="8" fill="#37474F" fontWeight="bold">忍</text>
      </svg>
  )
}
