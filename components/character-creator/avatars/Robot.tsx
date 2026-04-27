'use client'

import React from 'react'
import { motion } from 'motion/react'
import { emotionConfig, type AvatarRenderProps } from './shared'

// Robot avatar — extracted from PresetAvatars.tsx (Phase 1.3).
// Rendered by PresetAvatar via the avatarComponents map in ./index.ts.
export function RobotAvatar({ emotion, skinTone, hairColor, primaryColor, size }: AvatarRenderProps) {
  const config = emotionConfig[emotion]
  return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B0BEC5" />
            <stop offset="50%" stopColor="#78909C" />
            <stop offset="100%" stopColor="#546E7A" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00E676" />
            <stop offset="100%" stopColor="#00C853" />
          </linearGradient>
        </defs>

        {/* Body */}
        <rect x="60" y="145" width="80" height="50" rx="10" fill="url(#metalGrad)" />
        <rect x="70" y="155" width="60" height="30" rx="5" fill="#37474F" />
        {/* Chest lights */}
        <motion.circle cx="85" cy="170" r="5" fill={primaryColor} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} />
        <motion.circle cx="100" cy="170" r="5" fill="#00E676" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />
        <motion.circle cx="115" cy="170" r="5" fill="#FF5252" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.6 }} />

        {/* Neck */}
        <rect x="90" y="125" width="20" height="25" fill="#546E7A" />
        <rect x="85" y="140" width="30" height="8" fill="#78909C" />

        {/* Head */}
        <rect x="55" y="50" width="90" height="80" rx="15" fill="url(#metalGrad)" />

        {/* Screen face */}
        <rect x="65" y="60" width="70" height="55" rx="8" fill="#263238" />
        <rect x="68" y="63" width="64" height="49" rx="6" fill="#37474F" />

        {/* Eyes on screen */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*85})`}>
          <motion.rect
            x="75" y="75" width="20" height="25" rx="3"
            fill="url(#screenGrad)"
            animate={{ scaleY: [1, 0.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ transformOrigin: '85px 87.5px' }}
          />
          <motion.rect
            x="105" y="75" width="20" height="25" rx="3"
            fill="url(#screenGrad)"
            animate={{ scaleY: [1, 0.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.1 }}
            style={{ transformOrigin: '115px 87.5px' }}
          />
        </g>

        {/* Mouth on screen */}
        <motion.rect
          x="80" y="105" width="40" height="5" rx="2"
          fill="#00E676"
          animate={{ width: [40, 30, 50, 40] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Antenna */}
        <rect x="97" y="30" width="6" height="25" fill="#78909C" />
        <motion.circle
          cx="100" cy="25" r="10"
          fill={primaryColor}
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Ears/sensors */}
        <rect x="45" y="70" width="12" height="30" rx="3" fill="#546E7A" />
        <rect x="143" y="70" width="12" height="30" rx="3" fill="#546E7A" />
        <motion.rect x="47" y="80" width="8" height="10" rx="2" fill={primaryColor} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity }} />
        <motion.rect x="145" y="80" width="8" height="10" rx="2" fill={primaryColor} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} />
      </svg>
  )
}
