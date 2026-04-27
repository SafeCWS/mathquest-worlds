'use client'

import React from 'react'
import { motion } from 'motion/react'
import { emotionConfig, adjustColor, type AvatarRenderProps } from './shared'

// Dragon avatar — extracted from PresetAvatars.tsx (Phase 1.3).
// Rendered by PresetAvatar via the avatarComponents map in ./index.ts.
export function DragonAvatar({ emotion, skinTone, hairColor, primaryColor, size }: AvatarRenderProps) {
  const config = emotionConfig[emotion]
  return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="dragonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={adjustColor(primaryColor, -30)} />
          </linearGradient>
          <linearGradient id="dragonBelly" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(primaryColor, 40)} />
            <stop offset="100%" stopColor={adjustColor(primaryColor, 20)} />
          </linearGradient>
        </defs>

        {/* Wings */}
        <motion.path
          d="M 30 80 Q 15 60 25 40 Q 40 55 50 50 Q 35 70 45 85 Q 30 95 30 80"
          fill={adjustColor(primaryColor, -20)}
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ transformOrigin: '45px 70px' }}
        />
        <motion.path
          d="M 170 80 Q 185 60 175 40 Q 160 55 150 50 Q 165 70 155 85 Q 170 95 170 80"
          fill={adjustColor(primaryColor, -20)}
          animate={{ rotate: [10, -10, 10] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ transformOrigin: '155px 70px' }}
        />

        {/* Body */}
        <ellipse cx="100" cy="160" rx="40" ry="35" fill="url(#dragonGrad)" />
        {/* Belly */}
        <ellipse cx="100" cy="165" rx="25" ry="25" fill="url(#dragonBelly)" />

        {/* Tail */}
        <motion.path
          d="M 55 165 Q 30 175 20 160 Q 15 145 25 140"
          stroke={primaryColor}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          initial={{ d: "M 55 165 Q 30 175 20 160 Q 15 145 25 140" }}
          animate={{ d: [
            "M 55 165 Q 30 175 20 160 Q 15 145 25 140",
            "M 55 165 Q 35 180 25 165 Q 18 150 28 142",
            "M 55 165 Q 30 175 20 160 Q 15 145 25 140"
          ]}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Tail spike */}
        <motion.path
          d="M 25 140 L 15 130 L 30 138"
          fill={adjustColor(primaryColor, -30)}
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: '25px 140px' }}
        />

        {/* Neck */}
        <rect x="90" y="115" width="20" height="30" rx="10" fill="url(#dragonGrad)" />

        {/* Head */}
        <ellipse cx="100" cy="85" rx="45" ry="40" fill="url(#dragonGrad)" />
        {/* Snout */}
        <ellipse cx="100" cy="105" rx="25" ry="15" fill={adjustColor(primaryColor, 10)} />

        {/* Eyes */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*80})`}>
          <ellipse cx="78" cy="80" rx="12" ry="14" fill="#FFD700" />
          <ellipse cx="122" cy="80" rx="12" ry="14" fill="#FFD700" />
          <ellipse cx="80" cy="82" r="5" fill="#1A1A2E" />
          <ellipse cx="124" cy="82" r="5" fill="#1A1A2E" />
          <circle cx="82" cy="79" r="2" fill="white" />
          <circle cx="126" cy="79" r="2" fill="white" />
        </g>

        {/* Nostrils */}
        <ellipse cx="92" cy="105" rx="4" ry="3" fill={adjustColor(primaryColor, -30)} />
        <ellipse cx="108" cy="105" rx="4" ry="3" fill={adjustColor(primaryColor, -30)} />
        {/* Smoke puffs */}
        <motion.circle cx="88" cy="100" r="3" fill="#9E9E9E" opacity="0.4" animate={{ y: [-5, -15], opacity: [0.4, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="112" cy="100" r="3" fill="#9E9E9E" opacity="0.4" animate={{ y: [-5, -15], opacity: [0.4, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />

        {/* Mouth */}
        <path d="M 85 115 Q 100 125 115 115" stroke={adjustColor(primaryColor, -40)} strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Horns */}
        <path d="M 60 55 L 50 30 L 70 50" fill={adjustColor(primaryColor, -30)} />
        <path d="M 140 55 L 150 30 L 130 50" fill={adjustColor(primaryColor, -30)} />

        {/* Spikes on head */}
        <path d="M 85 48 L 80 35 L 90 48" fill={adjustColor(primaryColor, -20)} />
        <path d="M 100 45 L 100 30 L 105 45" fill={adjustColor(primaryColor, -20)} />
        <path d="M 115 48 L 120 35 L 110 48" fill={adjustColor(primaryColor, -20)} />

        {/* Ears */}
        <path d="M 55 65 L 45 55 L 60 55" fill={adjustColor(primaryColor, 10)} />
        <path d="M 145 65 L 155 55 L 140 55" fill={adjustColor(primaryColor, 10)} />
      </svg>
  )
}
