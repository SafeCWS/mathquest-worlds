'use client'

import React from 'react'

import { emotionConfig, adjustColor, type AvatarRenderProps } from './shared'

// Pirate avatar — extracted from PresetAvatars.tsx (Phase 1.3).
// Rendered by PresetAvatar via the avatarComponents map in ./index.ts.
export function PirateAvatar({ emotion, skinTone, hairColor, primaryColor, size }: AvatarRenderProps) {
  const config = emotionConfig[emotion]
  return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="skinGradPirate" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(skinTone, 10)} />
            <stop offset="100%" stopColor={adjustColor(skinTone, -10)} />
          </linearGradient>
        </defs>

        {/* Body - Pirate vest */}
        <path d="M 60 150 L 55 195 L 145 195 L 140 150 Q 100 160 60 150" fill="#1A1A2E" />
        <path d="M 70 150 L 100 195 L 130 150" fill="#B71C1C" />

        {/* Striped shirt */}
        <rect x="75" y="150" width="50" height="40" fill="white" />
        {[0, 1, 2, 3, 4].map(i => (
          <rect key={i} x="75" y={150 + i * 8} width="50" height="4" fill="#1A1A2E" />
        ))}

        {/* Neck */}
        <rect x="92" y="130" width="16" height="25" rx="8" fill="url(#skinGradPirate)" />

        {/* Head */}
        <ellipse cx="100" cy="95" rx="45" ry="48" fill="url(#skinGradPirate)" />

        {/* Cheeks */}
        <ellipse cx="68" cy="105" rx="10" ry="7" fill="#FFB6C1" opacity="0.5" />
        <ellipse cx="132" cy="105" rx="10" ry="7" fill="#FFB6C1" opacity="0.5" />

        {/* Eye patch on left eye */}
        <ellipse cx="78" cy="90" rx="15" ry="17" fill="#1A1A2E" />
        <path d="M 55 80 L 78 90 L 145 65" stroke="#1A1A2E" strokeWidth="3" fill="none" />

        {/* Right eye */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*90})`}>
          <ellipse cx="122" cy="90" rx="12" ry="14" fill="white" />
          <circle cx="124" cy="92" r="7" fill="#4A3728" />
          <circle cx="126" cy="89" r="3" fill="white" />
        </g>

        {/* Eyebrow */}
        <path d="M 110 78 Q 122 73 135 78" stroke={hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Nose */}
        <ellipse cx="100" cy="105" rx="5" ry="4" fill={adjustColor(skinTone, -20)} opacity="0.5" />

        {/* Mouth - confident smirk */}
        <path d="M 85 120 Q 100 130 120 118" stroke="#D35400" strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* Bandana */}
        <path d="M 55 65 Q 100 55 145 65 Q 140 75 100 80 Q 60 75 55 65" fill="#E74C3C" />
        <path d="M 55 65 Q 100 58 145 65" stroke="#C0392B" strokeWidth="3" fill="none" />
        {/* Bandana knot */}
        <circle cx="145" cy="70" r="8" fill="#E74C3C" />
        <path d="M 148 70 Q 165 80 160 100" stroke="#E74C3C" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M 152 72 Q 170 75 175 95" stroke="#E74C3C" strokeWidth="5" fill="none" strokeLinecap="round" />

        {/* Hair */}
        <path d="M 60 75 Q 50 95 55 115" stroke={hairColor} strokeWidth="10" fill="none" strokeLinecap="round" />
      </svg>
  )
}
