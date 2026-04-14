'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { generateWrongAnswers, shuffleAnswers } from '@/lib/utils/multiplicationDifficulty'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { speakEquation, cancelSpeech } from '@/lib/sounds/speechUtils'
import { useInteractionCooldown } from '@/lib/hooks/useInteractionCooldown'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import { useHintSystem, HintButton } from '@/lib/hooks/useHintSystem'
import VisualMultiplication from './VisualMultiplication'
import { WRONG_ANSWER_MESSAGES, CORRECT_ANSWER_MESSAGES, getRandomMessage } from '@/lib/constants/encouragementMessages'

interface DiceRollerProps {
  tableNumber: number
}

type Phase = 'ready' | 'rolling' | 'visual' | 'answering' | 'feedback' | 'complete'

const TOTAL_ROUNDS = 5

export default function DiceRoller({ tableNumber }: DiceRollerProps) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [die1Display, setDie1Display] = useState(tableNumber)
  const [die2Display, setDie2Display] = useState(1)
  const [targetNumber, setTargetNumber] = useState(1)
  const [correctAnswer, setCorrectAnswer] = useState(0)
  const [choices, setChoices] = useState<number[]>([])
  const [feedbackCorrect, setFeedbackCorrect] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const { hintLevel, showHint, resetHint, totalHintsUsed, visualProps, hintPenalty } = useHintSystem()
  const { isLocked, triggerCooldown } = useInteractionCooldown()
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current)
    }
  }, [])

  const startRoll = useCallback(() => {
    sounds.playDiceRoll()
    setPhase('rolling')
    setSelectedAnswer(null)
    setFeedbackMessage(null)
    resetHint()

    // Pick a random second number 1-10
    const target = Math.floor(Math.random() * 10) + 1

    // Animate dice cycling for 1.5 seconds
    rollIntervalRef.current = setInterval(() => {
      setDie2Display(Math.floor(Math.random() * 10) + 1)
    }, 80)

    setTimeout(() => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current)
      setDie1Display(tableNumber)
      setDie2Display(target)
      setTargetNumber(target)

      const product = tableNumber * target
      setCorrectAnswer(product)
      const wrong = generateWrongAnswers(product, 3, 'product')
      setChoices(shuffleAnswers([product, ...wrong]))

      // Show visual BEFORE answer choices
      setPhase('visual')
      speakEquation(tableNumber, target)
    }, 1500)
  }, [tableNumber, resetHint])

  const proceedToAnswering = useCallback(() => {
    setPhase('answering')
  }, [])

  const handleAnswer = useCallback((answer: number) => {
    if (isLocked) return
    triggerCooldown()
    setSelectedAnswer(answer)
    const isCorrect = answer === correctAnswer

    if (isCorrect) {
      sounds.playCorrect()
      setScore(s => s + 1)
      setFeedbackCorrect(true)
      setFeedbackMessage(getRandomMessage(CORRECT_ANSWER_MESSAGES))
    } else {
      sounds.playGentleError()
      setFeedbackCorrect(false)
      setFeedbackMessage(getRandomMessage(WRONG_ANSWER_MESSAGES))
    }

    setPhase('feedback')

    // Move to next round or end
    setTimeout(() => {
      const nextRound = round + 1
      if (nextRound >= TOTAL_ROUNDS) {
        const finalScore = isCorrect ? score + 1 : score
        const rawStars = finalScore >= 4 ? 3 : finalScore >= 3 ? 2 : 1
        const stars = Math.max(Math.round(rawStars - hintPenalty), 1)
        recordModeScore(tableNumber, 'dice', stars)
        setPhase('complete')
        showCelebration({
          type: 'level_complete',
          title: 'Dice Master!',
          subtitle: `${finalScore}/${TOTAL_ROUNDS} correct - ${stars} star${stars !== 1 ? 's' : ''}!`,
          emoji: '🎲',
          stars,
        })
      } else {
        setRound(nextRound)
        setPhase('ready')
        setFeedbackMessage(null)
      }
    }, isCorrect ? 1000 : 2500)
  }, [correctAnswer, round, score, tableNumber, recordModeScore, showCelebration, hintPenalty, isLocked, triggerCooldown])

  const handlePlayAgain = useCallback(() => {
    setPhase('ready')
    setRound(0)
    setScore(0)
    setDie1Display(tableNumber)
    setDie2Display(1)
    setSelectedAnswer(null)
    setFeedbackMessage(null)
    resetHint()
  }, [tableNumber, resetHint])

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-300 via-red-300 to-rose-400 p-4 pb-24">
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Header */}
      <motion.div
        className="text-center mb-4 pt-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">
          Dice Roller
        </h1>
        <p className="text-white/80 text-sm">
          Round {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS} | Score: {score}
        </p>
      </motion.div>

      {/* Dice display area */}
      <div className="flex justify-center items-center gap-4 mb-6">
        {/* Die 1 - fixed to table number */}
        <motion.div
          className="w-24 h-24 bg-white rounded-2xl shadow-xl border-4 border-orange-300
                     flex items-center justify-center"
          animate={phase === 'rolling' ? { rotate: [0, 360], scale: [1, 1.1, 1] } : {}}
          transition={phase === 'rolling' ? { duration: 0.3, repeat: Infinity } : {}}
        >
          <span className="text-4xl font-extrabold text-orange-600">{die1Display}</span>
        </motion.div>

        {/* Multiply sign */}
        <motion.span
          className="text-4xl font-bold text-white drop-shadow-lg"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          x
        </motion.span>

        {/* Die 2 - rolls randomly */}
        <motion.div
          className="w-24 h-24 bg-white rounded-2xl shadow-xl border-4 border-red-300
                     flex items-center justify-center"
          animate={phase === 'rolling' ? { rotate: [0, -360], scale: [1, 1.1, 1] } : {}}
          transition={phase === 'rolling' ? { duration: 0.3, repeat: Infinity } : {}}
        >
          <span className="text-4xl font-extrabold text-red-600">{die2Display}</span>
        </motion.div>
      </div>

      {/* Visual phase: show emoji groups so she can count before answering */}
      {phase === 'visual' && (
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="text-center mb-3 flex items-center justify-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="text-2xl font-extrabold text-white drop-shadow-lg">
              {tableNumber} x {targetNumber} = ?
            </span>
            <button
              onClick={() => speakEquation(tableNumber, targetNumber)}
              className="text-lg opacity-60 hover:opacity-100 transition-opacity min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Read aloud"
            >
              &#128266;
            </button>
          </motion.div>

          <div className="max-w-xs mx-auto bg-white/15 backdrop-blur-sm rounded-2xl p-3 mb-3">
            <VisualMultiplication
              a={tableNumber}
              b={targetNumber}
              show={{ groups: true, additionBridge: false, answer: false }}
              size="compact"
              animateIn={true}
            />
          </div>

          {/* Hint button for addition bridge */}
          <div className="flex justify-center gap-3 mb-3">
            <HintButton onTap={showHint} hintLevel={hintLevel} />
          </div>

          {hintLevel > 0 && (
            <motion.div
              className="max-w-xs mx-auto bg-white/15 backdrop-blur-sm rounded-2xl p-2 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <VisualMultiplication
                a={tableNumber}
                b={targetNumber}
                show={visualProps}
                size="compact"
                animateIn={true}
              />
            </motion.div>
          )}

          <div className="flex justify-center">
            <motion.button
              className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500
                         text-white font-extrabold text-xl rounded-full shadow-xl
                         border-4 border-yellow-300 min-h-[48px]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={proceedToAnswering}
            >
              I know the answer!
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Equation display */}
      {(phase === 'answering' || phase === 'feedback') && (
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
        >
          <span className="text-3xl font-extrabold text-white drop-shadow-lg">
            {tableNumber} x {targetNumber} = ?
          </span>
        </motion.div>
      )}

      {/* Roll button */}
      {phase === 'ready' && (
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-500
                       text-white font-extrabold text-2xl rounded-full shadow-xl
                       border-4 border-yellow-300 min-h-[56px]"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={startRoll}
          >
            Roll!
          </motion.button>
        </motion.div>
      )}

      {/* Rolling state */}
      {phase === 'rolling' && (
        <motion.div
          className="text-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <span className="text-xl font-bold text-white/80">Rolling...</span>
        </motion.div>
      )}

      {/* Answer choices */}
      {(phase === 'answering' || phase === 'feedback') && (
        <motion.div
          className="grid grid-cols-2 gap-3 max-w-xs mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {choices.map((choice, idx) => {
            const isSelected = selectedAnswer === choice
            const showCorrect = phase === 'feedback' && choice === correctAnswer
            const showWrong = phase === 'feedback' && isSelected && choice !== correctAnswer

            return (
              <motion.button
                key={`${round}-${idx}`}
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
                onClick={() => phase === 'answering' && handleAnswer(choice)}
                disabled={phase !== 'answering'}
              >
                {choice}
              </motion.button>
            )
          })}
        </motion.div>
      )}

      {/* Feedback message with visual */}
      <AnimatePresence>
        {phase === 'feedback' && (
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            {feedbackMessage && (
              <span className={`text-base font-bold block mb-2 ${feedbackCorrect ? 'text-green-100' : 'text-white'}`}>
                {feedbackMessage}
              </span>
            )}
            {!feedbackCorrect && (
              <motion.div
                className="max-w-xs mx-auto bg-white/15 backdrop-blur-sm rounded-2xl p-3 mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <VisualMultiplication
                  a={tableNumber}
                  b={targetNumber}
                  show={{ groups: true, additionBridge: true, answer: true }}
                  size="compact"
                  animateIn={true}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete screen */}
      {phase === 'complete' && !celebration && (
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-2xl font-extrabold text-white mb-4">
            Score: {score}/{TOTAL_ROUNDS}
          </p>
          <motion.button
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600
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
      <div className="flex justify-center gap-1.5 mt-4">
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <motion.div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < round ? 'bg-white' : i === round ? 'bg-yellow-300' : 'bg-white/30'
            }`}
            animate={i === round ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ))}
      </div>

      {/* Back button */}
      <motion.div
        className="fixed bottom-4 left-0 right-0 flex justify-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Link href={`/multiplication/${tableNumber}`}>
          <motion.button
            className="px-6 py-2 bg-white/30 backdrop-blur-md text-white
                       font-semibold rounded-full border border-white/40 min-h-[48px]"
            whileTap={{ scale: 0.95 }}
          >
            Back
          </motion.button>
        </Link>
      </motion.div>
    </div>
  )
}
