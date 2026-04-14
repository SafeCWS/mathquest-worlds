'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { getRandomFacts, MultiplicationFact } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { generateWrongAnswers, shuffleAnswers } from '@/lib/utils/multiplicationDifficulty'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { speakEquation, cancelSpeech } from '@/lib/sounds/speechUtils'
import { useInteractionCooldown } from '@/lib/hooks/useInteractionCooldown'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import VisualMultiplication from './VisualMultiplication'
import { WRONG_ANSWER_MESSAGES, CORRECT_ANSWER_MESSAGES, getRandomMessage } from '@/lib/constants/encouragementMessages'

interface SpeedChallengeProps {
  tableNumber: number
}

type GameMode = 'select' | 'timer' | 'relaxed'
type Phase = 'mode_select' | 'countdown' | 'playing' | 'complete'

const TIMER_SECONDS = 90
const RELAXED_TOTAL = 10

function getNextQuestion(tableNumber: number): {
  fact: MultiplicationFact
  choices: number[]
} {
  const facts = getRandomFacts(tableNumber, 1)
  const fact = facts[0]
  const wrong = generateWrongAnswers(fact.product, 3, 'product')
  const choices = shuffleAnswers([fact.product, ...wrong])
  return { fact, choices }
}

export default function SpeedChallenge({ tableNumber }: SpeedChallengeProps) {
  const [gameMode, setGameMode] = useState<GameMode>('select')
  const [phase, setPhase] = useState<Phase>('mode_select')
  const [countdownNumber, setCountdownNumber] = useState(3)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [currentQuestion, setCurrentQuestion] = useState(() => getNextQuestion(tableNumber))
  const [score, setScore] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [flashColor, setFlashColor] = useState<'green' | 'amber' | null>(null)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState<number | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [wrongVisualFact, setWrongVisualFact] = useState<MultiplicationFact | null>(null)
  const [relaxedQuestion, setRelaxedQuestion] = useState(0)
  const [waitingForNext, setWaitingForNext] = useState(false)
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const speedHighScore = useMultiplicationStore(s => s.speedHighScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const { isLocked, triggerCooldown } = useInteractionCooldown(400)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const warningPlayedRef = useRef(false)
  const questionKeyRef = useRef(0)

  // Countdown phase
  useEffect(() => {
    if (phase !== 'countdown') return

    if (countdownNumber <= 0) {
      setPhase('playing')
      return
    }

    sounds.playTimerTick()
    const timer = setTimeout(() => {
      setCountdownNumber(n => n - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [phase, countdownNumber])

  // Game timer (timer mode only)
  useEffect(() => {
    if (phase !== 'playing' || gameMode !== 'timer') return

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, gameMode])

  // Timer warning sound - only once at 10 seconds
  useEffect(() => {
    if (phase !== 'playing' || gameMode !== 'timer') return

    if (timeLeft === 10 && !warningPlayedRef.current) {
      sounds.playTimerWarning()
      warningPlayedRef.current = true
    }
  }, [phase, timeLeft, gameMode])

  // End game when time reaches 0 (timer mode)
  useEffect(() => {
    if (phase === 'playing' && gameMode === 'timer' && timeLeft === 0) {
      const stars = score >= 10 ? 3 : score >= 6 ? 2 : 1
      recordModeScore(tableNumber, 'speed', stars)

      if (score > speedHighScore) {
        useMultiplicationStore.setState({ speedHighScore: score })
      }

      setPhase('complete')
      setTimeout(() => {
        showCelebration({
          type: 'level_complete',
          title: 'Speed Run Complete!',
          subtitle: `${score} correct${bestStreak > 1 ? ` - ${bestStreak} best streak` : ''}!`,
          emoji: '\u26A1',
          stars,
        })
      }, 300)
    }
  }, [timeLeft, phase, score, bestStreak, tableNumber, recordModeScore, showCelebration, speedHighScore, gameMode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const selectMode = useCallback((mode: GameMode) => {
    setGameMode(mode)
    if (mode === 'timer') {
      setPhase('countdown')
      setCountdownNumber(3)
    } else {
      // Relaxed mode - skip countdown, go straight to playing
      setPhase('playing')
      setRelaxedQuestion(0)
    }
  }, [])

  const handleAnswer = useCallback((answer: number) => {
    if (isLocked) return
    if (phase !== 'playing' || waitingForNext) return
    triggerCooldown()

    const isCorrect = answer === currentQuestion.fact.product

    if (isCorrect) {
      sounds.playCorrect()
      setScore(s => s + 1)
      setStreak(s => {
        const newStreak = s + 1
        setBestStreak(bs => Math.max(bs, newStreak))
        return newStreak
      })
      setFlashColor('green')
      setFeedbackMessage(getRandomMessage(CORRECT_ANSWER_MESSAGES))

      // Quick transition for correct answers
      const delay = gameMode === 'timer' ? 300 : 600
      setTimeout(() => {
        setFlashColor(null)
        setFeedbackMessage(null)
        setShowCorrectAnswer(null)
        setWrongVisualFact(null)
        questionKeyRef.current++

        if (gameMode === 'relaxed') {
          const next = relaxedQuestion + 1
          if (next >= RELAXED_TOTAL) {
            const finalScore = score + 1
            const stars = finalScore >= 7 ? 3 : finalScore >= 5 ? 2 : 1
            recordModeScore(tableNumber, 'speed', stars)
            setPhase('complete')
            setTimeout(() => {
              showCelebration({
                type: 'level_complete',
                title: 'Well Done!',
                subtitle: `${finalScore}/${RELAXED_TOTAL} correct!`,
                emoji: '\uD83C\uDF31',
                stars,
              })
            }, 300)
            return
          }
          setRelaxedQuestion(next)
        }

        setCurrentQuestion(getNextQuestion(tableNumber))
      }, delay)
    } else {
      sounds.playGentleError()
      setWrongCount(w => w + 1)
      setStreak(0)
      setFlashColor('amber')
      setShowCorrectAnswer(currentQuestion.fact.product)
      setFeedbackMessage(getRandomMessage(WRONG_ANSWER_MESSAGES))
      setWrongVisualFact(currentQuestion.fact)
      setWaitingForNext(true)

      // Show visual for 1.5 seconds before moving on
      setTimeout(() => {
        setFlashColor(null)
        setShowCorrectAnswer(null)
        setFeedbackMessage(null)
        setWrongVisualFact(null)
        setWaitingForNext(false)
        questionKeyRef.current++

        if (gameMode === 'relaxed') {
          const next = relaxedQuestion + 1
          if (next >= RELAXED_TOTAL) {
            const finalScore = score
            const stars = finalScore >= 7 ? 3 : finalScore >= 5 ? 2 : 1
            recordModeScore(tableNumber, 'speed', stars)
            setPhase('complete')
            setTimeout(() => {
              showCelebration({
                type: 'level_complete',
                title: 'Well Done!',
                subtitle: `${finalScore}/${RELAXED_TOTAL} correct!`,
                emoji: '\uD83C\uDF31',
                stars,
              })
            }, 300)
            return
          }
          setRelaxedQuestion(next)
        }

        setCurrentQuestion(getNextQuestion(tableNumber))
      }, 1500)
    }
  }, [phase, currentQuestion, tableNumber, gameMode, relaxedQuestion, score, recordModeScore, showCelebration, waitingForNext, isLocked, triggerCooldown])

  const handlePlayAgain = useCallback(() => {
    setPhase('mode_select')
    setGameMode('select')
    setCountdownNumber(3)
    setTimeLeft(TIMER_SECONDS)
    setScore(0)
    setWrongCount(0)
    setStreak(0)
    setBestStreak(0)
    setFlashColor(null)
    setShowCorrectAnswer(null)
    setFeedbackMessage(null)
    setWrongVisualFact(null)
    setRelaxedQuestion(0)
    setWaitingForNext(false)
    warningPlayedRef.current = false
    questionKeyRef.current = 0
    setCurrentQuestion(getNextQuestion(tableNumber))
  }, [tableNumber])

  // Timer bar color (softer palette)
  const timerFraction = timeLeft / TIMER_SECONDS
  const timerColor = timerFraction > 0.5 ? 'bg-emerald-400' : timerFraction > 0.17 ? 'bg-amber-400' : 'bg-rose-400'
  const isUrgent = timeLeft <= 10 && timeLeft > 0

  // Background color
  const bgColor = flashColor === 'green'
    ? 'bg-gradient-to-b from-green-300 via-green-400 to-green-500'
    : flashColor === 'amber'
      ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500'
      : 'bg-gradient-to-b from-yellow-300 via-amber-300 to-orange-400'

  return (
    <div className={`min-h-screen p-4 pt-16 pb-8 transition-colors duration-200 ${bgColor}`}>
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Mode Selection */}
      {phase === 'mode_select' && (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <motion.h1
            className="text-3xl font-extrabold text-white drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Speed Challenge
          </motion.h1>
          <motion.p
            className="text-white/80 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Pick your style:
          </motion.p>

          <motion.button
            className="w-64 px-6 py-5 bg-gradient-to-r from-orange-400 to-red-500
                       text-white font-extrabold text-xl rounded-2xl shadow-xl
                       border-4 border-orange-300 min-h-[64px]"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => selectMode('timer')}
          >
            <span className="text-2xl mr-2">&#9201;</span> Race the Clock (90s)
          </motion.button>

          <motion.button
            className="w-64 px-6 py-5 bg-gradient-to-r from-green-400 to-emerald-500
                       text-white font-extrabold text-xl rounded-2xl shadow-xl
                       border-4 border-green-300 min-h-[64px]"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => selectMode('relaxed')}
          >
            <span className="text-2xl mr-2">&#127793;</span> Take Your Time
          </motion.button>
        </div>
      )}

      {/* Countdown (timer mode only) */}
      {phase === 'countdown' && (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <motion.p
            className="text-xl font-bold text-white/80 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Get Ready!
          </motion.p>
          <AnimatePresence mode="wait">
            {countdownNumber > 0 ? (
              <motion.span
                key={countdownNumber}
                className="text-9xl font-extrabold text-white drop-shadow-2xl"
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.5, type: 'spring' }}
              >
                {countdownNumber}
              </motion.span>
            ) : (
              <motion.span
                key="go"
                className="text-7xl font-extrabold text-white drop-shadow-2xl"
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.3, type: 'spring' }}
              >
                GO!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Playing */}
      {phase === 'playing' && (
        <>
          {/* Timer bar (timer mode only) */}
          {gameMode === 'timer' && (
            <div className="w-full h-3 bg-white/30 rounded-full mb-4 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${timerColor}`}
                animate={{
                  width: `${timerFraction * 100}%`,
                  ...(isUrgent ? { opacity: [1, 0.7, 1] } : {}),
                }}
                transition={isUrgent ? { opacity: { duration: 0.8, repeat: Infinity } } : { duration: 0.3 }}
              />
            </div>
          )}

          {/* Score and time / progress */}
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="text-lg font-bold text-white">
              Score: {score}
            </span>
            {gameMode === 'timer' ? (
              <motion.span
                className={`text-lg font-bold ${isUrgent ? 'text-red-100' : 'text-white'}`}
                animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {timeLeft}s
              </motion.span>
            ) : (
              <span className="text-lg font-bold text-white">
                {relaxedQuestion + 1}/{RELAXED_TOTAL}
              </span>
            )}
            {streak >= 3 && (
              <motion.span
                className="text-lg font-bold text-yellow-200"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                {streak}x streak!
              </motion.span>
            )}
          </div>

          {/* Feedback message */}
          <AnimatePresence>
            {feedbackMessage && (
              <motion.div
                className="text-center mb-2"
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
            {wrongVisualFact && (
              <motion.div
                className="max-w-xs mx-auto bg-white/15 backdrop-blur-sm rounded-2xl p-2 mb-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <VisualMultiplication
                  a={wrongVisualFact.a}
                  b={wrongVisualFact.b}
                  show={{ groups: true, additionBridge: true, answer: false }}
                  size="compact"
                  animateIn={false}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question */}
          <motion.div
            className="text-center mb-6"
            key={questionKeyRef.current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-extrabold text-white drop-shadow-lg">
                {currentQuestion.fact.a} x {currentQuestion.fact.b} = ?
              </span>
              {gameMode === 'relaxed' && (
                <button
                  onClick={() => speakEquation(currentQuestion.fact.a, currentQuestion.fact.b)}
                  className="text-lg opacity-60 hover:opacity-100 transition-opacity min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Read aloud"
                >
                  &#128266;
                </button>
              )}
            </div>
          </motion.div>

          {/* Show correct answer on wrong */}
          {showCorrectAnswer !== null && (
            <motion.div
              className="text-center mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-xl font-bold text-white/90">
                = {showCorrectAnswer}
              </span>
            </motion.div>
          )}

          {/* Answer choices */}
          <motion.div
            className="grid grid-cols-2 gap-3 max-w-xs mx-auto"
            key={`c-${questionKeyRef.current}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            {currentQuestion.choices.map((choice, idx) => (
              <motion.button
                key={`${questionKeyRef.current}-${idx}`}
                className="rounded-2xl py-4 text-2xl font-bold shadow-lg min-h-[56px]
                          bg-white/90 border-3 border-white/50 text-gray-800
                          active:bg-white"
                whileTap={{ scale: 0.92 }}
                onClick={() => handleAnswer(choice)}
                disabled={waitingForNext}
              >
                {choice}
              </motion.button>
            ))}
          </motion.div>
        </>
      )}

      {/* Complete */}
      {phase === 'complete' && !celebration && (
        <motion.div
          className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-6xl">{gameMode === 'timer' ? '\u26A1' : '\uD83C\uDF31'}</span>
          <h2 className="text-3xl font-extrabold text-white">
            {gameMode === 'timer' ? "Time's Up!" : 'All Done!'}
          </h2>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-xs w-full">
            <div className="space-y-2 text-center">
              <p className="text-xl text-white">
                <span className="font-bold">{score}</span> correct
              </p>
              <p className="text-lg text-white/80">
                {wrongCount} wrong | {Math.round(score / (score + wrongCount || 1) * 100)}% accuracy
              </p>
              {bestStreak > 1 && (
                <p className="text-lg text-yellow-200 font-bold">
                  Best streak: {bestStreak}
                </p>
              )}
            </div>
          </div>

          <motion.button
            className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600
                       text-white font-bold text-lg rounded-full shadow-xl
                       border-4 border-white/30 min-h-[48px] mt-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayAgain}
          >
            Play Again!
          </motion.button>
        </motion.div>
      )}

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
