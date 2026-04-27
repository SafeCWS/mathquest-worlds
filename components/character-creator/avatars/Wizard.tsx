'use client'

import React from 'react'
import { motion } from 'motion/react'
import { emotionConfig, adjustColor, renderMouth, type AvatarRenderProps } from './shared'

// Wizard avatar — extracted from PresetAvatars.tsx (Phase 1.3).
// Rendered by PresetAvatar via the avatarComponents map in ./index.ts.
export function WizardAvatar({ emotion, skinTone, hairColor, primaryColor, size }: AvatarRenderProps) {
  const config = emotionConfig[emotion]
  return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="skinGradWizard" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(skinTone, 10)} />
            <stop offset="100%" stopColor={adjustColor(skinTone, -10)} />
          </linearGradient>
          <linearGradient id="robeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={adjustColor(primaryColor, -30)} />
          </linearGradient>
          <filter id="magicGlow">
            <feGaussianBlur stdDeviation="2" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Robe body */}
        <path d="M 60 145 Q 50 180 55 195 L 145 195 Q 150 180 140 145 Q 120 155 100 155 Q 80 155 60 145" fill="url(#robeGrad)" />

        {/* Stars on robe */}
        <polygon points="75,170 77,175 82,175 78,178 80,183 75,180 70,183 72,178 68,175 73,175" fill="#FFD700" opacity="0.8" />
        <polygon points="120,165 122,170 127,170 123,173 125,178 120,175 115,178 117,173 113,170 118,170" fill="#FFD700" opacity="0.8" />

        {/* Neck */}
        <rect x="92" y="130" width="16" height="20" rx="8" fill="url(#skinGradWizard)" />

        {/* Head */}
        <ellipse cx="100" cy="100" rx="42" ry="45" fill="url(#skinGradWizard)" />

        {/* Cheeks */}
        <ellipse cx="72" cy="110" rx="9" ry="6" fill="#FFB6C1" opacity="0.5" />
        <ellipse cx="128" cy="110" rx="9" ry="6" fill="#FFB6C1" opacity="0.5" />

        {/* Eyes with magic sparkle */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*95})`}>
          <ellipse cx="80" cy="95" rx="11" ry="13" fill="white" />
          <ellipse cx="120" cy="95" rx="11" ry="13" fill="white" />
          <circle cx="82" cy="97" r="6" fill="#9B59B6" />
          <circle cx="122" cy="97" r="6" fill="#9B59B6" />
          <circle cx="84" cy="94" r="2.5" fill="white" />
          <circle cx="124" cy="94" r="2.5" fill="white" />
          {/* Magic sparkle in eyes */}
          <motion.circle
            cx="79"
            cy="99"
            r="1.5"
            fill="#FFD700"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle
            cx="119"
            cy="99"
            r="1.5"
            fill="#FFD700"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
        </g>

        {/* Nose */}
        <ellipse cx="100" cy="108" rx="4" ry="3" fill={adjustColor(skinTone, -20)} opacity="0.5" />

        {/* Mouth */}
        {renderMouth(config.mouthType, 100, 120)}

        {/* Wizard Hat */}
        <path d="M 50 70 Q 100 -20 150 70" fill={primaryColor} />
        <path d="M 55 70 Q 100 -15 145 70" fill={adjustColor(primaryColor, 20)} />
        <ellipse cx="100" cy="70" rx="55" ry="15" fill={primaryColor} />
        {/* Hat star */}
        <motion.polygon
          points="100,25 103,35 113,35 105,42 108,52 100,46 92,52 95,42 87,35 97,35"
          fill="#FFD700"
          filter="url(#magicGlow)"
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Hair */}
        <path d="M 55 75 Q 45 90 55 105" stroke={hairColor} strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M 145 75 Q 155 90 145 105" stroke={hairColor} strokeWidth="10" fill="none" strokeLinecap="round" />
      </svg>
  )
}
