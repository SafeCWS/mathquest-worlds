'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { speak } from '@/lib/sounds/speechUtils'
import { useInteractionCooldown } from '@/lib/hooks/useInteractionCooldown'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import {
  WRONG_ANSWER_MESSAGES,
  CORRECT_ANSWER_MESSAGES,
  getRandomMessage,
} from '@/lib/constants/encouragementMessages'

// ── Types ────────────────────────────────────────────────────────────

type Phase = 'teaching' | 'quiz' | 'complete'

interface RoundState {
  multiplier: number // 1-10: the N in 9 x N
  foldedFinger: number | null // which finger is currently folded (1-indexed)
  phase: Phase
  showAnswer: boolean
  showDigitSum: boolean
}

interface QuizChoice {
  options: number[]
  selected: number | null
  correct: boolean | null
}

// ── Constants ────────────────────────────────────────────────────────

const TEACHING_COUNT = 3
const QUIZ_COUNT = 7
const TOTAL_FINGERS = 10

/** Generate a shuffled sequence from 1..10 for quiz */
function shuffledMultipliers(): number[] {
  const arr = Array.from({ length: 10 }, (_, i) => i + 1)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Generate 3 multiple-choice options containing the correct answer */
function generateChoices(correctAnswer: number): number[] {
  const options = new Set<number>([correctAnswer])
  while (options.size < 3) {
    // Generate plausible wrong answers within the 9x table range
    const wrong = Math.floor(Math.random() * 90) + 1
    if (wrong !== correctAnswer) options.add(wrong)
  }
  const arr = Array.from(options)
  // Shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Finger SVG component ────────────────────────────────────────────

interface FingerProps {
  index: number // 1-indexed finger number
  isFolded: boolean
  isLeft: boolean // left of folded finger
  isRight: boolean // right of folded finger
  isHighlighted: boolean // highlight for counting
  onTap: () => void
  disabled: boolean
  showNumber: boolean
}

function Finger({
  index,
  isFolded,
  isLeft,
  isRight,
  isHighlighted,
  onTap,
  disabled,
  showNumber,
}: FingerProps) {
  // Determine color
  let bgClass = 'bg-amber-200 border-amber-300'
  if (isFolded) {
    bgClass = 'bg-gray-300 border-gray-400'
  } else if (isLeft) {
    bgClass = 'bg-blue-400 border-blue-500'
  } else if (isRight) {
    bgClass = 'bg-green-400 border-green-500'
  }

  return (
    <motion.button
      onClick={onTap}
      disabled={disabled}
      className={`
        relative flex flex-col items-center justify-end
        rounded-t-full border-2 cursor-pointer
        transition-colors select-none
        ${bgClass}
        ${!disabled && !isFolded ? 'active:scale-95' : ''}
        ${disabled ? 'cursor-default' : ''}
      `}
      style={{
        width: 'clamp(40px, 8vw, 56px)',
        height: 'clamp(60px, 12vw, 88px)',
        transformOrigin: 'bottom center',
        touchAction: 'manipulation',
      }}
      animate={{
        scaleY: isFolded ? 0.3 : 1,
        y: isFolded ? 20 : 0,
        opacity: isFolded ? 0.5 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      whileTap={!disabled && !isFolded ? { scale: 0.9 } : {}}
      aria-label={`Finger ${index}`}
    >
      {/* Fingernail */}
      {!isFolded && (
        <motion.div
          className="absolute top-1.5 w-[60%] h-3 rounded-t-full bg-white/40"
          initial={false}
          animate={{ opacity: isFolded ? 0 : 0.6 }}
        />
      )}

      {/* Highlight pulse for counting animation */}
      {isHighlighted && !isFolded && (
        <motion.div
          className="absolute inset-0 rounded-t-full"
          style={{
            background: isLeft
              ? 'rgba(96, 165, 250, 0.4)'
              : 'rgba(74, 222, 128, 0.4)',
          }}
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}

      {/* Finger number */}
      {showNumber && (
        <span
          className={`
            text-xs font-bold mb-1 select-none pointer-events-none
            ${isFolded ? 'text-gray-500' : isLeft ? 'text-blue-800' : isRight ? 'text-green-800' : 'text-amber-700'}
          `}
        >
          {index}
        </span>
      )}
    </motion.button>
  )
}

// ── Main FingerTrick component ──────────────────────────────────────

export default function FingerTrick() {
  // -- Store & celebrations --
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const { isLocked, triggerCooldown } = useInteractionCooldown(600)

  // -- Game progression --
  const [roundIndex, setRoundIndex] = useState(0) // 0-based across teaching + quiz
  const [phase, setPhase] = useState<Phase>('teaching')

  // Sequences: first 3 are teaching, next 7 are quiz
  const [sequence] = useState<number[]>(() => {
    const teaching = [3, 7, 5] // good teaching examples
    const quiz = shuffledMultipliers().filter(n => !teaching.includes(n))
    // Take remaining multipliers for quiz, pad if needed
    const quizRounds = quiz.slice(0, QUIZ_COUNT)
    while (quizRounds.length < QUIZ_COUNT) {
      quizRounds.push(Math.floor(Math.random() * 10) + 1)
    }
    return [...teaching, ...quizRounds]
  })

  const multiplier = sequence[roundIndex] ?? 1

  // -- Round state --
  const [foldedFinger, setFoldedFinger] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showDigitSum, setShowDigitSum] = useState(false)
  const [animatingTeach, setAnimatingTeach] = useState(false)

  // -- Quiz state --
  const [quizCorrectCount, setQuizCorrectCount] = useState(0)
  const [quizAttempts, setQuizAttempts] = useState(0)
  const [quizChoice, setQuizChoice] = useState<QuizChoice | null>(null)
  const [wrongTapCount, setWrongTapCount] = useState(0) // for current round
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [earnedStars, setEarnedStars] = useState(0)

  // -- Computed values --
  const correctAnswer = 9 * multiplier
  const tensDigit = multiplier - 1
  const onesDigit = 10 - multiplier

  // Whether we're in teaching or quiz for this round
  const isTeaching = roundIndex < TEACHING_COUNT

  // -- Generate choices when entering quiz confirm step --
  const currentChoices = useMemo(() => {
    if (quizChoice) return quizChoice.options
    return generateChoices(correctAnswer)
  }, [correctAnswer, quizChoice])

  // ── Teaching flow ──────────────────────────────────────────────────

  const runTeachingAnimation = useCallback(() => {
    if (animatingTeach) return
    setAnimatingTeach(true)
    setFoldedFinger(null)
    setShowAnswer(false)
    setShowDigitSum(false)

    // Step 1: Speak instruction
    speak(`Let's find 9 times ${multiplier}. Fold down finger number ${multiplier}!`)

    // Step 2: Fold the finger after a beat
    setTimeout(() => {
      setFoldedFinger(multiplier)
      sounds.playSelect()
    }, 1800)

    // Step 3: Show the answer breakdown
    setTimeout(() => {
      setShowAnswer(true)
      sounds.playSuccessChime()
      speak(
        `${tensDigit} fingers on the left, ${onesDigit} on the right. ${tensDigit}${onesDigit} equals ${correctAnswer}!`
      )
    }, 2800)

    // Step 4: Show digit sum pattern
    setTimeout(() => {
      setShowDigitSum(true)
    }, 5000)

    // Step 5: Mark animation done
    setTimeout(() => {
      setAnimatingTeach(false)
    }, 5500)
  }, [multiplier, tensDigit, onesDigit, correctAnswer, animatingTeach])

  // Auto-run teaching animation when entering a teaching round
  useEffect(() => {
    if (isTeaching && phase === 'teaching') {
      const timer = setTimeout(runTeachingAnimation, 600)
      return () => clearTimeout(timer)
    }
  }, [roundIndex, isTeaching, phase, runTeachingAnimation])

  // ── Advance to next round ─────────────────────────────────────────

  const advanceRound = useCallback(() => {
    const nextIndex = roundIndex + 1

    if (nextIndex >= TEACHING_COUNT + QUIZ_COUNT) {
      // Game complete
      setPhase('complete')
      const stars = quizCorrectCount >= 6 ? 3 : quizCorrectCount >= 4 ? 2 : 1
      setEarnedStars(stars)
      recordModeScore(9, 'fingers', stars)
      setTimeout(() => {
        showCelebration({
          type: 'level_complete',
          title: '9s Finger Trick Master!',
          subtitle: `${stars} star${stars !== 1 ? 's' : ''} earned!`,
          emoji: '\u{1F44B}',
          stars,
        })
      }, 400)
      return
    }

    // Reset for next round
    setRoundIndex(nextIndex)
    setFoldedFinger(null)
    setShowAnswer(false)
    setShowDigitSum(false)
    setQuizChoice(null)
    setWrongTapCount(0)
    setFeedbackMessage(null)
    setAnimatingTeach(false)

    if (nextIndex >= TEACHING_COUNT) {
      setPhase('quiz')
    }
  }, [roundIndex, quizCorrectCount, recordModeScore, showCelebration])

  // ── Teaching: next button ─────────────────────────────────────────

  const handleTeachingNext = useCallback(() => {
    if (animatingTeach) return
    sounds.playClick()
    advanceRound()
  }, [animatingTeach, advanceRound])

  // ── Quiz: finger tap ──────────────────────────────────────────────

  const handleFingerTap = useCallback(
    (fingerIndex: number) => {
      if (isLocked || isTeaching || foldedFinger !== null) return
      triggerCooldown()

      if (fingerIndex === multiplier) {
        // Correct finger!
        sounds.playCorrect()
        setFoldedFinger(fingerIndex)
        setFeedbackMessage(getRandomMessage(CORRECT_ANSWER_MESSAGES))

        // Show answer after fold animation
        setTimeout(() => {
          setShowAnswer(true)
          sounds.playSuccessChime()
          speak(`${tensDigit} and ${onesDigit} makes ${correctAnswer}!`)
        }, 600)

        // Show digit sum briefly
        setTimeout(() => {
          setShowDigitSum(true)
        }, 2000)

        // Show multiple choice confirm after a pause
        setTimeout(() => {
          setQuizChoice({
            options: generateChoices(correctAnswer),
            selected: null,
            correct: null,
          })
        }, 2800)
      } else {
        // Wrong finger
        sounds.playGentleError()
        setWrongTapCount(prev => prev + 1)
        setFeedbackMessage(`Try again! Which finger is number ${multiplier}?`)

        // Clear message after delay
        setTimeout(() => setFeedbackMessage(null), 2000)
      }
    },
    [
      isLocked,
      isTeaching,
      foldedFinger,
      multiplier,
      tensDigit,
      onesDigit,
      correctAnswer,
      triggerCooldown,
    ]
  )

  // ── Quiz: multiple choice answer ──────────────────────────────────

  const handleChoiceTap = useCallback(
    (answer: number) => {
      if (isLocked || !quizChoice || quizChoice.selected !== null) return
      triggerCooldown()

      const isCorrect = answer === correctAnswer
      setQuizChoice(prev =>
        prev ? { ...prev, selected: answer, correct: isCorrect } : null
      )
      setQuizAttempts(prev => prev + 1)

      if (isCorrect) {
        sounds.playCorrect()
        setQuizCorrectCount(prev => prev + 1)
        setFeedbackMessage(getRandomMessage(CORRECT_ANSWER_MESSAGES))

        // Move to next round after celebration
        setTimeout(() => advanceRound(), 1600)
      } else {
        sounds.playGentleError()
        setFeedbackMessage(getRandomMessage(WRONG_ANSWER_MESSAGES))

        // Show correct answer and move on
        setTimeout(() => {
          setQuizChoice(prev =>
            prev ? { ...prev, selected: correctAnswer, correct: true } : null
          )
          setFeedbackMessage(`The answer is ${correctAnswer}!`)
        }, 1200)

        setTimeout(() => advanceRound(), 3000)
      }
    },
    [isLocked, quizChoice, correctAnswer, triggerCooldown, advanceRound]
  )

  // ── Play again ────────────────────────────────────────────────────

  const handlePlayAgain = useCallback(() => {
    setRoundIndex(0)
    setPhase('teaching')
    setFoldedFinger(null)
    setShowAnswer(false)
    setShowDigitSum(false)
    setQuizChoice(null)
    setQuizCorrectCount(0)
    setQuizAttempts(0)
    setWrongTapCount(0)
    setFeedbackMessage(null)
    setAnimatingTeach(false)
    setEarnedStars(0)
  }, [])

  // ── Progress indicator ────────────────────────────────────────────

  const totalRounds = TEACHING_COUNT + QUIZ_COUNT
  const progressText = isTeaching
    ? `Learn ${roundIndex + 1}/${TEACHING_COUNT}`
    : `Quiz ${roundIndex - TEACHING_COUNT + 1}/${QUIZ_COUNT}`

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-300 via-amber-300 to-yellow-400 p-4 pb-28">
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Header */}
      <motion.div
        className="text-center mb-2 pt-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">
          {'\u{1F44B}'} 9s Finger Trick
        </h1>
        <p className="text-white/80 text-sm mt-0.5">
          {isTeaching
            ? 'Watch and learn the magic trick!'
            : 'Tap the right finger to fold down!'}
        </p>
      </motion.div>

      {/* Progress bar */}
      <div className="max-w-md mx-auto mb-3">
        <div className="flex items-center justify-between text-xs text-white/70 font-semibold mb-1">
          <span>{progressText}</span>
          {!isTeaching && (
            <span>
              Score: {quizCorrectCount}/{quizAttempts > 0 ? quizAttempts : '-'}
            </span>
          )}
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white/70 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${((roundIndex + 1) / totalRounds) * 100}%`,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </div>
      </div>

      {/* Equation prompt */}
      {phase !== 'complete' && (
        <motion.div
          key={`eq-${roundIndex}`}
          className="text-center mb-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <span className="text-3xl font-extrabold text-white drop-shadow-md">
            9 x {multiplier} = ?
          </span>
          <button
            onClick={() => speak(`9 times ${multiplier}`)}
            className="ml-2 text-sm opacity-60 hover:opacity-100 transition-opacity
                       bg-white/20 rounded-full px-2 py-1 min-w-[36px] min-h-[36px]
                       inline-flex items-center"
            aria-label="Read aloud"
          >
            <span role="img" aria-hidden="true">
              {'\u{1F50A}'}
            </span>
          </button>
        </motion.div>
      )}

      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            className="text-center mb-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span className="text-base font-bold text-white bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
              {feedbackMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FINGER DISPLAY ── */}
      {phase !== 'complete' && (
        <motion.div
          className="max-w-lg mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Hand labels */}
          <div className="flex justify-between px-2 mb-1">
            <span className="text-xs font-bold text-white/60">Left Hand</span>
            <span className="text-xs font-bold text-white/60">Right Hand</span>
          </div>

          {/* 10 fingers in a row (wraps to 2x5 on very small screens) */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border-2 border-white/30">
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
              {Array.from({ length: TOTAL_FINGERS }, (_, i) => {
                const fingerNum = i + 1
                const isFolded = foldedFinger === fingerNum
                const isLeft =
                  foldedFinger !== null && fingerNum < foldedFinger
                const isRight =
                  foldedFinger !== null && fingerNum > foldedFinger

                return (
                  <Finger
                    key={fingerNum}
                    index={fingerNum}
                    isFolded={isFolded}
                    isLeft={isLeft && showAnswer}
                    isRight={isRight && showAnswer}
                    isHighlighted={showAnswer && !isFolded}
                    onTap={() => handleFingerTap(fingerNum)}
                    disabled={isTeaching || foldedFinger !== null}
                    showNumber={true}
                  />
                )
              })}
            </div>

            {/* Fold indicator arrow */}
            <AnimatePresence>
              {foldedFinger !== null && !showAnswer && (
                <motion.div
                  className="text-center mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-white/80 text-sm font-semibold">
                    {'\u{261D}\u{FE0F}'} Finger {foldedFinger} folded down!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Answer breakdown */}
            <AnimatePresence>
              {showAnswer && foldedFinger !== null && (
                <motion.div
                  className="mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* Left / Right counts */}
                  <div className="flex justify-center items-center gap-3 mb-2">
                    <motion.div
                      className="flex items-center gap-1 bg-blue-500/30 rounded-full px-4 py-1.5"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <span className="text-blue-200 font-bold text-lg">
                        {tensDigit}
                      </span>
                      <span className="text-blue-200/70 text-xs">
                        left
                      </span>
                    </motion.div>

                    <span className="text-white/50 font-bold text-xl">|</span>

                    <motion.div
                      className="flex items-center gap-1 bg-green-500/30 rounded-full px-4 py-1.5"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <span className="text-green-200 font-bold text-lg">
                        {onesDigit}
                      </span>
                      <span className="text-green-200/70 text-xs">
                        right
                      </span>
                    </motion.div>
                  </div>

                  {/* Combined answer */}
                  <motion.div
                    className="text-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.4,
                      type: 'spring',
                      stiffness: 300,
                    }}
                  >
                    <span className="text-3xl font-extrabold text-white drop-shadow-lg">
                      <span className="text-blue-300">{tensDigit}</span>
                      <span className="text-green-300">{onesDigit}</span>
                      <span className="text-white"> = {correctAnswer}!</span>
                    </span>
                  </motion.div>

                  {/* Digit sum fun fact */}
                  <AnimatePresence>
                    {showDigitSum && correctAnswer > 9 && (
                      <motion.div
                        className="text-center mt-2"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <span className="text-sm text-white/70 bg-white/10 rounded-full px-3 py-1">
                          {'\u2728'} Notice: {tensDigit} + {onesDigit} = 9! The
                          digits always add to 9!
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── QUIZ: Multiple choice confirm ── */}
      <AnimatePresence>
        {quizChoice && phase === 'quiz' && (
          <motion.div
            className="max-w-md mx-auto mt-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="text-center text-white/80 text-sm font-semibold mb-2">
              What is 9 x {multiplier}?
            </p>
            <div className="flex justify-center gap-3">
              {currentChoices.map(option => {
                const isSelected = quizChoice.selected === option
                const isCorrectOption = option === correctAnswer
                const showAsCorrect =
                  isSelected && quizChoice.correct === true
                const showAsWrong = isSelected && quizChoice.correct === false
                const revealCorrect =
                  quizChoice.selected !== null &&
                  quizChoice.correct === false &&
                  isCorrectOption

                let btnClass =
                  'bg-white/90 border-white/50 text-gray-800'
                if (showAsCorrect || revealCorrect) {
                  btnClass =
                    'bg-green-300 border-green-500 text-green-800'
                } else if (showAsWrong) {
                  btnClass = 'bg-red-300 border-red-500 text-red-800'
                }

                return (
                  <motion.button
                    key={option}
                    className={`rounded-2xl px-6 py-3 text-xl font-bold shadow-md min-h-[52px]
                               min-w-[70px] border-3 transition-colors ${btnClass}`}
                    whileTap={
                      quizChoice.selected === null ? { scale: 0.95 } : {}
                    }
                    animate={
                      showAsWrong
                        ? { x: [0, -4, 4, -4, 0] }
                        : showAsCorrect || revealCorrect
                          ? { scale: [1, 1.1, 1] }
                          : {}
                    }
                    transition={{ duration: 0.4 }}
                    onClick={() => handleChoiceTap(option)}
                    disabled={quizChoice.selected !== null}
                  >
                    {option}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TEACHING: Next button ── */}
      <AnimatePresence>
        {isTeaching && showAnswer && !animatingTeach && (
          <motion.div
            className="flex justify-center mt-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-600
                         text-white font-bold text-lg rounded-full shadow-xl
                         border-4 border-white/30 min-h-[48px]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTeachingNext}
            >
              {roundIndex < TEACHING_COUNT - 1 ? 'Next Example' : "Let's Quiz!"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── QUIZ: instruction when waiting for finger tap ── */}
      <AnimatePresence>
        {phase === 'quiz' && foldedFinger === null && !quizChoice && (
          <motion.div
            className="text-center mt-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-white/70 text-sm font-semibold">
              {'\u{1F446}'} Tap finger #{multiplier} to fold it down
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GAME COMPLETE ── */}
      <AnimatePresence>
        {phase === 'complete' && !celebration && (
          <motion.div
            className="max-w-md mx-auto text-center mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border-2 border-white/30"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <p className="text-5xl mb-3">{'\u{1F44B}'}</p>
              <h2 className="text-2xl font-extrabold text-white drop-shadow-md mb-2">
                Finger Trick Complete!
              </h2>
              <p className="text-white/80 text-lg mb-3">
                You got {quizCorrectCount} out of {QUIZ_COUNT} correct
              </p>
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3].map(s => (
                  <motion.span
                    key={s}
                    className="text-4xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: s * 0.15 }}
                  >
                    {s <= earnedStars ? '\u{1F31F}' : '\u2B50'}
                  </motion.span>
                ))}
              </div>
              <motion.button
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-600
                           text-white font-bold text-lg rounded-full shadow-xl
                           border-4 border-white/30 min-h-[48px]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayAgain}
              >
                Play Again!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button */}
      <motion.div
        className="fixed bottom-4 left-0 right-0 flex justify-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Link href="/multiplication/9">
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
