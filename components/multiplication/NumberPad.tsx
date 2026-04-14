'use client'

import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'

interface NumberPadProps {
  onSubmit: (value: number) => void
  maxValue?: number
  label?: string
}

const DIGIT_COLORS = [
  'from-gray-400 to-gray-500',      // 0
  'from-red-400 to-red-500',        // 1
  'from-orange-400 to-orange-500',  // 2
  'from-yellow-400 to-yellow-500',  // 3
  'from-green-400 to-green-500',    // 4
  'from-teal-400 to-teal-500',     // 5
  'from-blue-400 to-blue-500',     // 6
  'from-indigo-400 to-indigo-500', // 7
  'from-purple-400 to-purple-500', // 8
  'from-pink-400 to-pink-500',     // 9
]

export default function NumberPad({ onSubmit, maxValue = 100, label = 'Your answer:' }: NumberPadProps) {
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
    <div className="flex flex-col items-center gap-3">
      {/* Label */}
      <p className="text-lg font-semibold text-gray-600">{label}</p>

      {/* Display field */}
      <motion.div
        className="w-full max-w-[220px] h-16 bg-white rounded-2xl border-4 border-indigo-300
                   flex items-center justify-center text-4xl font-bold text-indigo-700
                   shadow-inner"
        animate={display ? { borderColor: '#818cf8' } : { borderColor: '#a5b4fc' }}
      >
        {display || <span className="text-gray-300 text-2xl">...</span>}
      </motion.div>

      {/* Keypad grid: 1-9 in 3x3, then backspace-0-submit */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
          <motion.button
            key={digit}
            className={`w-[60px] h-[60px] rounded-2xl bg-gradient-to-b ${DIGIT_COLORS[digit]}
                       text-white text-2xl font-bold shadow-lg border-2 border-white/30
                       flex items-center justify-center`}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleDigit(digit)}
          >
            {digit}
          </motion.button>
        ))}

        {/* Bottom row: backspace, 0, submit */}
        <motion.button
          className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-b from-gray-300 to-gray-400
                     text-gray-700 text-2xl font-bold shadow-lg border-2 border-white/30
                     flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleBackspace}
        >
          <span className="text-xl">&#9003;</span>
        </motion.button>

        <motion.button
          className={`w-[60px] h-[60px] rounded-2xl bg-gradient-to-b ${DIGIT_COLORS[0]}
                     text-white text-2xl font-bold shadow-lg border-2 border-white/30
                     flex items-center justify-center`}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => handleDigit(0)}
        >
          0
        </motion.button>

        <motion.button
          className={`w-[60px] h-[60px] rounded-2xl bg-gradient-to-b
                     ${display ? 'from-emerald-400 to-emerald-600' : 'from-gray-200 to-gray-300'}
                     text-white text-2xl font-bold shadow-lg border-2 border-white/30
                     flex items-center justify-center
                     ${!display ? 'opacity-50 cursor-not-allowed' : ''}`}
          whileTap={display ? { scale: 0.9 } : {}}
          whileHover={display ? { scale: 1.05 } : {}}
          onClick={handleSubmit}
          disabled={!display}
        >
          <span className="text-xl">&#10003;</span>
        </motion.button>
      </div>
    </div>
  )
}
