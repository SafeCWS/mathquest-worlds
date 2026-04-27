'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { useProgressStore } from '@/lib/stores/progressStore'
import { sounds } from '@/lib/sounds/webAudioSounds'

interface DiagnosticQuestion {
  question: string
  type: 'counting' | 'addition' | 'subtraction'
  answer: number
  visualItems?: number // For counting questions
  options: number[]
}

const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  // Easy counting (1-2)
  { question: 'How many stars? ⭐⭐⭐', type: 'counting', answer: 3, visualItems: 3, options: [2, 3, 4, 5] },
  { question: 'Count the hearts: ❤️❤️❤️❤️❤️', type: 'counting', answer: 5, visualItems: 5, options: [4, 5, 6, 7] },

  // Medium counting (3-4)
  { question: 'How many apples? 🍎🍎🍎🍎🍎🍎🍎', type: 'counting', answer: 7, visualItems: 7, options: [6, 7, 8, 9] },
  { question: 'Count the balloons: 🎈🎈🎈🎈🎈🎈🎈🎈🎈🎈', type: 'counting', answer: 10, visualItems: 10, options: [9, 10, 11, 12] },

  // Easy addition (5-6)
  { question: '2 + 1 = ?', type: 'addition', answer: 3, options: [2, 3, 4, 5] },
  { question: '3 + 2 = ?', type: 'addition', answer: 5, options: [4, 5, 6, 7] },

  // Medium addition (7-8)
  { question: '5 + 3 = ?', type: 'addition', answer: 8, options: [6, 7, 8, 9] },
  { question: '7 + 4 = ?', type: 'addition', answer: 11, options: [10, 11, 12, 13] },

  // Easy subtraction (9)
  { question: '5 - 2 = ?', type: 'subtraction', answer: 3, options: [2, 3, 4, 5] },

  // Harder problem (10)
  { question: '12 + 8 = ?', type: 'addition', answer: 20, options: [18, 19, 20, 21] },
]

interface DiagnosticQuizProps {
  onComplete: () => void
}

export function DiagnosticQuiz({ onComplete }: DiagnosticQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const recordDiagnostic = useProgressStore((state) => state.recordDiagnostic)

  const question = DIAGNOSTIC_QUESTIONS[currentQuestion]
  const progress = ((currentQuestion + 1) / DIAGNOSTIC_QUESTIONS.length) * 100

  const handleAnswer = (answer: number) => {
    if (showFeedback) return // Prevent multiple clicks

    setSelectedAnswer(answer)
    setShowFeedback(true)

    const isCorrect = answer === question.answer
    if (isCorrect) {
      sounds.playCorrect()
      setCorrectAnswers(correctAnswers + 1)
    } else {
      sounds.playWrong()
    }

    setTimeout(() => {
      if (currentQuestion < DIAGNOSTIC_QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
        setShowFeedback(false)
      } else {
        // Diagnostic complete
        recordDiagnostic(correctAnswers + (isCorrect ? 1 : 0), DIAGNOSTIC_QUESTIONS.length)
        sounds.playCelebration()
        setTimeout(onComplete, 1500)
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-purple-600 mb-2">
            Let&apos;s Find Your Perfect Level! 🎯
          </h1>
          <p className="text-gray-600">
            Question {currentQuestion + 1} of {DIAGNOSTIC_QUESTIONS.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <motion.h2
            key={currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-800 mb-4"
          >
            {question.question}
          </motion.h2>
        </div>

        {/* Answer options */}
        <div className="grid grid-cols-2 gap-4">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option
            const isCorrect = option === question.answer
            const showCorrect = showFeedback && isCorrect
            const showWrong = showFeedback && isSelected && !isCorrect

            return (
              <motion.button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={showFeedback}
                whileHover={{ scale: showFeedback ? 1 : 1.05 }}
                whileTap={{ scale: showFeedback ? 1 : 0.95 }}
                className={`
                  p-6 rounded-2xl text-3xl font-bold transition-all
                  ${showCorrect ? 'bg-green-500 text-white ring-4 ring-green-300' : ''}
                  /* Phase 4.3: wrong = dimmed gray, NOT red. Same forgiving
                     posture as AnimatedAnswer. */
                  ${showWrong ? 'bg-gray-200 text-gray-500 opacity-60' : ''}
                  ${!showFeedback ? 'bg-purple-100 hover:bg-purple-200 text-purple-700' : ''}
                  ${showFeedback && !isSelected && !isCorrect ? 'opacity-40' : ''}
                `}
              >
                {option}
                {showCorrect && ' ✓'}
                {/* Phase 4.3: ✗ removed — dim + opacity is the full signal */}
              </motion.button>
            )
          })}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            {selectedAnswer === question.answer ? (
              <p className="text-2xl font-bold text-green-600">Amazing! 🌟</p>
            ) : (
              <p className="text-2xl font-bold text-orange-600">Keep trying! 💪</p>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
