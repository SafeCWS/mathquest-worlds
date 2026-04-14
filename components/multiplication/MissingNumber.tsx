'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { getRandomFacts, MultiplicationFact } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { generateWrongAnswers, shuffleAnswers } from '@/lib/utils/multiplicationDifficulty'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { speakMissing, cancelSpeech } from '@/lib/sounds/speechUtils'
import { useInteractionCooldown } from '@/lib/hooks/useInteractionCooldown'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import { useHintSystem, HintButton } from '@/lib/hooks/useHintSystem'
import VisualMultiplication from './VisualMultiplication'
import { WRONG_ANSWER_MESSAGES, CORRECT_ANSWER_MESSAGES, getRandomMessage } from '@/lib/constants/encouragementMessages'

interface MissingNumberProps {
  tableNumber: number
}

type MissingPosition = 'a' | 'b' | 'product'

interface Question {
  fact: MultiplicationFact
  missingPosition: MissingPosition
  correctAnswer: number
  choices: number[]
}

const TOTAL_QUESTIONS = 5

function generateQuestions(tableNumber: number): Question[] {
  const facts = getRandomFacts(tableNumber, TOTAL_QUESTIONS)

  return facts.map(fact => {
    // Weight: 10% 'a', 30% 'b', 60% 'product' (finding product is most educational)
    const rand = Math.random()
    const missingPosition: MissingPosition = rand < 0.1 ? 'a' : rand < 0.4 ? 'b' : 'product'
    let correctAnswer: number
    let answerType: 'product' | 'factor'

    switch (missingPosition) {
      case 'a':
        correctAnswer = fact.a
        answerType = 'factor'
        break
      case 'b':
        correctAnswer = fact.b
        answerType = 'factor'
        break
      case 'product':
      default:
        correctAnswer = fact.product
        answerType = 'product'
        break
    }

    const wrong = generateWrongAnswers(correctAnswer, 3, answerType)
    const choices = shuffleAnswers([correctAnswer, ...wrong])

    return { fact, missingPosition, correctAnswer, choices }
  })
}

