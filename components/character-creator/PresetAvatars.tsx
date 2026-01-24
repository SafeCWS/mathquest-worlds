'use client'

import React from 'react'
import { motion } from 'motion/react'

export type AvatarStyle =
  | 'explorer'
  | 'wizard'
  | 'astronaut'
  | 'pirate'
  | 'ninja'
  | 'fairy'
  | 'robot'
  | 'superhero'
  | 'unicorn'
  | 'scientist'
  | 'dragon'
  | 'mermaid'

export type AvatarEmotion = 'neutral' | 'happy' | 'excited' | 'thinking' | 'sad' | 'celebrating'

interface PresetAvatarProps {
  style: AvatarStyle
  emotion?: AvatarEmotion
  skinTone?: string
  hairColor?: string
  primaryColor?: string
  size?: number
  animate?: boolean
  onClick?: () => void
  selected?: boolean
}

// Cute, kid-friendly illustrated avatars
export function PresetAvatar({
  style,
  emotion = 'happy',
  skinTone = '#FFDFC4',
  hairColor = '#3D2314',
  primaryColor = '#4A90D9',
  size = 200,
  animate = true,
  onClick,
  selected = false
}: PresetAvatarProps) {
  const scale = size / 200

  // Emotion configurations
  const emotionConfig = {
    neutral: { eyeScale: 1, mouthType: 'smile', bounce: 5 },
    happy: { eyeScale: 1.1, mouthType: 'bigSmile', bounce: 10 },
    excited: { eyeScale: 1.3, mouthType: 'open', bounce: 20 },
    thinking: { eyeScale: 0.9, mouthType: 'hmm', bounce: 2 },
    sad: { eyeScale: 0.85, mouthType: 'frown', bounce: 2 },
    celebrating: { eyeScale: 1.2, mouthType: 'cheer', bounce: 30 }
  }

  const config = emotionConfig[emotion]

  const avatarComponents: Record<AvatarStyle, React.ReactElement> = {
    // Explorer Avatar - Adventure Kid with Hat
    explorer: (
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
    ),

    // Wizard Avatar - Magical Kid
    wizard: (
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
    ),

    // Astronaut Avatar
    astronaut: (
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
    ),

    // Pirate Avatar
    pirate: (
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
    ),

    // Ninja Avatar
    ninja: (
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
    ),

    // Fairy Avatar
    fairy: (
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
    ),

    // Robot Avatar
    robot: (
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
    ),

    // Superhero Avatar
    superhero: (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="skinGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(skinTone, 10)} />
            <stop offset="100%" stopColor={adjustColor(skinTone, -10)} />
          </linearGradient>
          <linearGradient id="capeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={adjustColor(primaryColor, -30)} />
          </linearGradient>
        </defs>

        {/* Cape */}
        <motion.path
          fill="url(#capeGrad)"
          d="M 50 95 Q 30 130 40 195 L 160 195 Q 170 130 150 95"
          initial={{ d: "M 50 95 Q 30 130 40 195 L 160 195 Q 170 130 150 95" }}
          animate={{ d: [
            "M 50 95 Q 30 130 40 195 L 160 195 Q 170 130 150 95",
            "M 50 95 Q 25 135 45 195 L 155 195 Q 175 135 150 95",
            "M 50 95 Q 30 130 40 195 L 160 195 Q 170 130 150 95"
          ]}}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Body - Hero suit */}
        <ellipse cx="100" cy="160" rx="35" ry="30" fill={primaryColor} />
        {/* Chest emblem */}
        <polygon points="100,140 115,160 100,175 85,160" fill="#FFD700" />
        <polygon points="100,145 110,160 100,170 90,160" fill={adjustColor(primaryColor, 20)} />

        {/* Neck */}
        <rect x="92" y="125" width="16" height="20" rx="8" fill="url(#skinGradHero)" />

        {/* Head */}
        <ellipse cx="100" cy="90" rx="43" ry="46" fill="url(#skinGradHero)" />

        {/* Mask */}
        <path d="M 57 75 L 57 100 Q 100 115 143 100 L 143 75 Q 100 55 57 75" fill={primaryColor} />

        {/* Mask eye holes */}
        <ellipse cx="78" cy="88" rx="15" ry="12" fill="url(#skinGradHero)" />
        <ellipse cx="122" cy="88" rx="15" ry="12" fill="url(#skinGradHero)" />

        {/* Eyes showing through mask */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*88})`}>
          <ellipse cx="78" cy="88" rx="10" ry="11" fill="white" />
          <ellipse cx="122" cy="88" rx="10" ry="11" fill="white" />
          <circle cx="80" cy="89" r="5" fill="#2196F3" />
          <circle cx="124" cy="89" r="5" fill="#2196F3" />
          <circle cx="82" cy="87" r="2" fill="white" />
          <circle cx="126" cy="87" r="2" fill="white" />
        </g>

        {/* Heroic eyebrows */}
        <path d="M 62 78 L 90 82" stroke={hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 138 78 L 110 82" stroke={hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Nose */}
        <ellipse cx="100" cy="100" rx="4" ry="3" fill={adjustColor(skinTone, -15)} opacity="0.5" />

        {/* Determined smile */}
        <path d="M 85 115 Q 100 125 115 115" stroke="#D35400" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Hair showing above mask */}
        <path d="M 62 70 Q 70 50 100 45 Q 130 50 138 70" fill={hairColor} />
        <path d="M 100 45 L 105 35 L 100 42 L 95 35 Z" fill={hairColor} />
      </svg>
    ),

    // Unicorn Avatar - Magical Unicorn Kid
    unicorn: (
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
    ),

    // Scientist Avatar - Lab Coat Kid
    scientist: (
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
    ),

    // Dragon Avatar - Dragon Kid
    dragon: (
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
    ),

    // Mermaid Avatar - Ocean Kid
    mermaid: (
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="skinGradMermaid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(skinTone, 10)} />
            <stop offset="100%" stopColor={adjustColor(skinTone, -10)} />
          </linearGradient>
          <linearGradient id="tailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="50%" stopColor={adjustColor(primaryColor, -15)} />
            <stop offset="100%" stopColor={adjustColor(primaryColor, -30)} />
          </linearGradient>
          <linearGradient id="finGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={adjustColor(primaryColor, 20)} stopOpacity="0.8" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Tail fin */}
        <motion.g
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ transformOrigin: '100px 185px' }}
        >
          <path d="M 70 180 Q 50 195 60 200 Q 100 190 140 200 Q 150 195 130 180" fill="url(#finGrad)" />
        </motion.g>

        {/* Tail body */}
        <path d="M 70 140 Q 65 160 70 180 L 130 180 Q 135 160 130 140 Q 100 150 70 140" fill="url(#tailGrad)" />
        {/* Scale pattern on tail */}
        {[0, 1, 2].map(row => (
          [0, 1, 2, 3].map(col => (
            <ellipse
              key={`${row}-${col}`}
              cx={80 + col * 15 - (row % 2) * 7}
              cy={150 + row * 12}
              rx="6"
              ry="5"
              fill={adjustColor(primaryColor, -10)}
              opacity="0.5"
            />
          ))
        ))}

        {/* Shell top */}
        <ellipse cx="85" cy="140" rx="12" ry="10" fill="#F48FB1" />
        <ellipse cx="115" cy="140" rx="12" ry="10" fill="#F48FB1" />
        <path d="M 78 145 Q 85 135 92 145" stroke="#E91E63" strokeWidth="1.5" fill="none" />
        <path d="M 108 145 Q 115 135 122 145" stroke="#E91E63" strokeWidth="1.5" fill="none" />

        {/* Neck */}
        <rect x="92" y="118" width="16" height="25" rx="8" fill="url(#skinGradMermaid)" />

        {/* Head */}
        <ellipse cx="100" cy="85" rx="42" ry="45" fill="url(#skinGradMermaid)" />

        {/* Rosy cheeks */}
        <ellipse cx="70" cy="95" rx="10" ry="7" fill="#FFB6C1" opacity="0.6" />
        <ellipse cx="130" cy="95" rx="10" ry="7" fill="#FFB6C1" opacity="0.6" />

        {/* Eyes */}
        <g transform={`scale(${config.eyeScale}) translate(${(1-config.eyeScale)*100} ${(1-config.eyeScale)*85})`}>
          <ellipse cx="80" cy="85" rx="11" ry="13" fill="white" />
          <ellipse cx="120" cy="85" rx="11" ry="13" fill="white" />
          <circle cx="82" cy="87" r="6" fill="#00BCD4" />
          <circle cx="122" cy="87" r="6" fill="#00BCD4" />
          <circle cx="84" cy="84" r="2.5" fill="white" />
          <circle cx="124" cy="84" r="2.5" fill="white" />
        </g>

        {/* Eyelashes */}
        <path d="M 68 80 L 72 78" stroke={hairColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M 70 77 L 75 76" stroke={hairColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M 132 80 L 128 78" stroke={hairColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M 130 77 L 125 76" stroke={hairColor} strokeWidth="2" strokeLinecap="round" />

        {/* Nose */}
        <ellipse cx="100" cy="98" rx="4" ry="3" fill={adjustColor(skinTone, -15)} opacity="0.5" />

        {/* Mouth */}
        {renderMouth(config.mouthType, 100, 108)}

        {/* Flowing hair */}
        <path d="M 58 55 Q 35 80 40 130 Q 35 155 45 175" stroke={hairColor} strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M 65 50 Q 40 75 48 120" stroke={hairColor} strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M 142 55 Q 165 80 160 130 Q 165 155 155 175" stroke={hairColor} strokeWidth="14" fill="none" strokeLinecap="round" />
        <path d="M 135 50 Q 160 75 152 120" stroke={hairColor} strokeWidth="10" fill="none" strokeLinecap="round" />
        {/* Hair top */}
        <ellipse cx="100" cy="48" rx="45" ry="22" fill={hairColor} />

        {/* Shell crown/accessory */}
        <path d="M 80 40 Q 85 30 90 40" fill="#F48FB1" />
        <path d="M 95 38 Q 100 25 105 38" fill="#FFB6C1" />
        <path d="M 110 40 Q 115 30 120 40" fill="#F48FB1" />

        {/* Starfish accessory */}
        <motion.polygon
          points="60,52 62,58 68,58 63,62 65,68 60,64 55,68 57,62 52,58 58,58"
          fill="#FFD700"
          animate={{ rotate: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ transformOrigin: '60px 60px' }}
        />

        {/* Bubbles */}
        <motion.circle cx="45" cy="100" r="4" fill="#90CAF9" opacity="0.5" animate={{ y: [0, -30], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="155" cy="110" r="3" fill="#90CAF9" opacity="0.5" animate={{ y: [0, -25], opacity: [0.5, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} />
        <motion.circle cx="50" cy="130" r="2" fill="#90CAF9" opacity="0.5" animate={{ y: [0, -20], opacity: [0.5, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: 1 }} />
      </svg>
    )
  }

  return (
    <motion.div
      className={`relative cursor-pointer ${selected ? 'ring-4 ring-yellow-400 ring-offset-2' : ''} rounded-2xl overflow-hidden`}
      onClick={onClick}
      animate={animate ? { y: [0, -config.bounce, 0] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {avatarComponents[style]}

      {/* Selection indicator */}
      {selected && (
        <motion.div
          className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-4xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            ✓
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Mouth renderer helper
function renderMouth(type: string, cx: number, cy: number, scale = 1) {
  const mouthProps = { strokeLinecap: 'round' as const, fill: 'none' }

  switch (type) {
    case 'bigSmile':
      return (
        <path
          d={`M ${cx - 15 * scale} ${cy} Q ${cx} ${cy + 15 * scale} ${cx + 15 * scale} ${cy}`}
          stroke="#D35400"
          strokeWidth={3 * scale}
          {...mouthProps}
        />
      )
    case 'open':
      return (
        <ellipse
          cx={cx}
          cy={cy}
          rx={10 * scale}
          ry={12 * scale}
          fill="#D35400"
        />
      )
    case 'cheer':
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx={12 * scale} ry={10 * scale} fill="#D35400" />
          <ellipse cx={cx} cy={cy + 5 * scale} rx={8 * scale} ry={5 * scale} fill="#FF9999" />
        </g>
      )
    case 'hmm':
      return (
        <path
          d={`M ${cx - 8 * scale} ${cy} L ${cx + 8 * scale} ${cy}`}
          stroke="#D35400"
          strokeWidth={3 * scale}
          {...mouthProps}
        />
      )
    case 'frown':
      return (
        <path
          d={`M ${cx - 12 * scale} ${cy + 5 * scale} Q ${cx} ${cy - 8 * scale} ${cx + 12 * scale} ${cy + 5 * scale}`}
          stroke="#D35400"
          strokeWidth={3 * scale}
          {...mouthProps}
        />
      )
    default: // smile
      return (
        <path
          d={`M ${cx - 12 * scale} ${cy} Q ${cx} ${cy + 10 * scale} ${cx + 12 * scale} ${cy}`}
          stroke="#D35400"
          strokeWidth={3 * scale}
          {...mouthProps}
        />
      )
  }
}

// Color adjustment utility
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

// Avatar selection grid component
export function AvatarSelector({
  selectedStyle,
  onSelect,
  skinTone,
  primaryColor
}: {
  selectedStyle: AvatarStyle
  onSelect: (style: AvatarStyle) => void
  skinTone?: string
  primaryColor?: string
}) {
  const avatarStyles: AvatarStyle[] = [
    'explorer',
    'wizard',
    'astronaut',
    'pirate',
    'ninja',
    'fairy',
    'robot',
    'superhero',
    'unicorn',
    'scientist',
    'dragon',
    'mermaid'
  ]

  const avatarLabels: Record<AvatarStyle, string> = {
    explorer: '🌴 Explorer',
    wizard: '✨ Wizard',
    astronaut: '🚀 Astronaut',
    pirate: '🏴‍☠️ Pirate',
    ninja: '🥷 Ninja',
    fairy: '🧚 Fairy',
    robot: '🤖 Robot',
    superhero: '🦸 Superhero',
    unicorn: '🦄 Unicorn',
    scientist: '🔬 Scientist',
    dragon: '🐲 Dragon',
    mermaid: '🧜‍♀️ Mermaid'
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {avatarStyles.map((style) => (
        <motion.div
          key={style}
          className="flex flex-col items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <PresetAvatar
            style={style}
            size={120}
            selected={selectedStyle === style}
            onClick={() => onSelect(style)}
            skinTone={skinTone}
            primaryColor={primaryColor}
            animate={selectedStyle === style}
          />
          <span className={`text-sm font-medium ${selectedStyle === style ? 'text-yellow-600' : 'text-gray-600'}`}>
            {avatarLabels[style]}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
