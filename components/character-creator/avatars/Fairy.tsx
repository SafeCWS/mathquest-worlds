'use client'

import React from 'react'
import { motion } from 'motion/react'
import { emotionConfig, adjustColor, renderMouth, type AvatarRenderProps } from './shared'

// Fairy avatar — extracted from PresetAvatars.tsx (Phase 1.3).
// Rendered by PresetAvatar via the avatarComponents map in ./index.ts.
export function FairyAvatar({ emotion, skinTone, hairColor, primaryColor, size }: AvatarRenderProps) {
  const config = emotionConfig[emotion]
  return (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="skinGradFairy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(skinTone, 10)} />
            <stop offset="100%" stopColor={adjustColor(skinTone, -10)} />
          </linearGradient>
          <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E1BEE7" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#CE93D8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#BA68C8" stopOpacity="0.4" />
          </linearGradient>
          <filter id="fairyGlow">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Wings */}
        <motion.ellipse
          cx="45" cy="100" rx="30" ry="45"
          fill="url(#wingGrad)"
          filter="url(#fairyGlow)"
          animate={{ scaleX: [1, 0.85, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ transformOrigin: '65px 100px' }}
        />
        <motion.ellipse
          cx="155" cy="100" rx="30" ry="45"
          fill="url(#wingGrad)"
          filter="url(#fairyGlow)"
          animate={{ scaleX: [1, 0.85, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ transformOrigin: '135px 100px' }}
        />
        <motion.ellipse
          cx="55" cy="130" rx="20" ry="30"
          fill="url(#wingGrad)"
          filter="url(#fairyGlow)"
          animate={{ scaleX: [1, 0.8, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
          style={{ transformOrigin: '70px 130px' }}
        />
        <motion.ellipse
          cx="145" cy="130" rx="20" ry="30"
          fill="url(#wingGrad)"
          filter="url(#fairyGlow)"
          animate={{ scaleX: [1, 0.8, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
          style={{ transformOrigin: '130px 130px' }}
        />

        {/* Dress body */}
        <path d="M 70 145 Q 55 180 65 195 L 135 195 Q 145 180 130 145 Q 100 155 70 145" fill={primaryColor} />
        <path d="M 75 145 Q 100 150 125 145 Q 110 160 100 180 Q 90 160 75 145" fill={adjustColor(primaryColor, 25)} />

        {/* Neck */}
        <rect x="92" y="128" width="16" height="20" rx="8" fill="url(#skinGradFairy)" />

        {/* Head */}
        <ellipse cx="100" cy="92" rx="42" ry="45" fill="url(#skinGradFairy)" />

        {/* Rosy cheeks */}
        <ellipse cx="70" cy="102" rx="10" ry="7" fill="#FFB6C1" opacity="0.7" />
        <ellipse cx="130" cy="102" rx="10" ry="7" fill="#FFB6C1" opacity="0.7" />

        {/* Sparkly eyes */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*90})`}>
          <ellipse cx="80" cy="90" rx="11" ry="13" fill="white" />
          <ellipse cx="120" cy="90" rx="11" ry="13" fill="white" />
          <circle cx="82" cy="92" r="6" fill="#E91E63" />
          <circle cx="122" cy="92" r="6" fill="#E91E63" />
          <circle cx="84" cy="89" r="2.5" fill="white" />
          <circle cx="124" cy="89" r="2.5" fill="white" />
          {/* Sparkles in eyes */}
          <motion.polygon
            points="78,95 79,97 81,97 79.5,98.5 80,100.5 78,99 76,100.5 76.5,98.5 75,97 77,97"
            fill="#FFD700"
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <motion.polygon
            points="118,95 119,97 121,97 119.5,98.5 120,100.5 118,99 116,100.5 116.5,98.5 115,97 117,97"
            fill="#FFD700"
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          />
        </g>

        {/* Cute nose */}
        <ellipse cx="100" cy="105" rx="4" ry="3" fill={adjustColor(skinTone, -15)} opacity="0.5" />

        {/* Mouth */}
        {renderMouth(config.mouthType, 100, 115)}

        {/* Flowing hair */}
        <path d="M 58 60 Q 45 80 50 120 Q 48 140 55 160" stroke={hairColor} strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M 65 55 Q 50 75 55 115" stroke={hairColor} strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M 142 60 Q 155 80 150 120 Q 152 140 145 160" stroke={hairColor} strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M 135 55 Q 150 75 145 115" stroke={hairColor} strokeWidth="10" fill="none" strokeLinecap="round" />
        {/* Hair top */}
        <ellipse cx="100" cy="52" rx="45" ry="20" fill={hairColor} />

        {/* Flower crown */}
        <circle cx="70" cy="50" r="8" fill={primaryColor} />
        <circle cx="85" cy="42" r="7" fill={adjustColor(primaryColor, 30)} />
        <circle cx="100" cy="38" r="9" fill={primaryColor} />
        <circle cx="115" cy="42" r="7" fill={adjustColor(primaryColor, 30)} />
        <circle cx="130" cy="50" r="8" fill={primaryColor} />
        {/* Flower centers */}
        <circle cx="70" cy="50" r="3" fill="#FFD700" />
        <circle cx="85" cy="42" r="2.5" fill="#FFD700" />
        <circle cx="100" cy="38" r="3.5" fill="#FFD700" />
        <circle cx="115" cy="42" r="2.5" fill="#FFD700" />
        <circle cx="130" cy="50" r="3" fill="#FFD700" />
      </svg>
  )
}
