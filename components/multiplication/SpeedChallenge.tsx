'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { getRandomFacts, MultiplicationFact } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { generateWrongAnswers, shuffleAnswers } from '@/lib/utils/multiplicationDifficulty'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'

interface SpeedChallengeProps {
  tableNumber: number
}

type Phase = 'countdown' | 'playing' | 'complete'

const TOTAL_TIME = 60 // seconds

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
  const [phase, setPhase] = useState<Phase>('countdown')
  const [countdownNumber, setCountdownNumber] = useState(3)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [currentQuestion, setCurrentQuestion] = useState(() => getNextQuestion(tableNumber))
  const [score, setScore] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null)
  const [showCorrectAnswer, setShowCorrectAnswer] = useState<number | null>(null)
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const speedHighScore = useMultiplicationStore(s => s.speedHighScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const warningRef = useRef<ReturnType<typeof setInterval> | null>(null)
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

  // Game timer
  useEffect(() => {
    if (phase !== 'playing') return

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up
          clearInterval(timerRef.current!)
          if (warningRef.current) clearInterval(warningRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  // Timer warning sounds in last 10 seconds
  useEffect(() => {
    if (phase !== 'playing') return

    if (timeLeft <= 10 && timeLeft > 0 && timeLeft % 3 === 0) {
      sounds.playTimerWarning()
    }
  }, [phase, timeLeft])

  // End game when time reaches 0
  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) {
      const stars = score >= 15 ? 3 : score >= 10 ? 2 : score >= 5 ? 1 : 0
      recordModeScore(tableNumber, 'speed', Math.max(stars, 1))

      // Update high score in store
      if (score > speedHighScore) {
        // Speed high score updated via the store
        useMultiplicationStore.setState({ speedHighScore: score })
      }

      setPhase('complete')
      setTimeout(() => {
        showCelebration({
          type: 'level_complete',
          title: 'Speed Run Complete!',
          subtitle: `${score} correct${bestStreak > 1 ? ` - ${bestStreak} best streak` : ''}!`,
          emoji: '⚡',
          stars: Math.max(stars, 1),
        })
      }, 300)
    }
  }, [timeLeft, phase, score, bestStreak, tableNumber, recordModeScore, showCelebration, speedHighScore])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (warningRef.current) clearInterval(warningRef.current)
    }
  }, [])

  const handleAnswer = useCallback((answer: number) => {
    if (phase !== 'playing') return

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
    } else {
      sounds.playWrong()
      setWrongCount(w => w + 1)
      setStreak(0)
      setFlashColor('red')
      setShowCorrectAnswer(currentQuestion.fact.product)
    }

    // Brief flash, then next question
    const delay = isCorrect ? 200 : 500
    setTimeout(() => {
      setFlashColor(null)
      setShowCorrectAnswer(null)
      questionKeyRef.current++
      setCurrentQuestion(getNextQuestion(tableNumber))
    }, delay)
  }, [phase, currentQuestion, tableNumber])

  const handlePlayAgain = useCallback(() => {
    setPhase('countdown')
    setCountdownNumber(3)
    setTimeLeft(TOTAL_TIME)
    setScore(0)
    setWrongCount(0)
    setStreak(0)
    setBestStreak(0)
    setFlashColor(null)
    setShowCorrectAnswer(null)
    questionKeyRef.current = 0
    setCurrentQuestion(getNextQuestion(tableNumber))
  }, [tableNumber])

  // Timer bar color
  const timerFraction = timeLeft / TOTAL_TIME
  const timerColor = timerFraction > 0.5 ? 'bg-green-400' : timerFraction > 0.17 ? 'bg-yellow-400' : 'bg-red-500'
  const isUrgent = timeLeft <= 10 && timeLeft > 0

  return (
    <div className={`min-h-screen p-4 pb-24 transition-colors duration-200
                    ${flashColor === 'green'
                      ? 'bg-gradient-to-b from-green-300 via-green-400 to-green-500'
                      : flashColor === 'red'
                        ? 'bg-gradient-to-b from-red-300 via-red-400 to-red-500'
                        : 'bg-gradient-to-b from-yellow-300 via-amber-300 to-orange-400'
                    }`}>
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Countdown */}
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
          {/* Timer bar */}
          <div className="w-full h-4 bg-white/30 rounded-full mb-4 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${timerColor}`}
              animate={{
                width: `${timerFraction * 100}%`,
                ...(isUrgent ? { opacity: [1, 0.6, 1] } : {}),
              }}
              transition={isUrgent ? { opacity: { duration: 0.5, repeat: Infinity } } : { duration: 0.3 }}
            />
          </div>

          {/* Score and time */}
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="text-lg font-bold text-white">
              Score: {score}
            </span>
            <motion.span
              className={`text-lg font-bold ${isUrgent ? 'text-red-100' : 'text-white'}`}
              animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {timeLeft}s
            </motion.span>
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

          {/* Question */}
          <motion.div
            className="text-center mb-6"
            key={questionKeyRef.current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <span className="text-4xl font-extrabold text-white drop-shadow-lg">
              {currentQuestion.fact.a} x {currentQuestion.fact.b} = ?
            </span>
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
          <span className="text-6xl">&#9889;</span>
          <h2 className="text-3xl font-extrabold text-white">Time&apos;s Up!</h2>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-xs w-full">
            <div className="space-y-2 text-center">
              <p className="text-xl text-white">
                <span className="font-bold">{score}</span> correct
              </p>
              <p className="text-lg text-white/80">
                {wrongCount} wrong | {Math.round(score / (score + wrongCount || 1) * 100)}% accuracy
              </p>
              <p className="text-lg text-yellow-200 font-bold">
                Best streak: {bestStreak}
              </p>
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
