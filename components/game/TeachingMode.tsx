'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'
import { Avatar3D } from '@/components/character-creator/Avatar3D'
import type { MathProblem } from '@/lib/stores/gameStore'

interface TeachingModeProps {
  problem: MathProblem
  onComplete: () => void
  worldEmoji?: string
}

// Fun animals/objects for visual math teaching
const TEACHING_OBJECTS = [
  '🍎', '🍌', '🍊', '🐶', '🐱', '🐰', '🦋', '🌟', '🎈', '🍪',
  '🦁', '🐘', '🦒', '🐧', '🦄', '🌈', '🍕', '🍩', '🧁', '🎂'
]

export function TeachingMode({ problem, onComplete, worldEmoji = '🌟' }: TeachingModeProps) {
  const [step, setStep] = useState(0)
  const [animatingCount, setAnimatingCount] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const teachingObject = TEACHING_OBJECTS[Math.floor(Math.random() * TEACHING_OBJECTS.length)]

  // Auto-advance steps
  useEffect(() => {
    if (step === 0) {
      // Introduction
      const timer = setTimeout(() => setStep(1), 2000)
      return () => clearTimeout(timer)
    }
    if (step === 1 && problem.type === 'counting') {
      // Count animation
      const interval = setInterval(() => {
        setAnimatingCount(prev => {
          if (prev < problem.answer) return prev + 1
          clearInterval(interval)
          setTimeout(() => setStep(2), 500)
          return prev
        })
      }, 600)
      return () => clearInterval(interval)
    }
    if (step === 1 && problem.type === 'addition') {
      // Show first group, then second, then combine
      const timer1 = setTimeout(() => setAnimatingCount(1), 1000) // First group
      const timer2 = setTimeout(() => setAnimatingCount(2), 2500) // Second group
      const timer3 = setTimeout(() => {
        setAnimatingCount(3) // Combined
        setShowAnswer(true)
      }, 4000)
      const timer4 = setTimeout(() => setStep(2), 6000)
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        clearTimeout(timer4)
      }
    }
    if (step === 1 && problem.type === 'subtraction') {
      // Show all, then remove, then show remaining
      const timer1 = setTimeout(() => setAnimatingCount(1), 1000) // All objects
      const timer2 = setTimeout(() => setAnimatingCount(2), 3000) // Cross out
      const timer3 = setTimeout(() => {
        setAnimatingCount(3) // Remaining
        setShowAnswer(true)
      }, 5000)
      const timer4 = setTimeout(() => setStep(2), 7000)
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        clearTimeout(timer4)
      }
    }
  }, [step, problem])

  const renderTeachingContent = () => {
    switch (problem.type) {
      case 'counting':
        return (
          <div className="text-center">
            <motion.h3
              className="text-2xl font-bold text-white mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Let&apos;s count together! 🎉
            </motion.h3>

            <div className="bg-white/95 rounded-3xl p-6 shadow-xl max-w-md mx-auto">
              {/* Counting grid */}
              <div className="flex flex-wrap gap-3 justify-center mb-4">
                {Array.from({ length: problem.answer }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="relative"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: i < animatingCount ? 1 : 0,
                      opacity: i < animatingCount ? 1 : 0
                    }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                  >
                    <span className="text-4xl">{teachingObject}</span>
                    {/* Number label */}
                    <motion.span
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2
                                 bg-purple-500 text-white text-sm font-bold
                                 rounded-full w-6 h-6 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: i < animatingCount ? 1 : 0 }}
                      transition={{ delay: i * 0.1 + 0.2 }}
                    >
                      {i + 1}
                    </motion.span>
                  </motion.div>
                ))}
              </div>

              {/* Count display */}
              <motion.div
                className="text-4xl font-bold text-purple-600 mt-8"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.3 }}
                key={animatingCount}
              >
                {animatingCount > 0 && (
                  <>
                    Count: <span className="text-green-500">{animatingCount}</span>
                    {animatingCount === problem.answer && ' ✓'}
                  </>
                )}
              </motion.div>
            </div>
          </div>
        )

      case 'addition':
        return (
          <div className="text-center">
            <motion.h3
              className="text-2xl font-bold text-white mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Let me show you how to add! ➕
            </motion.h3>

            <div className="bg-white/95 rounded-3xl p-6 shadow-xl max-w-lg mx-auto">
              {/* Problem display */}
              <div className="text-3xl font-bold mb-6 flex items-center justify-center gap-3">
                <span className="bg-blue-100 px-4 py-2 rounded-xl">{problem.num1}</span>
                <span className="text-green-500">+</span>
                <span className="bg-green-100 px-4 py-2 rounded-xl">{problem.num2}</span>
                <span>=</span>
                <motion.span
                  className="bg-yellow-200 px-4 py-2 rounded-xl"
                  animate={showAnswer ? { scale: [1, 1.3, 1], backgroundColor: ['#fef08a', '#86efac', '#fef08a'] } : {}}
                >
                  {showAnswer ? problem.answer : '?'}
                </motion.span>
              </div>

              {/* Visual groups */}
              <div className="flex justify-center items-center gap-8 flex-wrap">
                {/* First group */}
                <motion.div
                  className="bg-blue-50 p-4 rounded-2xl"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: animatingCount >= 1 ? 1 : 0, x: animatingCount >= 1 ? 0 : -50 }}
                >
                  <p className="text-sm font-bold text-blue-600 mb-2">First: {problem.num1}</p>
                  <div className="flex flex-wrap gap-2 max-w-[120px] justify-center">
                    {Array.from({ length: problem.num1 }).map((_, i) => (
                      <motion.span
                        key={`g1-${i}`}
                        className="text-3xl"
                        initial={{ scale: 0 }}
                        animate={{ scale: animatingCount >= 1 ? 1 : 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        {teachingObject}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                {/* Plus sign */}
                <motion.span
                  className="text-4xl text-green-500 font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: animatingCount >= 2 ? 1 : 0 }}
                >
                  +
                </motion.span>

                {/* Second group */}
                <motion.div
                  className="bg-green-50 p-4 rounded-2xl"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: animatingCount >= 2 ? 1 : 0, x: animatingCount >= 2 ? 0 : 50 }}
                >
                  <p className="text-sm font-bold text-green-600 mb-2">Then: {problem.num2}</p>
                  <div className="flex flex-wrap gap-2 max-w-[120px] justify-center">
                    {Array.from({ length: problem.num2 }).map((_, i) => (
                      <motion.span
                        key={`g2-${i}`}
                        className="text-3xl"
                        initial={{ scale: 0 }}
                        animate={{ scale: animatingCount >= 2 ? 1 : 0 }}
                        transition={{ delay: i * 0.1 + 0.5 }}
                      >
                        {teachingObject}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Combined result */}
              <AnimatePresence>
                {animatingCount >= 3 && (
                  <motion.div
                    className="mt-6 bg-yellow-50 p-4 rounded-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-lg font-bold text-yellow-700 mb-2">
                      Together: {problem.num1} + {problem.num2} = {problem.answer}! 🎉
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-[280px] mx-auto">
                      {Array.from({ length: problem.answer }).map((_, i) => (
                        <motion.span
                          key={`total-${i}`}
                          className="text-2xl"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: i * 0.05, type: 'spring' }}
                        >
                          {teachingObject}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )

      case 'subtraction':
        return (
          <div className="text-center">
            <motion.h3
              className="text-2xl font-bold text-white mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Let me show you how to subtract! ➖
            </motion.h3>

            <div className="bg-white/95 rounded-3xl p-6 shadow-xl max-w-lg mx-auto">
              {/* Problem display */}
              <div className="text-3xl font-bold mb-6 flex items-center justify-center gap-3">
                <span className="bg-blue-100 px-4 py-2 rounded-xl">{problem.num1}</span>
                <span className="text-red-500">-</span>
                <span className="bg-red-100 px-4 py-2 rounded-xl">{problem.num2}</span>
                <span>=</span>
                <motion.span
                  className="bg-yellow-200 px-4 py-2 rounded-xl"
                  animate={showAnswer ? { scale: [1, 1.3, 1], backgroundColor: ['#fef08a', '#86efac', '#fef08a'] } : {}}
                >
                  {showAnswer ? problem.answer : '?'}
                </motion.span>
              </div>

              {/* Visual demonstration */}
              <div className="bg-blue-50 p-4 rounded-2xl mb-4">
                <p className="text-sm font-bold text-blue-600 mb-3">
                  Start with {problem.num1} {teachingObject}:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Array.from({ length: problem.num1 }).map((_, i) => {
                    const isRemoved = i >= problem.answer && animatingCount >= 2
                    return (
                      <motion.div
                        key={i}
                        className="relative"
                        initial={{ scale: 0 }}
                        animate={{ scale: animatingCount >= 1 ? 1 : 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <span className={`text-3xl ${isRemoved ? 'opacity-30' : ''}`}>
                          {teachingObject}
                        </span>
                        {/* X mark for removed items */}
                        {isRemoved && (
                          <motion.span
                            className="absolute inset-0 text-4xl text-red-500 flex items-center justify-center"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                          >
                            ✕
                          </motion.span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Take away explanation. Phase 4.3 — switched from red+❌
                  to amber+➖ so subtraction reads as "smaller now", not "bad".
                  Subtraction is a friendly operation, not a penalty. */}
              <AnimatePresence>
                {animatingCount >= 2 && (
                  <motion.div
                    className="bg-amber-50 p-3 rounded-xl mb-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <p className="text-amber-700 font-bold">
                      Take away {problem.num2}! ➖
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result */}
              <AnimatePresence>
                {animatingCount >= 3 && (
                  <motion.div
                    className="bg-green-50 p-4 rounded-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-lg font-bold text-green-700 mb-2">
                      Left over: {problem.answer}! 🎉
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {Array.from({ length: problem.answer }).map((_, i) => (
                        <motion.span
                          key={`result-${i}`}
                          className="text-3xl"
                          initial={{ scale: 0, y: -20 }}
                          animate={{ scale: 1, y: 0 }}
                          transition={{ delay: i * 0.1, type: 'spring' }}
                        >
                          {teachingObject}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-2xl"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
      >
        {/* Avatar teaching */}
        <div className="flex justify-center mb-4">
          <Avatar3D size="medium" state="teaching" showPet />
        </div>

        {/* Speech bubble intro */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              className="bg-white rounded-3xl p-6 text-center mb-6 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0
                              border-l-8 border-r-8 border-b-8
                              border-l-transparent border-r-transparent border-b-white" />
              <p className="text-xl font-bold text-purple-600">
                Oops! Let me help you! 💪
              </p>
              <p className="text-gray-600 mt-1">
                Watch closely and you&apos;ll get it next time!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Teaching content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="teaching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderTeachingContent()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion */}
        <AnimatePresence>
          {step === 2 && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="bg-green-100 rounded-3xl p-6 mb-4"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <p className="text-2xl font-bold text-green-700">
                  The answer is {problem.answer}! 🌟
                </p>
                <p className="text-gray-600 mt-2">
                  Now you know how to do it! Try again!
                </p>
              </motion.div>

              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500
                           text-white text-xl font-bold rounded-2xl shadow-lg"
                onClick={onComplete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Got it! Let&apos;s continue! 🚀
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
