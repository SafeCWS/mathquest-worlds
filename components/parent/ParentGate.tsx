'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAnalyticsStore } from '@/lib/stores/analyticsStore'

interface ParentGateProps {
  onSuccess: () => void
  onCancel?: () => void
}

export function ParentGate({ onSuccess, onCancel }: ParentGateProps) {
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { verifyPin } = useAnalyticsStore()

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value.slice(-1)
    setPin(newPin)
    setError(false)

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newPin.every(d => d !== '') && index === 3) {
      const fullPin = newPin.join('')
      if (verifyPin(fullPin)) {
        onSuccess()
      } else {
        setError(true)
        setShake(true)
        setTimeout(() => {
          setShake(false)
          setPin(['', '', '', ''])
          inputRefs.current[0]?.focus()
        }, 500)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">
            <span role="img" aria-label="lock">&#x1F512;</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Parent Access</h2>
          <p className="text-gray-600 mt-2">Enter your 4-digit PIN</p>
          <p className="text-sm text-gray-400 mt-1">Default: 1234</p>
        </div>

        <motion.div
          className="flex justify-center gap-3 mb-6"
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-colors outline-none ${
                error
                  ? 'border-red-400 bg-red-50'
                  : digit
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
              } focus:border-blue-500 focus:bg-white`}
            />
          ))}
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              className="text-red-500 text-center mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Incorrect PIN. Try again.
            </motion.p>
          )}
        </AnimatePresence>

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}
