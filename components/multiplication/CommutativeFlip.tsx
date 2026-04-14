'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { getRandomFacts, MultiplicationFact } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { generateWrongAnswers, shuffleAnswers } from '@/lib/utils/multiplicationDifficulty'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { speak } from '@/lib/sounds/speechUtils'
import { useInteractionCooldown } from '@/lib/hooks/useInteractionCooldown'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import { WRONG_ANSWER_MESSAGES, CORRECT_ANSWER_MESSAGES, getRandomMessage } from '@/lib/constants/encouragementMessages'
// TABLE_EMOJIS removed - CommutativeFlip uses dot colors, not table emojis

interface CommutativeFlipProps {
  tableNumber: number
}

const TOTAL_ROUNDS = 5

// Color palette for dots -- child-friendly, bright colors
const DOT_COLORS = [
  'bg-red-400',
  'bg-blue-400',
  'bg-green-400',
  'bg-amber-400',
  'bg-pink-400',
  'bg-purple-400',
  'bg-cyan-400',
  'bg-orange-400',
  'bg-emerald-400',
  'bg-rose-400',
]

interface Round {
  fact: MultiplicationFact
  dotColor: string
  // After flip, quiz: "What is b x a?" with choices
  choices: number[]
}

function generateRounds(tableNumber: number): Round[] {
  // Get facts where b != a (otherwise commutative is trivial)
  const allFacts = getRandomFacts(tableNumber, 10)
  const nonTrivial = allFacts.filter(f => f.a !== f.b)
  const pool = nonTrivial.length >= TOTAL_ROUNDS ? nonTrivial : allFacts

  const selected = pool.slice(0, TOTAL_ROUNDS)
  while (selected.length < TOTAL_ROUNDS) {
    selected.push(pool[selected.length % pool.length])
  }

  return selected.map((fact, i) => {
    const wrong = generateWrongAnswers(fact.product, 2, 'product')
    const choices = shuffleAnswers([fact.product, ...wrong])
    return {
      fact,
      dotColor: DOT_COLORS[i % DOT_COLORS.length],
      choices,
    }
  })
}

