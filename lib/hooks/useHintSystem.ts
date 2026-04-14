'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion } from 'motion/react'
import React from 'react'

export type HintLevel = 0 | 1 | 2 | 3

interface HintShowProps {
  groups: boolean
  additionBridge: boolean
  answer: boolean
}

interface HintSystemReturn {
  hintLevel: HintLevel
  showHint: () => void
  resetHint: () => void
  totalHintsUsed: number
  visualProps: HintShowProps
  hintPenalty: number
}

const HINT_LEVEL_MAP: Record<HintLevel, HintShowProps> = {
  0: { groups: false, additionBridge: false, answer: false },
  1: { groups: false, additionBridge: true, answer: false },
  2: { groups: true, additionBridge: true, answer: false },
  3: { groups: true, additionBridge: true, answer: true },
}

export function useHintSystem(): HintSystemReturn {
  const [hintLevel, setHintLevel] = useState<HintLevel>(0)
  const [totalHintsUsed, setTotalHintsUsed] = useState(0)

  const showHint = useCallback(() => {
    setHintLevel(prev => {
      if (prev >= 3) return 3
      const next = (prev + 1) as HintLevel
      return next
    })
    setTotalHintsUsed(prev => prev + 1)
  }, [])

  const resetHint = useCallback(() => {
    setHintLevel(0)
  }, [])

  const visualProps = useMemo(() => HINT_LEVEL_MAP[hintLevel], [hintLevel])
  const hintPenalty = useMemo(() => Math.min(totalHintsUsed * 0.5, 2), [totalHintsUsed])

  return { hintLevel, showHint, resetHint, totalHintsUsed, visualProps, hintPenalty }
}

interface HintButtonProps {
  onTap: () => void
  hintLevel: HintLevel
}

const HINT_LABELS: Record<HintLevel, string> = {
  0: 'Show me!',
  1: 'Show more!',
  2: 'Tell me!',
  3: '',
}

export function HintButton({ onTap, hintLevel }: HintButtonProps) {
  if (hintLevel >= 3) return null

  const label = HINT_LABELS[hintLevel]

  return React.createElement(
    motion.button,
    {
      className: 'bg-amber-400/80 text-amber-900 rounded-full px-4 py-2 min-h-[48px] ' +
        'font-bold text-base shadow-md flex items-center gap-2',
      whileTap: { scale: 0.95 },
      onClick: onTap,
    },
    React.createElement('span', { className: 'text-xl' }, '\uD83D\uDCA1'),
    label,
  )
}
