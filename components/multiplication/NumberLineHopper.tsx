'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { getRandomFacts, MultiplicationFact } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { generateWrongAnswers, shuffleAnswers } from '@/lib/utils/multiplicationDifficulty'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { speak, speakEquation } from '@/lib/sounds/speechUtils'
import { useInteractionCooldown } from '@/lib/hooks/useInteractionCooldown'
import { useHintSystem, HintButton } from '@/lib/hooks/useHintSystem'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import { WRONG_ANSWER_MESSAGES, CORRECT_ANSWER_MESSAGES, getRandomMessage } from '@/lib/constants/encouragementMessages'

interface NumberLineHopperProps {
  tableNumber: number
}

const TOTAL_ROUNDS = 5

// Number line maximum = target + some padding so the line extends past the answer
function getNumberLineMax(target: number, step: number): number {
  // Add 2-3 extra ticks beyond the target so the answer isn't always at the end
  return target + step * (1 + Math.floor(Math.random() * 2))
}

interface Round {
  fact: MultiplicationFact       // e.g. { a: 3, b: 5, product: 15 }
  numberLineMax: number          // how far the number line goes
  choices: number[]              // multiple-choice answers (product)
}

function generateRounds(tableNumber: number): Round[] {
  // Get facts where b >= 2 so we have at least 2 hops
  const allFacts = getRandomFacts(tableNumber, 10)
  const playable = allFacts.filter(f => f.b >= 2 && f.b <= 8)
  const pool = playable.length >= TOTAL_ROUNDS ? playable : allFacts.filter(f => f.b >= 2)

  // Take 5 unique facts
  const selected = pool.slice(0, TOTAL_ROUNDS)
  // Pad with repeats if needed
  while (selected.length < TOTAL_ROUNDS) {
    selected.push(pool[selected.length % pool.length])
  }

  return selected.map(fact => {
    const nlMax = getNumberLineMax(fact.product, fact.a)
    const wrong = generateWrongAnswers(fact.product, 2, 'product')
    const choices = shuffleAnswers([fact.product, ...wrong])
    return { fact, numberLineMax: nlMax, choices }
  })
}

