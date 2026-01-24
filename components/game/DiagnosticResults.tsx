'use client'

import { motion } from 'motion/react'
import { useProgressStore } from '@/lib/stores/progressStore'
import { getDiagnosticFeedback } from '@/lib/utils/adaptiveDifficulty'
import { DressUpAvatar } from '@/components/character-creator/DressUpAvatar'

interface DiagnosticResultsProps {
  onContinue: () => void
}

export function DiagnosticResults({ onContinue }: DiagnosticResultsProps) {
  const diagnosticResult = useProgressStore((state) => state.diagnosticResult)
  const skillLevel = useProgressStore((state) => state.skillLevel)

  if (!diagnosticResult) return null

  const feedback = getDiagnosticFeedback(skillLevel)
  const percentage = Math.round(
    (diagnosticResult.correctAnswers / diagnosticResult.totalQuestions) * 100
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full text-center"
      >
        {/* Celebration Avatar */}
        <motion.div
          className="flex justify-center mb-6"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <DressUpAvatar size="medium" animate={true} />
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-6xl mb-4">{feedback.emoji}</div>
          <h1 className="text-4xl font-bold text-purple-600 mb-2">
            {feedback.title}
          </h1>
          <p className="text-xl text-gray-700 mb-6">{feedback.message}</p>

          {/* Score */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
            <p className="text-gray-600 mb-2">You got</p>
            <p className="text-5xl font-bold text-purple-600">
              {diagnosticResult.correctAnswers}/{diagnosticResult.totalQuestions}
            </p>
            <p className="text-2xl text-purple-500 mt-2">{percentage}% Correct!</p>
          </div>

          {/* Skill Level Badge */}
          <div className="mb-8">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-full text-xl font-bold shadow-lg">
              {skillLevel === 'beginner' && '🌱 Beginner Level'}
              {skillLevel === 'intermediate' && '⭐ Intermediate Level'}
              {skillLevel === 'advanced' && '🚀 Advanced Level'}
            </div>
          </div>

          {/* What This Means */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-6 text-left">
            <h2 className="text-xl font-bold text-blue-800 mb-3">
              What this means for you:
            </h2>
            <ul className="space-y-2 text-gray-700">
              {skillLevel === 'beginner' && (
                <>
                  <li className="flex items-start">
                    <span className="text-2xl mr-2">🎯</span>
                    <span>We&apos;ll start with visual counting and simple numbers</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-2">🌈</span>
                    <span>Lots of colorful pictures to help you learn</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-2">💪</span>
                    <span>You&apos;ll build confidence step by step</span>
                  </li>
                </>
              )}
              {skillLevel === 'intermediate' && (
                <>
                  <li className="flex items-start">
                    <span className="text-2xl mr-2">🎯</span>
                    <span>Perfect mix of visual and number problems</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-2">🌈</span>
                    <span>We&apos;ll challenge you just the right amount</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-2">💪</span>
                    <span>Get ready to level up your math skills!</span>
                  </li>
                </>
              )}
              {skillLevel === 'advanced' && (
                <>
                  <li className="flex items-start">
                    <span className="text-2xl mr-2">🎯</span>
                    <span>Harder problems with bigger numbers</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-2">🌈</span>
                    <span>We&apos;ll skip the basics and jump ahead</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-2xl mr-2">💪</span>
                    <span>You&apos;re ready for some serious challenges!</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Continue Button */}
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-4 rounded-full text-2xl font-bold shadow-lg hover:shadow-xl transition-shadow"
          >
            Let&apos;s Start Learning! 🚀
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}
