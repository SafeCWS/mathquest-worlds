'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { getRandomFacts, MultiplicationFact } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { generateWrongAnswers, shuffleAnswers } from '@/lib/utils/multiplicationDifficulty'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { speak, speakEquation } from '@/lib/sounds/speechUtils'
import { useInteractionCooldown } from '@/lib/hooks/useInteractionCooldown'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import { CORRECT_ANSWER_MESSAGES, getRandomMessage } from '@/lib/constants/encouragementMessages'

interface BubblePopProps {
  tableNumber: number
}

const TOTAL_ROUNDS = 8
const BUBBLE_COUNT = 6
const BUBBLE_SIZE = 76 // px, >=72 for touch targets

// Pastel gradient pairs for bubbles
const BUBBLE_COLORS = [
  { from: '#60A5FA', to: '#818CF8' }, // blue-purple
  { from: '#A78BFA', to: '#C084FC' }, // purple-violet
  { from: '#F472B6', to: '#FB7185' }, // pink-rose
  { from: '#34D399', to: '#6EE7B7' }, // green-emerald
  { from: '#2DD4BF', to: '#67E8F9' }, // teal-cyan
  { from: '#FBBF24', to: '#FB923C' }, // amber-orange
]

interface BubbleData {
  id: number
  value: number
  isCorrect: boolean
  startX: number // percentage 10-90
  startDelay: number // stagger in ms
  speed: number // seconds to cross screen
  colorIndex: number
  wobbleAmount: number // px horizontal wobble
}

interface PopParticle {
  id: number
  bubbleId: number
  angle: number
  distance: number
  color: string
}

interface RoundData {
  fact: MultiplicationFact
  bubbles: BubbleData[]
}

function generateRound(tableNumber: number, roundIndex: number): RoundData {
  const facts = getRandomFacts(tableNumber, 10)
  const fact = facts[roundIndex % facts.length]
  const wrongAnswers = generateWrongAnswers(fact.product, BUBBLE_COUNT - 1, 'product')
  const allValues = shuffleAnswers([fact.product, ...wrongAnswers])

  const bubbles: BubbleData[] = allValues.map((value, i) => ({
    id: roundIndex * 100 + i,
    value,
    isCorrect: value === fact.product,
    startX: 10 + Math.random() * 80,
    startDelay: i * 400 + Math.random() * 300,
    speed: 6 + Math.random() * 3,
    colorIndex: i % BUBBLE_COLORS.length,
    wobbleAmount: 15 + Math.random() * 25,
  }))

  return { fact, bubbles }
}

function generateAllRounds(tableNumber: number): RoundData[] {
  const facts = getRandomFacts(tableNumber, 10)
  const rounds: RoundData[] = []

  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const fact = facts[i % facts.length]
    const wrongAnswers = generateWrongAnswers(fact.product, BUBBLE_COUNT - 1, 'product')
    const allValues = shuffleAnswers([fact.product, ...wrongAnswers])

    const bubbles: BubbleData[] = allValues.map((value, j) => ({
      id: i * 100 + j,
      value,
      isCorrect: value === fact.product,
      startX: 10 + Math.random() * 80,
      startDelay: j * 400 + Math.random() * 300,
      speed: 6 + Math.random() * 3,
      colorIndex: j % BUBBLE_COLORS.length,
      wobbleAmount: 15 + Math.random() * 25,
    }))

    rounds.push({ fact, bubbles })
  }

  return rounds
}