export default function MissingNumber({ tableNumber }: MissingNumberProps) {
  const [questions, setQuestions] = useState<Question[]>(() => generateQuestions(tableNumber))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<'answering' | 'feedback' | 'complete'>('answering')
  const [feedbackCorrect, setFeedbackCorrect] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [revealedAnswer, setRevealedAnswer] = useState<number | null>(null)
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const { hintLevel, showHint, resetHint, totalHintsUsed, visualProps, hintPenalty } = useHintSystem()
  const { isLocked, triggerCooldown } = useInteractionCooldown()
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout)
  }, [])

  const currentQuestion = questions[currentIndex]

  // Speak the missing-number equation when a new question appears
  useEffect(() => {
    if (phase === 'answering' && currentQuestion) {
      const { fact, missingPosition } = currentQuestion
      speakMissing(fact.a, fact.b, missingPosition)
    }
    return () => cancelSpeech()
  }, [currentIndex, phase])

  const handleAnswer = useCallback((answer: number) => {
    if (isLocked) return
    if (phase !== 'answering') return
    triggerCooldown()
    setSelectedAnswer(answer)

    const isCorrect = answer === currentQuestion.correctAnswer
    if (isCorrect) {
      sounds.playCorrect()
      setScore(s => s + 1)
      setFeedbackCorrect(true)
      setRevealedAnswer(answer)
      setFeedbackMessage(getRandomMessage(CORRECT_ANSWER_MESSAGES))
    } else {
      sounds.playGentleError()
      setFeedbackCorrect(false)
      setRevealedAnswer(currentQuestion.correctAnswer)
      setFeedbackMessage(getRandomMessage(WRONG_ANSWER_MESSAGES))
    }

    setPhase('feedback')

    timeoutsRef.current.push(setTimeout(() => {
      const nextIndex = currentIndex + 1
      if (nextIndex >= TOTAL_QUESTIONS) {
        const finalScore = isCorrect ? score + 1 : score
        const rawStars = finalScore >= 4 ? 3 : finalScore >= 3 ? 2 : 1
        const stars = Math.max(Math.round(rawStars - hintPenalty), 1)
        setPhase('complete')
        recordModeScore(tableNumber, 'missing', stars)
        showCelebration({
          type: 'level_complete',
          title: 'Number Detective!',
          subtitle: `${finalScore}/${TOTAL_QUESTIONS} correct - ${stars} star${stars !== 1 ? 's' : ''}!`,
          emoji: '🔍',
          stars,
        })
      } else {
        setCurrentIndex(nextIndex)
        setPhase('answering')
        setSelectedAnswer(null)
        setRevealedAnswer(null)
        setFeedbackMessage(null)
        resetHint()
      }
    }, isCorrect ? 1000 : 2500))
  }, [phase, currentQuestion, currentIndex, score, tableNumber, recordModeScore, showCelebration, hintPenalty, resetHint, isLocked, triggerCooldown])

  const handlePlayAgain = useCallback(() => {
    setQuestions(generateQuestions(tableNumber))
    setCurrentIndex(0)
    setScore(0)
    setPhase('answering')
    setFeedbackCorrect(false)
    setFeedbackMessage(null)
    setSelectedAnswer(null)
    setRevealedAnswer(null)
    resetHint()
  }, [tableNumber, resetHint])

  // Render the equation with the missing part
  const renderEquation = () => {
    if (!currentQuestion) return null
    const { fact, missingPosition } = currentQuestion
    const isRevealed = revealedAnswer !== null

    const MissingBox = () => (
      <motion.span
        className={`inline-flex items-center justify-center w-14 h-14 rounded-xl
                   text-2xl font-extrabold mx-1
                   ${isRevealed
                     ? feedbackCorrect
                       ? 'bg-green-400 border-green-500 text-white'
                       : 'bg-amber-400 border-amber-500 text-white'
                     : 'bg-gradient-to-br from-yellow-300 to-amber-400 border-amber-500 text-amber-800'
                   }
                   border-3 shadow-lg`}
        animate={!isRevealed ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        {isRevealed ? revealedAnswer : '?'}
      </motion.span>
    )

    const NumberSpan = ({ value }: { value: number }) => (
      <span className="inline-flex items-center justify-center w-14 h-14 rounded-xl
                       bg-white/80 border-3 border-white/50 text-2xl font-extrabold
                       text-gray-800 mx-1 shadow-md">
        {value}
      </span>
    )

    return (
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {missingPosition === 'a' ? <MissingBox /> : <NumberSpan value={fact.a} />}
        <span className="text-3xl font-bold text-white drop-shadow-lg mx-1">x</span>
        {missingPosition === 'b' ? <MissingBox /> : <NumberSpan value={fact.b} />}
        <span className="text-3xl font-bold text-white drop-shadow-lg mx-1">=</span>
        {missingPosition === 'product' ? <MissingBox /> : <NumberSpan value={fact.product} />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-300 via-rose-300 to-red-400 p-4 pt-16 pb-8">
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Header */}
      <motion.div
        className="text-center mb-4 pt-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">
          Missing Number
        </h1>
        <p className="text-white/80 text-sm">
          Question {Math.min(currentIndex + 1, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS} | Score: {score}
        </p>
      </motion.div>

      {/* Equation display */}
      {phase !== 'complete' && currentQuestion && (
        <motion.div
          className="mb-4"
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          <div className="flex items-center justify-center gap-2">
            <div className="flex-1">{renderEquation()}</div>
            <button
              onClick={() => speakMissing(currentQuestion.fact.a, currentQuestion.fact.b, currentQuestion.missingPosition)}
              className="text-lg opacity-60 hover:opacity-100 transition-opacity min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Read aloud"
            >
              &#128266;
            </button>
          </div>
        </motion.div>
      )}

      {/* Hint system */}
      {phase === 'answering' && currentQuestion && (
        <div className="flex flex-col items-center gap-2 mb-4">
          <HintButton onTap={showHint} hintLevel={hintLevel} />
          <AnimatePresence>
            {hintLevel > 0 && (
              <motion.div
                className="max-w-xs w-full bg-white/15 backdrop-blur-sm rounded-2xl p-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <VisualMultiplication
                  a={currentQuestion.fact.a}
                  b={currentQuestion.fact.b}
                  show={visualProps}
                  size="compact"
                  animateIn={true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMessage && phase === 'feedback' && (
          <motion.div
            className="text-center mb-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-base font-bold text-white bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
              {feedbackMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wrong answer visual */}
      <AnimatePresence>
        {phase === 'feedback' && !feedbackCorrect && currentQuestion && (
          <motion.div
            className="max-w-xs mx-auto bg-white/15 backdrop-blur-sm rounded-2xl p-3 mb-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <VisualMultiplication
              a={currentQuestion.fact.a}
              b={currentQuestion.fact.b}
              show={{ groups: true, additionBridge: true, answer: true }}
              size="compact"
              animateIn={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer choices */}
      {phase !== 'complete' && currentQuestion && (
        <motion.div
          className="grid grid-cols-2 gap-3 max-w-xs mx-auto"
          key={`choices-${currentIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {currentQuestion.choices.map((choice, idx) => {
            const isSelected = selectedAnswer === choice
            const showCorrect = phase === 'feedback' && choice === currentQuestion.correctAnswer
            const showWrong = phase === 'feedback' && isSelected && choice !== currentQuestion.correctAnswer

            return (
              <motion.button
                key={`${currentIndex}-${idx}`}
                className={`rounded-2xl py-4 text-2xl font-bold shadow-lg min-h-[56px]
                           border-3
                           ${showCorrect
                             ? 'bg-green-400 border-green-500 text-white'
                             : showWrong
                               ? 'bg-amber-400 border-amber-500 text-white'
                               : 'bg-white/90 border-white/50 text-gray-800'
                           }`}
                whileTap={phase === 'answering' ? { scale: 0.92 } : {}}
                animate={showWrong ? { x: [0, -3, 3, -3, 0] } : showCorrect ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
                onClick={() => handleAnswer(choice)}
                disabled={phase !== 'answering'}
              >
                {choice}
              </motion.button>
            )
          })}
        </motion.div>
      )}

      {/* Complete screen */}
      {phase === 'complete' && !celebration && (
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-2xl font-extrabold text-white mb-4">
            Score: {score}/{TOTAL_QUESTIONS}
          </p>
          <motion.button
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-600
                       text-white font-bold text-lg rounded-full shadow-xl
                       border-4 border-white/30 min-h-[48px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayAgain}
          >
            Play Again!
          </motion.button>
        </motion.div>
      )}

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mt-6">
        {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => (
          <motion.div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < currentIndex ? 'bg-white' : i === currentIndex ? 'bg-yellow-300' : 'bg-white/30'
            }`}
            animate={i === currentIndex ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ))}
      </div>

      {/* Back button - fixed top-left, always visible in any orientation */}
      <div className="fixed top-4 left-4 z-50">
        <Link href={`/multiplication/${tableNumber}`}>
          <motion.button
            className="px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 font-bold rounded-full
                       shadow-lg min-h-[48px] min-w-[48px] flex items-center justify-center gap-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⬅️ Back
          </motion.button>
        </Link>
      </div>
    </div>
  )
}
