'use client'

import React from 'react'
import { motion } from 'motion/react'
import { emotionConfig, adjustColor, renderMouth, type AvatarRenderProps } from './shared'

// Unicorn avatar — extracted from PresetAvatars.tsx (Phase 1.3).
// Rendered by PresetAvatar via the avatarComponents map in ./index.ts.
export function UnicornAvatar({ emotion, skinTone, hairColor, primaryColor, size }: AvatarRenderProps) {
  const config = emotionConfig[emotion]
  return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="skinGradUnicorn" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(skinTone, 10)} />
            <stop offset="100%" stopColor={adjustColor(skinTone, -10)} />
          </linearGradient>
          <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="25%" stopColor="#FFD93D" />
            <stop offset="50%" stopColor="#6BCB77" />
            <stop offset="75%" stopColor="#4D96FF" />
            <stop offset="100%" stopColor="#9B59B6" />
          </linearGradient>
          <filter id="unicornGlow">
            <feGaussianBlur stdDeviation="2" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Body - sparkly dress */}
        <path d="M 65 145 Q 50 175 60 195 L 140 195 Q 150 175 135 145 Q 100 155 65 145" fill={primaryColor} />
        <path d="M 70 145 Q 100 150 130 145 Q 115 165 100 185 Q 85 165 70 145" fill={adjustColor(primaryColor, 25)} />
        {/* Sparkles on dress */}
        <motion.circle cx="80" cy="165" r="3" fill="#FFD700" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} />
        <motion.circle cx="120" cy="170" r="2" fill="#FFD700" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />

        {/* Neck */}
        <rect x="92" y="128" width="16" height="20" rx="8" fill="url(#skinGradUnicorn)" />

        {/* Head */}
        <ellipse cx="100" cy="92" rx="42" ry="45" fill="url(#skinGradUnicorn)" />

        {/* Rosy cheeks */}
        <ellipse cx="70" cy="102" rx="10" ry="7" fill="#FFB6C1" opacity="0.6" />
        <ellipse cx="130" cy="102" rx="10" ry="7" fill="#FFB6C1" opacity="0.6" />

        {/* Sparkly eyes */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*90})`}>
          <ellipse cx="80" cy="90" rx="11" ry="13" fill="white" />
          <ellipse cx="120" cy="90" rx="11" ry="13" fill="white" />
          <circle cx="82" cy="92" r="6" fill="#9B59B6" />
          <circle cx="122" cy="92" r="6" fill="#9B59B6" />
          <circle cx="84" cy="89" r="2.5" fill="white" />
          <circle cx="124" cy="89" r="2.5" fill="white" />
          {/* Star sparkles in eyes */}
          <motion.polygon
            points="78,95 79,97 81,97 79.5,98.5 80,100 78,99 76,100 76.5,98.5 75,97 77,97"
            fill="#FFD700"
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        </g>

        {/* Nose */}
        <ellipse cx="100" cy="105" rx="4" ry="3" fill={adjustColor(skinTone, -15)} opacity="0.5" />

        {/* Mouth */}
        {renderMouth(config.mouthType, 100, 115)}

        {/* Rainbow flowing hair */}
        <path d="M 58 60 Q 40 85 45 130 Q 42 150 50 170" stroke="url(#rainbowGrad)" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M 65 55 Q 45 80 50 125" stroke="url(#rainbowGrad)" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M 142 60 Q 160 85 155 130 Q 158 150 150 170" stroke="url(#rainbowGrad)" strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M 135 55 Q 155 80 150 125" stroke="url(#rainbowGrad)" strokeWidth="10" fill="none" strokeLinecap="round" />
        {/* Hair top */}
        <ellipse cx="100" cy="52" rx="45" ry="20" fill={hairColor} />

        {/* Unicorn Horn */}
        <motion.path
          d="M 100 15 L 90 55 L 110 55 Z"
          fill="url(#rainbowGrad)"
          filter="url(#unicornGlow)"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {/* Horn spiral lines */}
        <path d="M 95 50 L 99 30" stroke="white" strokeWidth="2" opacity="0.5" />
        <path d="M 100 45 L 100 25" stroke="white" strokeWidth="2" opacity="0.5" />

        {/* Unicorn ears */}
        <path d="M 55 55 L 60 35 L 70 55" fill={skinTone} stroke={adjustColor(skinTone, -20)} strokeWidth="2" />
        <path d="M 145 55 L 140 35 L 130 55" fill={skinTone} stroke={adjustColor(skinTone, -20)} strokeWidth="2" />
      </svg>
  )
}
