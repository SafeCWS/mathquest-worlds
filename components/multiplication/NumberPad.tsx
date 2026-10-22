'use client'

import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'

interface NumberPadProps {
  onSubmit: (value: number) => void
  maxValue?: number
  label?: string
  /** Accessible names for the glyph-only keys + the display. */
  deleteLabel?: string
  checkLabel?: string
  displayLabel?: string
}

// Calm pad (2026-10-22) — ONE colour family (white keys, dark navy digits,
// soft shadow), digits ≥ 32px, ✓ teal-green when enabled, ⌫ grey. No red/rainbow on child screens.
const KEY_BASE =
  'np-key w-[64px] h-[64px] rounded-2xl bg-white border-2 border-slate-200 shadow-[0_3px_0_rgb(203_213_225),0_6px_14px_rgb(15_23_42/0.10)] flex items-center justify-center font-bold'
const KEY_DIGIT = `${KEY_BASE} text-[34px] text-[var(--space-primary)]`

export default function NumberPad({
  onSubmit,
  maxValue = 100,
  label = 'Your answer:',
  deleteLabel = 'Erase',
  checkLabel = 'Check my answer',
  displayLabel = 'Your answer so far',
}: NumberPadProps) {
  const [display, setDisplay] = useState('')

  const handleDigit = useCallback((digit: number) => {
    sounds.playSelect()
    setDisplay(prev => {
      const next = prev + String(digit)
      // Prevent exceeding maxValue
      if (Number(next) > maxValue) return prev
      return next
    })
  }, [maxValue])

  const handleBackspace = useCallback(() => {
    sounds.playClick()
    setDisplay(prev => prev.slice(0, -1))
  }, [])

  const handleSubmit = useCallback(() => {
    if (display === '') return
    const value = Number(display)
    onSubmit(value)
    setDisplay('')
  }, [display, onSubmit])

  return (
    <div className="np-root flex flex-col items-center gap-3">
      {/* Label */}
      <p className="np-label text-lg font-semibold text-gray-600">{label}</p>

      {/* Display field */}
      <motion.div
        className="np-display w-full max-w-[220px] h-16 bg-white rounded-2xl border-4 border-indigo-300
                   flex items-center justify-center text-4xl font-bold text-indigo-700
                   shadow-inner"
        animate={display ? { borderColor: '#818cf8' } : { borderColor: '#a5b4fc' }}
        role="status"
        aria-live="polite"
        aria-label={`${displayLabel}: ${display || '—'}`}
      >
        {display || <span className="text-gray-300 text-2xl">...</span>}
      </motion.div>

      {/* Keypad grid: 1-9 in 3x3, then backspace-0-submit */}
      <div className="np-keys grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
          <motion.button
            key={digit}
            className={KEY_DIGIT}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleDigit(digit)}
          >
            {digit}
          </motion.button>
        ))}

        {/* Bottom row: backspace, 0, submit */}
        <motion.button
          className="np-key w-[64px] h-[64px] rounded-2xl bg-slate-200 border-2 border-slate-300 text-slate-700 text-[30px] font-bold shadow-[0_3px_0_rgb(148_163_184)] flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleBackspace}
          aria-label={deleteLabel}
        >
          <span>&#9003;</span>
        </motion.button>

        <motion.button
          className={KEY_DIGIT}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => handleDigit(0)}
        >
          0
        </motion.button>

        <motion.button
          className={`np-key w-[64px] h-[64px] rounded-2xl text-[32px] font-bold flex items-center justify-center border-2
                     ${display
                       ? 'bg-gradient-to-b from-teal-600 to-emerald-700 border-teal-500 text-white shadow-[0_3px_0_rgb(4_120_87)]'
                       : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
          whileTap={display ? { scale: 0.9 } : {}}
          whileHover={display ? { scale: 1.05 } : {}}
          onClick={handleSubmit}
          disabled={!display}
          aria-label={checkLabel}
        >
          <span>&#10003;</span>
        </motion.button>
      </div>
    </div>
  )
}