export default function CommutativeFlip({ tableNumber }: CommutativeFlipProps) {
  const [rounds, setRounds] = useState<Round[]>(() => generateRounds(tableNumber))
  const [currentRound, setCurrentRound] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [phase, setPhase] = useState<'showing' | 'flipped' | 'answering' | 'feedback' | 'complete'>('showing')
  const [score, setScore] = useState(0)
  const [feedbackCorrect, setFeedbackCorrect] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const { isLocked, triggerCooldown } = useInteractionCooldown()
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout)
  }, [])

  const round = rounds[currentRound]
  const { a: rows, b: cols, product } = round.fact

  // After flip: rows and cols swap visually
  const displayRows = isFlipped ? cols : rows
  const displayCols = isFlipped ? rows : cols

  // Dot size scales with grid dimensions
  const dotSize = useMemo(() => {
    const maxDim = Math.max(displayRows, displayCols)
    if (maxDim <= 4) return 28
    if (maxDim <= 6) return 24
    if (maxDim <= 8) return 20
    return 16
  }, [displayRows, displayCols])

  // Speak the initial fact
  useEffect(() => {
    if (phase === 'showing') {
      const timer = setTimeout(() => {
        speak(`${rows} times ${cols} equals ${product}. That's ${rows} rows of ${cols}.`)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [currentRound, phase, rows, cols, product])

  // Handle the "Flip!" button
  const handleFlip = useCallback(() => {
    if (phase !== 'showing') return
    sounds.playBoing()
    setIsFlipped(true)
    setPhase('flipped')

    // After flip animation completes, speak and transition to quiz
    timeoutsRef.current.push(setTimeout(() => {
      speak(`See? Now it's ${cols} rows of ${rows}. Same answer! ${cols} times ${rows} also equals ${product}.`)
    }, 900))

    timeoutsRef.current.push(setTimeout(() => {
      speak(`What is ${cols} times ${rows}?`)
      setPhase('answering')
    }, 3500))
  }, [phase, rows, cols, product])

  // Handle answer selection
  const handleAnswer = useCallback((answer: number) => {
    if (isLocked) return
    if (phase !== 'answering') return
    triggerCooldown()
    setSelectedAnswer(answer)

    const isCorrect = answer === product
    if (isCorrect) {
      sounds.playCorrect()
      setScore(s => s + 1)
      setFeedbackCorrect(true)
      setFeedbackMessage(getRandomMessage(CORRECT_ANSWER_MESSAGES))
    } else {
      sounds.playGentleError()
      setFeedbackCorrect(false)
      setFeedbackMessage(`Not quite! ${cols} x ${rows} = ${product} (same as ${rows} x ${cols})`)
    }
    setPhase('feedback')

    const delay = isCorrect ? 1200 : 2500
    timeoutsRef.current.push(setTimeout(() => {
      const nextRound = currentRound + 1
      if (nextRound >= TOTAL_ROUNDS) {
        const finalScore = isCorrect ? score + 1 : score
        const stars = finalScore >= 5 ? 3 : finalScore >= 3 ? 2 : 1
        setPhase('complete')
        recordModeScore(tableNumber, 'flip', stars)
        showCelebration({
          type: 'level_complete',
          title: 'Flip Master!',
          subtitle: `${finalScore}/${TOTAL_ROUNDS} correct - ${stars} star${stars !== 1 ? 's' : ''}!`,
          emoji: '🔄',
          stars,
        })
      } else {
        setCurrentRound(nextRound)
        setIsFlipped(false)
        setPhase('showing')
        setSelectedAnswer(null)
        setFeedbackMessage(null)
      }
    }, delay))
  }, [phase, product, cols, rows, currentRound, score, tableNumber,
      recordModeScore, showCelebration, isLocked, triggerCooldown])

  const handlePlayAgain = useCallback(() => {
    setRounds(generateRounds(tableNumber))
    setCurrentRound(0)
    setIsFlipped(false)
    setScore(0)
    setPhase('showing')
    setFeedbackCorrect(false)
    setFeedbackMessage(null)
    setSelectedAnswer(null)
  }, [tableNumber])

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-300 via-fuchsia-300 to-pink-400 p-4 pt-16 pb-8">
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Header */}
      <motion.div
        className="text-center mb-3 pt-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">
          Commutative Flip
        </h1>
        <p className="text-white/80 text-sm">
          Round {Math.min(currentRound + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS} | Score: {score}
        </p>
      </motion.div>

      {/* Equation label */}
      {phase !== 'complete' && (
        <motion.div
          className="text-center mb-3"
          key={`label-${currentRound}-${isFlipped}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-xl font-extrabold text-white drop-shadow-lg">
            {isFlipped ? (
              <>{cols} x {rows} = {product}</>
            ) : (
              <>{rows} x {cols} = {product}</>
            )}
          </span>
        </motion.div>
      )}

      {/* Dot grid container */}
      {phase !== 'complete' && (
        <div className="flex justify-center mb-4">
          <motion.div
            className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/30"
            key={`grid-container-${currentRound}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Row label */}
            <div className="flex items-center gap-3">
              {/* Row count label */}
              <div className="flex flex-col items-center justify-center">
                <motion.span
                  className="text-xs font-bold text-white/70 writing-mode-vertical"
                  key={`row-label-${isFlipped}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {displayRows} rows
                </motion.span>
                <motion.div
                  className="text-white/40 text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                >
                  ↓
                </motion.div>
              </div>

              {/* Grid with rotation */}
              <div className="flex flex-col items-center">
                {/* Column label */}
                <motion.div
                  className="mb-2 flex items-center gap-1"
                  key={`col-label-${isFlipped}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-xs font-bold text-white/70">
                    {displayCols} columns
                  </span>
                  <span className="text-white/40 text-lg">→</span>
                </motion.div>

                {/* The actual dot grid */}
                <motion.div
                  animate={{ rotate: isFlipped ? 90 : 0 }}
                  transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ transformOrigin: 'center' }}
                >
                  <div
                    className="grid gap-1.5"
                    style={{
                      gridTemplateColumns: `repeat(${cols}, ${dotSize}px)`,
                      gridTemplateRows: `repeat(${rows}, ${dotSize}px)`,
                    }}
                  >
                    {Array.from({ length: rows * cols }, (_, i) => {
                      const row = Math.floor(i / cols)
                      return (
                        <motion.div
                          key={`dot-${i}`}
                          className={`rounded-full ${round.dotColor} shadow-md
                                     border-2 border-white/30`}
                          style={{
                            width: dotSize,
                            height: dotSize,
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            scale: 1,
                            opacity: 1,
                            // Counter-rotate each dot so they stay upright after grid rotation
                            rotate: isFlipped ? -90 : 0,
                          }}
                          transition={{
                            scale: {
                              delay: 0.05 * row + 0.02 * (i % cols),
                              type: 'spring',
                              stiffness: 400,
                            },
                            rotate: {
                              duration: 0.8,
                              ease: [0.34, 1.56, 0.64, 1],
                            },
                          }}
                        />
                      )
                    })}
                  </div>
                </motion.div>

                {/* Dot count */}
                <motion.p
                  className="text-xs text-white/60 text-center mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {product} dots total
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* "Same answer!" callout after flip */}
      <AnimatePresence>
        {(phase === 'flipped' || phase === 'answering' || phase === 'feedback') && (
          <motion.div
            className="text-center mb-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-base font-bold text-white bg-amber-500/40 backdrop-blur-sm px-4 py-1.5 rounded-full">
              Same answer! {rows} x {cols} = {cols} x {rows} = {product}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flip button */}
      <AnimatePresence>
        {phase === 'showing' && (
          <motion.div
            className="flex justify-center mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <motion.button
              className="px-10 py-4 bg-gradient-to-r from-purple-500 to-fuchsia-600
                         text-white font-extrabold text-xl rounded-full shadow-xl
                         border-4 border-white/30 min-h-[56px] min-w-[160px]
                         active:from-purple-600 active:to-fuchsia-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleFlip}
            >
              <span className="flex items-center gap-2 justify-center">
                <span className="text-2xl">🔄</span>
                Flip!
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            className="text-center mb-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span className={`text-base font-bold bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full ${
              feedbackCorrect ? 'text-green-100' : 'text-amber-100'
            }`}>
              {feedbackMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz: multiple choice */}
      <AnimatePresence>
        {(phase === 'answering' || phase === 'feedback') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-center text-white font-bold mb-3 text-lg">
              What is {cols} x {rows}?
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              {round.choices.map((choice, idx) => {
                const isSelected = selectedAnswer === choice
                const showCorrect = phase === 'feedback' && choice === product
                const showWrong = phase === 'feedback' && isSelected && choice !== product

                return (
                  <motion.button
                    key={`${currentRound}-choice-${idx}`}
                    className={`rounded-2xl py-4 text-2xl font-bold shadow-lg min-h-[56px]
                               border-3 transition-colors
                               ${showCorrect
                                 ? 'bg-green-400 border-green-500 text-white'
                                 : showWrong
                                   ? 'bg-amber-400 border-amber-500 text-white'
                                   : 'bg-white/90 border-white/50 text-gray-800'
                               }`}
                    whileTap={phase === 'answering' ? { scale: 0.92 } : {}}
                    animate={
                      showWrong
                        ? { x: [0, -3, 3, -3, 0] }
                        : showCorrect
                          ? { scale: [1, 1.1, 1] }
                          : {}
                    }
                    transition={{ duration: 0.4 }}
                    onClick={() => handleAnswer(choice)}
                    disabled={phase !== 'answering'}
                  >
                    {choice}
                  </motion.button>
                )
              })}
            </div>
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
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-600
                       text-white font-bold text-lg rounded-full shadow-xl
                       border-4 border-white/30 min-h-[56px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayAgain}
          >
            Play Again!
          </motion.button>
        </motion.div>
      )}

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mt-5">
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <motion.div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < currentRound ? 'bg-white' : i === currentRound ? 'bg-yellow-300' : 'bg-white/30'
            }`}
            animate={i === currentRound && phase !== 'complete' ? { scale: [1, 1.3, 1] } : {}}
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
