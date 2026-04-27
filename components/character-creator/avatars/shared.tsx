// Shared types, helpers, and emotion config for all preset avatars.
// Extracted from PresetAvatars.tsx so each avatar style lives in its own file
// (Phase 1.3 — splitting the 1235-LOC monolith).

import React from 'react'

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

export interface AvatarRenderProps {
  emotion: AvatarEmotion
  skinTone: string
  hairColor: string
  primaryColor: string
  size: number
}

export interface EmotionConfig {
  eyeScale: number
  mouthType: string
  bounce: number
}

export const emotionConfig: Record<AvatarEmotion, EmotionConfig> = {
  neutral: { eyeScale: 1, mouthType: 'smile', bounce: 5 },
  happy: { eyeScale: 1.1, mouthType: 'bigSmile', bounce: 10 },
  excited: { eyeScale: 1.3, mouthType: 'open', bounce: 20 },
  thinking: { eyeScale: 0.9, mouthType: 'hmm', bounce: 2 },
  sad: { eyeScale: 0.85, mouthType: 'frown', bounce: 2 },
  celebrating: { eyeScale: 1.2, mouthType: 'cheer', bounce: 30 },
}

// Mouth renderer used by every avatar. Keep this stable — string keys must
// match the EmotionConfig.mouthType values above.
export function renderMouth(type: string, cx: number, cy: number, scale = 1) {
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

// Lighten or darken a hex color by a percentage. Used for skin/primary
// gradients across every avatar style.
export function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}
