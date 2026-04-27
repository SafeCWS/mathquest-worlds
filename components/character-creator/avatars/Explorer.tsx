'use client'

import React from 'react'

import { emotionConfig, adjustColor, renderMouth, type AvatarRenderProps } from './shared'

// Explorer avatar — extracted from PresetAvatars.tsx (Phase 1.3).
// Rendered by PresetAvatar via the avatarComponents map in ./index.ts.
export function ExplorerAvatar({ emotion, skinTone, hairColor, primaryColor, size }: AvatarRenderProps) {
  const config = emotionConfig[emotion]
  return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="skinGradExplorer" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(skinTone, 10)} />
            <stop offset="100%" stopColor={adjustColor(skinTone, -10)} />
          </linearGradient>
          <filter id="softShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Body */}
        <ellipse cx="100" cy="165" rx="35" ry="25" fill={primaryColor} filter="url(#softShadow)" />
        <ellipse cx="100" cy="160" rx="32" ry="22" fill={adjustColor(primaryColor, 15)} />

        {/* Vest detail */}
        <path d="M 75 150 L 85 180 L 100 175 L 115 180 L 125 150 Z" fill={adjustColor(primaryColor, -20)} />

        {/* Neck */}
        <rect x="92" y="130" width="16" height="20" rx="8" fill="url(#skinGradExplorer)" />

        {/* Head */}
        <ellipse cx="100" cy="95" rx="45" ry="50" fill="url(#skinGradExplorer)" filter="url(#softShadow)" />

        {/* Cheeks */}
        <ellipse cx="70" cy="105" rx="10" ry="7" fill="#FFB6C1" opacity="0.5" />
        <ellipse cx="130" cy="105" rx="10" ry="7" fill="#FFB6C1" opacity="0.5" />

        {/* Eyes */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*95})`}>
          <ellipse cx="80" cy="90" rx="12" ry="14" fill="white" />
          <ellipse cx="120" cy="90" rx="12" ry="14" fill="white" />
          <circle cx="82" cy="92" r="7" fill="#4A3728" />
          <circle cx="122" cy="92" r="7" fill="#4A3728" />
          <circle cx="84" cy="89" r="3" fill="white" />
          <circle cx="124" cy="89" r="3" fill="white" />
        </g>

        {/* Eyebrows */}
        <path d="M 68 78 Q 80 74 90 78" stroke={hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 110 78 Q 120 74 132 78" stroke={hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Nose */}
        <ellipse cx="100" cy="105" rx="5" ry="4" fill={adjustColor(skinTone, -20)} opacity="0.5" />

        {/* Mouth based on emotion */}
        {renderMouth(config.mouthType, 100, 118)}

        {/* Explorer Hat */}
        <ellipse cx="100" cy="52" rx="50" ry="12" fill="#8B7355" />
        <path d="M 55 52 Q 55 25 100 20 Q 145 25 145 52" fill="#A0826D" />
        <ellipse cx="100" cy="52" rx="35" ry="8" fill="#6B5344" />
        {/* Hat band */}
        <rect x="60" y="48" width="80" height="8" fill={primaryColor} />

        {/* Hair peeking out */}
        <path d="M 60 55 Q 55 65 60 75" stroke={hairColor} strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M 140 55 Q 145 65 140 75" stroke={hairColor} strokeWidth="8" fill="none" strokeLinecap="round" />
      </svg>
  )
}