export default function BubblePop({ tableNumber }: BubblePopProps) {
  const [rounds, setRounds] = useState<RoundData[]>(() => generateAllRounds(tableNumber))
  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'popping' | 'feedback' | 'complete'>('playing')
  const [poppedBubbleId, setPoppedBubbleId] = useState<number | null>(null)
  const [wrongBubbleId, setWrongBubbleId] = useState<number | null>(null)
  const [popParticles, setPopParticles] = useState<PopParticle[]>([])
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [floatedOffCount, setFloatedOffCount] = useState(0)
  const [showStreakBanner, setShowStreakBanner] = useState(false)

  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const { isLocked, triggerCooldown } = useInteractionCooldown(600)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const floatedOffSetRef = useRef<Set<number>>(new Set())

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout)
  }, [])

  const round = rounds[currentRound]

  // Speak equation at each round start
  useEffect(() => {
    if (phase === 'playing') {
      const timer = setTimeout(() => {
        speak(`${round.fact.a} times ${round.fact.b}. Pop the bubble with ${round.fact.product}!`)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentRound, phase, round.fact.a, round.fact.b, round.fact.product])

  // Track bubbles that floated off screen — if all gone, regenerate
  const handleBubbleFloatedOff = useCallback((bubbleId: number) => {
    // Only care if we're still playing this round
    if (phase !== 'playing') return
    // Deduplicate — onAnimationComplete can fire more than once per bubble
    if (floatedOffSetRef.current.has(bubbleId)) return
    floatedOffSetRef.current.add(bubbleId)

    setFloatedOffCount(prev => {
      const newCount = prev + 1
      if (newCount >= BUBBLE_COUNT) {
        // All bubbles floated away — regenerate the round (no penalty)
        floatedOffSetRef.current.clear()
        const newRound = generateRound(tableNumber, currentRound)
        setRounds(prevRounds => {
          const copy = [...prevRounds]
          copy[currentRound] = newRound
          return copy
        })
        return 0
      }
      return newCount
    })
  }, [phase, tableNumber, currentRound])

  // Advance to next round
  const advanceRound = useCallback((newScore: number) => {
    const nextRound = currentRound + 1
    if (nextRound >= TOTAL_ROUNDS) {
      const stars = newScore >= 7 ? 3 : newScore >= 5 ? 2 : 1
      setPhase('complete')
      recordModeScore(tableNumber, 'bubble', stars)
      const t = setTimeout(() => {
        showCelebration({
          type: 'level_complete',
          title: 'Bubble Master!',
          subtitle: `${newScore}/${TOTAL_ROUNDS} correct - ${stars} star${stars !== 1 ? 's' : ''}!`,
          emoji: '\uD83E\uDEE7',
          stars,
        })
      }, 300)
      timeoutsRef.current.push(t)
    } else {
      const t = setTimeout(() => {
        floatedOffSetRef.current.clear()
        setCurrentRound(nextRound)
        setPoppedBubbleId(null)
        setWrongBubbleId(null)
        setPopParticles([])
        setFeedbackMessage(null)
        setFloatedOffCount(0)
        setPhase('playing')
      }, 1000)
      timeoutsRef.current.push(t)
    }
  }, [currentRound, tableNumber, recordModeScore, showCelebration])

  // Handle tapping a bubble
  const handlePop = useCallback((bubble: BubbleData) => {
    if (isLocked) return
    if (phase !== 'playing') return
    triggerCooldown()

    if (bubble.isCorrect) {
      // Correct answer — POP!
      sounds.playPop()
      sounds.playCorrect()
      const newScore = score + 1
      setScore(newScore)
      const newStreak = streak + 1
      setStreak(newStreak)
      setPoppedBubbleId(bubble.id)
      setPhase('popping')
      setFeedbackMessage(getRandomMessage(CORRECT_ANSWER_MESSAGES))

      // Show streak banner for 3+
      if (newStreak >= 3) {
        sounds.playStreak()
        setShowStreakBanner(true)
        const st = setTimeout(() => setShowStreakBanner(false), 1200)
        timeoutsRef.current.push(st)
      }

      // Generate pop particles
      const color = BUBBLE_COLORS[bubble.colorIndex]
      const particles: PopParticle[] = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        bubbleId: bubble.id,
        angle: (i / 6) * 360,
        distance: 40 + Math.random() * 30,
        color: i % 2 === 0 ? color.from : color.to,
      }))
      setPopParticles(particles)

      // Advance after pop animation
      const t = setTimeout(() => {
        advanceRound(newScore)
      }, 600)
      timeoutsRef.current.push(t)
    } else {
      // Wrong answer — wobble
      sounds.playGentleError()
      setStreak(0)
      setWrongBubbleId(bubble.id)

      // Clear wrong state after wobble
      const t = setTimeout(() => {
        setWrongBubbleId(null)
      }, 500)
      timeoutsRef.current.push(t)
    }
  }, [phase, score, streak, isLocked, triggerCooldown, advanceRound])

  const handlePlayAgain = useCallback(() => {
    floatedOffSetRef.current.clear()
    setRounds(generateAllRounds(tableNumber))
    setCurrentRound(0)
    setScore(0)
    setStreak(0)
    setPhase('playing')
    setPoppedBubbleId(null)
    setWrongBubbleId(null)
    setPopParticles([])
    setFeedbackMessage(null)
    setFloatedOffCount(0)
    setShowStreakBanner(false)
  }, [tableNumber])

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-400 via-purple-400 to-fuchsia-500 overflow-hidden relative">
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Back button — FIXED top-left */}
      <div className="fixed top-4 left-4 z-50">
        <Link href={`/multiplication/${tableNumber}`}>
          <motion.button
            className="px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 font-bold rounded-full shadow-lg min-h-[48px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-lg">&#x2B05;&#xFE0F;</span> Back
          </motion.button>
        </Link>
      </div>

      {/* Header */}
      {phase !== 'complete' && (
        <motion.div
          className="text-center pt-16 pb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">
            Bubble Pop!
          </h1>
          <p className="text-white/80 text-sm">
            Round {Math.min(currentRound + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS} | Score: {score}
          </p>
        </motion.div>
      )}

      {/* Equation prompt */}
      {phase !== 'complete' && (
        <motion.div
          className="text-center mb-2"
          key={`eq-${currentRound}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <span className="text-lg font-bold text-white bg-black/20 backdrop-blur-sm px-5 py-2 rounded-full inline-flex items-center gap-2">
            <span className="text-2xl">{'\uD83E\uDEE7'}</span>
            {round.fact.a} x {round.fact.b} = ?
            <button
              onClick={() => speakEquation(round.fact.a, round.fact.b)}
              className="ml-1 opacity-60 hover:opacity-100 transition-opacity min-w-[32px] min-h-[32px]
                         flex items-center justify-center"
              aria-label="Read aloud"
            >
              <span role="img" aria-hidden="true">&#128266;</span>
            </button>
          </span>
        </motion.div>
      )}

      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMessage && phase !== 'complete' && (
          <motion.div
            className="text-center mb-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-base font-bold text-green-100 bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
              {feedbackMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak banner */}
      <AnimatePresence>
        {showStreakBanner && (
          <motion.div
            className="text-center mb-1"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', damping: 15, stiffness: 400 }}
          >
            <span className="text-lg font-extrabold text-yellow-200 drop-shadow-lg">
              {streak} in a row! {'\uD83D\uDD25'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble play area */}
      {phase !== 'complete' && (
        <div
          ref={containerRef}
          className="relative w-full"
          style={{ height: 'calc(100vh - 200px)', minHeight: 300 }}
        >
          <AnimatePresence>
            {round.bubbles.map(bubble => {
              const isPopped = poppedBubbleId === bubble.id
              const isWrong = wrongBubbleId === bubble.id
              const color = BUBBLE_COLORS[bubble.colorIndex]

              if (isPopped) {
                // Pop animation — burst and fade
                return (
                  <motion.div
                    key={`bubble-${bubble.id}`}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: `${bubble.startX}%`,
                      width: BUBBLE_SIZE,
                      height: BUBBLE_SIZE,
                      marginLeft: -(BUBBLE_SIZE / 2),
                    }}
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: [1, 1.4, 0], opacity: [1, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    {/* Pop particles */}
                    {popParticles.map(particle => {
                      const rad = (particle.angle * Math.PI) / 180
                      const px = Math.cos(rad) * particle.distance
                      const py = Math.sin(rad) * particle.distance
                      return (
                        <motion.div
                          key={`particle-${particle.id}`}
                          className="absolute rounded-full"
                          style={{
                            width: 12,
                            height: 12,
                            background: particle.color,
                          }}
                          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                          animate={{
                            x: px,
                            y: py,
                            scale: 0,
                            opacity: 0,
                          }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                      )
                    })}
                  </motion.div>
                )
              }

              // Normal floating bubble
              return (
                <motion.div
                  key={`bubble-${bubble.id}`}
                  className="absolute cursor-pointer select-none"
                  style={{
                    left: `${bubble.startX}%`,
                    width: BUBBLE_SIZE,
                    height: BUBBLE_SIZE,
                    marginLeft: -(BUBBLE_SIZE / 2),
                    bottom: -BUBBLE_SIZE,
                  }}
                  initial={{
                    y: 0,
                    opacity: 0,
                    scale: 0.3,
                  }}
                  animate={isWrong ? {
                    y: -(containerRef.current?.clientHeight ?? 600) - BUBBLE_SIZE * 2,
                    x: [0, -8, 8, -4, 0],
                    opacity: 1,
                    scale: 0.85,
                  } : {
                    y: -(containerRef.current?.clientHeight ?? 600) - BUBBLE_SIZE * 2,
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={isWrong ? {
                    y: { duration: bubble.speed, ease: 'linear', delay: bubble.startDelay / 1000 },
                    x: { duration: 0.4, ease: 'easeInOut' },
                    opacity: { duration: 0.3, delay: bubble.startDelay / 1000 },
                    scale: { duration: 0.3, delay: bubble.startDelay / 1000 },
                  } : {
                    y: { duration: bubble.speed, ease: 'linear', delay: bubble.startDelay / 1000 },
                    opacity: { duration: 0.3, delay: bubble.startDelay / 1000 },
                    scale: { duration: 0.4, delay: bubble.startDelay / 1000, type: 'spring', stiffness: 200 },
                  }}
                  onAnimationComplete={() => {
                    // Fires when all animated properties complete — y is the longest,
                    // so this means the bubble has floated off screen
                    handleBubbleFloatedOff(bubble.id)
                  }}
                  onClick={() => handlePop(bubble)}
                  whileTap={{ scale: 0.9 }}
                >
                  {/* Bubble body */}
                  <motion.div
                    className="w-full h-full rounded-full flex items-center justify-center relative"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%),
                                   linear-gradient(135deg, ${color.from}, ${color.to})`,
                      boxShadow: `0 4px 20px ${color.from}44, inset 0 -2px 6px rgba(0,0,0,0.1)`,
                    }}
                    animate={{
                      x: [-bubble.wobbleAmount / 2, bubble.wobbleAmount / 2],
                    }}
                    transition={{
                      x: {
                        duration: 1.8 + Math.random() * 0.5,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                        delay: bubble.startDelay / 1000,
                      },
                    }}
                  >
                    {/* Number */}
                    <span className="text-2xl font-extrabold text-white drop-shadow-md select-none">
                      {bubble.value}
                    </span>

                    {/* Shine highlight */}
                    <div className="absolute top-2 left-3 w-4 h-4 rounded-full bg-white/40" />

                    {/* Secondary shine */}
                    <div className="absolute top-3 left-5 w-2 h-2 rounded-full bg-white/25" />
                  </motion.div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Complete screen */}
      {phase === 'complete' && !celebration && (
        <motion.div
          className="flex flex-col items-center justify-center min-h-[70vh] gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-6xl">{'\uD83E\uDEE7'}</span>
          <h2 className="text-3xl font-extrabold text-white">
            All Bubbles Popped!
          </h2>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-xs w-full">
            <div className="space-y-2 text-center">
              <p className="text-xl text-white">
                <span className="font-bold">{score}</span>/{TOTAL_ROUNDS} correct
              </p>
              <p className="text-lg text-white/80">
                {Math.round((score / TOTAL_ROUNDS) * 100)}% accuracy
              </p>
            </div>
          </div>

          <motion.button
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-600
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

      {/* Progress dots */}
      {phase !== 'complete' && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-1.5 z-10">
          {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
            <motion.div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < currentRound ? 'bg-white' : i === currentRound ? 'bg-yellow-300' : 'bg-white/30'
              }`}
              animate={i === currentRound ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