export default function NumberLineHopper({ tableNumber }: NumberLineHopperProps) {
  const [rounds, setRounds] = useState<Round[]>(() => generateRounds(tableNumber))
  const [currentRound, setCurrentRound] = useState(0)
  const [hopCount, setHopCount] = useState(0)
  const [phase, setPhase] = useState<'hopping' | 'answering' | 'feedback' | 'complete'>('hopping')
  const [score, setScore] = useState(0)
  const [feedbackCorrect, setFeedbackCorrect] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const { isLocked, triggerCooldown } = useInteractionCooldown()
  const { hintLevel, showHint, resetHint, hintPenalty } = useHintSystem()
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const numberLineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout)
  }, [])

  const round = rounds[currentRound]
  const step = round.fact.a          // jump size = table number
  const targetHops = round.fact.b    // number of hops needed
  const target = round.fact.product  // where the frog should land

  // Current frog position on the number line
  const frogPosition = hopCount * step

  // Landing spots visited so far (multiples of step)
  const landingSpots = useMemo(() => {
    const spots: number[] = []
    for (let i = 1; i <= hopCount; i++) {
      spots.push(i * step)
    }
    return spots
  }, [hopCount, step])

  // Running text: "3, 6, 9, 12"
  const runningText = useMemo(() => {
    if (landingSpots.length === 0) return ''
    return landingSpots.join(', ')
  }, [landingSpots])

  // Speak the round prompt — does NOT mention the step ("by 3"), which would
  // telegraph the answer. The kid figures out the step from the Hop button.
  useEffect(() => {
    if (phase === 'hopping' && hopCount === 0) {
      const timer = setTimeout(() => {
        speak(`Hop the frog until you reach the answer to ${step} times ${targetHops}!`)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [currentRound, phase, hopCount, step, targetHops])

  // Scroll the number line to keep the frog visible
  useEffect(() => {
    if (numberLineRef.current && hopCount > 0) {
      const container = numberLineRef.current
      // Each tick is about 48px wide, scroll to keep frog roughly centered
      const frogPixelPos = frogPosition * 48
      const scrollTarget = Math.max(0, frogPixelPos - container.clientWidth / 2)
      container.scrollTo({ left: scrollTarget, behavior: 'smooth' })
    }
  }, [frogPosition, hopCount])

  // Handle the "Hop!" button
  const handleHop = useCallback(() => {
    if (phase !== 'hopping') return
    const newHopCount = hopCount + 1

    sounds.playBoing()
    setHopCount(newHopCount)

    // After reaching target hops, transition to answering
    if (newHopCount >= targetHops) {
      const t = setTimeout(() => {
        speak(`The frog hopped ${targetHops} times! What is ${step} times ${targetHops}?`, { pace: 'kid-fast' })
        setPhase('answering')
      }, 700)
      timeoutsRef.current.push(t)
    }
  }, [phase, hopCount, targetHops, step])

  // Handle answer selection
  const handleAnswer = useCallback((answer: number) => {
    if (isLocked) return
    if (phase !== 'answering') return
    triggerCooldown()
    setSelectedAnswer(answer)

    const isCorrect = answer === target
    if (isCorrect) {
      sounds.playCorrect()
      setScore(s => s + 1)
      setFeedbackCorrect(true)
      setFeedbackMessage(getRandomMessage(CORRECT_ANSWER_MESSAGES))
    } else {
      sounds.playGentleError()
      setFeedbackCorrect(false)
      setFeedbackMessage(`Not quite! ${step} x ${targetHops} = ${target}`)
    }
    setPhase('feedback')

    const delay = isCorrect ? 1200 : 2500
    timeoutsRef.current.push(setTimeout(() => {
      const nextRound = currentRound + 1
      if (nextRound >= TOTAL_ROUNDS) {
        const finalScore = isCorrect ? score + 1 : score
        const rawStars = finalScore >= 5 ? 3 : finalScore >= 3 ? 2 : 1
        const stars = Math.max(Math.round(rawStars - hintPenalty), 1)
        setPhase('complete')
        recordModeScore(tableNumber, 'numberline', stars)
        showCelebration({
          type: 'level_complete',
          title: 'Hop Champion!',
          subtitle: `${finalScore}/${TOTAL_ROUNDS} correct - ${stars} star${stars !== 1 ? 's' : ''}!`,
          emoji: '🐸',
          stars,
        })
      } else {
        setCurrentRound(nextRound)
        setHopCount(0)
        setPhase('hopping')
        setSelectedAnswer(null)
        setFeedbackMessage(null)
        resetHint()
      }
    }, delay))
  }, [phase, target, step, targetHops, currentRound, score, tableNumber,
      recordModeScore, showCelebration, isLocked, triggerCooldown, resetHint, hintPenalty])

  const handlePlayAgain = useCallback(() => {
    setRounds(generateRounds(tableNumber))
    setCurrentRound(0)
    setHopCount(0)
    setScore(0)
    setPhase('hopping')
    setFeedbackCorrect(false)
    setFeedbackMessage(null)
    setSelectedAnswer(null)
    resetHint()
  }, [tableNumber, resetHint])

  // Number line ticks from 0 to numberLineMax
  const nlMax = round.numberLineMax
  const ticks = useMemo(() => {
    const arr: number[] = []
    for (let i = 0; i <= nlMax; i++) {
      arr.push(i)
    }
    return arr
  }, [nlMax])

  // Pixel spacing per unit on the number line
  const TICK_SPACING = 48

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-blue-300 to-cyan-400 p-4 pt-16 pb-8">
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Header */}
      <motion.div
        className="text-center mb-3 pt-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">
          Number Line Hopper
        </h1>
        <p className="text-white/80 text-sm">
          Round {Math.min(currentRound + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS} | Score: {score}
        </p>
      </motion.div>

      {/* Equation prompt */}
      {phase !== 'complete' && (
        <motion.div
          className="text-center mb-3"
          key={`eq-${currentRound}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="text-lg font-bold text-white bg-black/20 backdrop-blur-sm px-5 py-2 rounded-full inline-flex items-center gap-2">
            <span className="text-2xl">🐸</span>
            {step} x {targetHops} = ?
            <button
              onClick={() => speakEquation(step, targetHops, {
                revealMode: hintLevel >= 1 ? 'with-hint' : 'question-only',
              })}
              className="ml-1 opacity-60 hover:opacity-100 transition-opacity min-w-[32px] min-h-[32px]
                         flex items-center justify-center"
              aria-label="Read aloud"
            >
              <span role="img" aria-hidden="true">&#128266;</span>
            </button>
          </span>
        </motion.div>
      )}

      {/* Hop counter */}
      {phase !== 'complete' && (
        <motion.div
          className="text-center mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-sm text-white/70 font-semibold">
            Hops: {hopCount} / {targetHops}
          </span>
        </motion.div>
      )}

      {/* Running skip-count text — only shows after the kid taps for a hint
          OR after the answer is locked in (feedback). Pre-hint it would
          telegraph the answer (3, 6, 9 → 12). */}
      <AnimatePresence>
        {runningText && phase !== 'complete' && (hintLevel >= 1 || phase === 'feedback') && (
          <motion.div
            className="text-center mb-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span
              data-testid="skip-count-text"
              className="text-base font-bold text-white bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full"
            >
              {runningText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Number Line */}
      {phase !== 'complete' && (
        <motion.div
          className="mb-4"
          key={`nl-${currentRound}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            ref={numberLineRef}
            className="overflow-x-auto pb-2 scrollbar-hide"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div
              className="relative"
              style={{
                width: (nlMax + 1) * TICK_SPACING + 40,
                height: 160,
                minWidth: '100%',
              }}
            >
              {/* Hop arcs (dashed paths showing jumps) */}
              {landingSpots.map((spot, i) => {
                const startX = (i === 0 ? 0 : landingSpots[i - 1]) * TICK_SPACING + 20
                const endX = spot * TICK_SPACING + 20
                const midX = (startX + endX) / 2
                const arcHeight = 45
                return (
                  <motion.svg
                    key={`arc-${i}`}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{ width: '100%', height: 120 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <path
                      d={`M ${startX} 95 Q ${midX} ${95 - arcHeight} ${endX} 95`}
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    />
                  </motion.svg>
                )
              })}

              {/* Frog */}
              <motion.div
                className="absolute text-4xl z-10"
                style={{ top: 45 }}
                animate={{
                  x: frogPosition * TICK_SPACING + 20 - 18,
                  y: hopCount > 0 ? [0, -50, 0] : 0,
                }}
                transition={{
                  x: { duration: 0.5, ease: 'easeOut' },
                  y: { duration: 0.5, times: [0, 0.4, 1], ease: 'easeOut' },
                }}
              >
                🐸
              </motion.div>

              {/* Number line base */}
              <div
                className="absolute bg-white/40 rounded-full"
                style={{
                  top: 98,
                  left: 16,
                  width: nlMax * TICK_SPACING + 8,
                  height: 4,
                }}
              />

              {/* Ticks and labels */}
              {ticks.map(n => {
                const isMultiple = n > 0 && n % step === 0
                const isLanded = landingSpots.includes(n)
                const isFrogHere = n === frogPosition && hopCount > 0
                const isLabelTick = n === 0 || n % 5 === 0 || isMultiple
                const tickHeight = isMultiple ? 20 : 10

                return (
                  <div
                    key={`tick-${n}`}
                    className="absolute flex flex-col items-center"
                    style={{
                      left: n * TICK_SPACING + 20,
                      top: 100 - tickHeight,
                    }}
                  >
                    {/* Tick mark */}
                    <div
                      className={`rounded-full transition-all duration-300 ${
                        isLanded
                          ? 'bg-green-400 w-1.5'
                          : isMultiple
                            ? 'bg-white/70 w-1'
                            : 'bg-white/40 w-0.5'
                      }`}
                      style={{ height: tickHeight }}
                    />
                    {/* Number label */}
                    {isLabelTick && (
                      <motion.span
                        className={`text-xs font-bold mt-1 select-none ${
                          isFrogHere
                            ? 'text-green-300 text-sm'
                            : isLanded
                              ? 'text-green-200'
                              : 'text-white/70'
                        }`}
                        animate={isFrogHere ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      >
                        {n}
                      </motion.span>
                    )}

                    {/* Landing highlight dot */}
                    {isLanded && (
                      <motion.div
                        className="absolute -top-2 w-3 h-3 rounded-full bg-green-400/60"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                        style={{ top: -8 }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Hop Button */}
      <AnimatePresence>
        {phase === 'hopping' && (
          <motion.div
            className="flex justify-center mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <motion.button
              className="px-10 py-4 bg-gradient-to-r from-green-400 to-emerald-500
                         text-white font-extrabold text-xl rounded-full shadow-xl
                         border-4 border-white/30 min-h-[56px] min-w-[160px]
                         active:from-green-500 active:to-emerald-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleHop}
              disabled={hopCount >= targetHops}
            >
              <span className="flex items-center gap-2 justify-center">
                <span className="text-2xl">🐸</span>
                Hop! +{step}
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

      {/* Hint button — same cascade as Dice (skip-count visible at lvl 1+) */}
      <AnimatePresence>
        {phase === 'answering' && (
          <motion.div
            className="flex justify-center mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <HintButton onTap={showHint} hintLevel={hintLevel} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multiple choice answer */}
      <AnimatePresence>
        {(phase === 'answering' || phase === 'feedback') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-center text-white font-bold mb-3 text-lg">
              What is {step} x {targetHops}?
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              {round.choices.map((choice, idx) => {
                const isSelected = selectedAnswer === choice
                const showCorrect = phase === 'feedback' && choice === target
                const showWrong = phase === 'feedback' && isSelected && choice !== target

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
            className="px-8 py-3 bg-gradient-to-r from-sky-500 to-cyan-600
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
