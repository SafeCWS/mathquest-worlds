'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { getRandomFacts, MultiplicationFact } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { shuffleAnswers } from '@/lib/utils/multiplicationDifficulty'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { speakEquation, cancelSpeech } from '@/lib/sounds/speechUtils'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import { useHintSystem, HintButton } from '@/lib/hooks/useHintSystem'
import VisualMultiplication from './VisualMultiplication'
import {
  WRONG_ANSWER_MESSAGES,
  CORRECT_ANSWER_MESSAGES,
  getRandomMessage,
} from '@/lib/constants/encouragementMessages'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FactMatcherDragProps {
  tableNumber: number
}

interface DragState {
  factIndex: number
  startX: number
  startY: number
  currentX: number
  currentY: number
  factRect: DOMRect
}

interface MatchGameState {
  facts: MultiplicationFact[]
  shuffledAnswers: number[]
  matched: Set<number> // indices of matched facts
  wrongCount: number
}

// ---------------------------------------------------------------------------
// Table accent colors (left border on fact cards)
// ---------------------------------------------------------------------------

const TABLE_BORDER_COLORS: Record<number, string> = {
  1: 'border-l-rose-400',
  2: 'border-l-orange-400',
  3: 'border-l-yellow-400',
  4: 'border-l-green-400',
  5: 'border-l-teal-400',
  6: 'border-l-sky-400',
  7: 'border-l-indigo-400',
  8: 'border-l-purple-400',
  9: 'border-l-pink-400',
  10: 'border-l-amber-400',
}

const TABLE_BG_ACCENT: Record<number, string> = {
  1: 'bg-rose-50',
  2: 'bg-orange-50',
  3: 'bg-yellow-50',
  4: 'bg-green-50',
  5: 'bg-teal-50',
  6: 'bg-sky-50',
  7: 'bg-indigo-50',
  8: 'bg-purple-50',
  9: 'bg-pink-50',
  10: 'bg-amber-50',
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function initGame(tableNumber: number): MatchGameState {
  const facts = getRandomFacts(tableNumber, 5)
  const shuffledAnswers = shuffleAnswers(facts.map(f => f.product))
  return {
    facts,
    shuffledAnswers,
    matched: new Set(),
    wrongCount: 0,
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FactMatcherDrag({ tableNumber }: FactMatcherDragProps) {
  const [game, setGame] = useState<MatchGameState>(() => initGame(tableNumber))
  const [gameComplete, setGameComplete] = useState(false)
  const [earnedStars, setEarnedStars] = useState(0)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [wrongVisual, setWrongVisual] = useState<MultiplicationFact | null>(null)
  const [shakingAnswer, setShakingAnswer] = useState<number | null>(null)
  const [hoveredAnswer, setHoveredAnswer] = useState<number | null>(null)

  // Drag state
  const [drag, setDrag] = useState<DragState | null>(null)
  const answerRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const factCardRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Store + celebration + hints
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const { hintLevel, showHint, resetHint, totalHintsUsed, visualProps, hintPenalty } =
    useHintSystem()

  const borderColor = TABLE_BORDER_COLORS[tableNumber] || 'border-l-gray-400'
  const bgAccent = TABLE_BG_ACCENT[tableNumber] || 'bg-gray-50'

  // -------------------------------------------------------------------------
  // Answer ref registration
  // -------------------------------------------------------------------------
  const setAnswerRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      answerRefs.current.set(index, el)
    } else {
      answerRefs.current.delete(index)
    }
  }, [])

  const setFactRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      factCardRefs.current.set(index, el)
    } else {
      factCardRefs.current.delete(index)
    }
  }, [])

  // -------------------------------------------------------------------------
  // Find which answer card the pointer is over
  // -------------------------------------------------------------------------
  const findAnswerAtPoint = useCallback(
    (clientX: number, clientY: number): number | null => {
      for (const [index, el] of answerRefs.current.entries()) {
        const rect = el.getBoundingClientRect()
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          return index
        }
      }
      return null
    },
    []
  )

  // -------------------------------------------------------------------------
  // Check if an answer index is already matched
  // -------------------------------------------------------------------------
  const isAnswerMatched = useCallback(
    (answerIndex: number): boolean => {
      const answer = game.shuffledAnswers[answerIndex]
      return Array.from(game.matched).some(
        factIdx => game.facts[factIdx].product === answer
      )
    },
    [game.matched, game.facts, game.shuffledAnswers]
  )

  // -------------------------------------------------------------------------
  // Pointer handlers
  // -------------------------------------------------------------------------
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, factIndex: number) => {
      if (game.matched.has(factIndex) || gameComplete) return

      // Prevent text selection, scroll
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)

      const factEl = factCardRefs.current.get(factIndex)
      const factRect = factEl?.getBoundingClientRect() ?? new DOMRect()

      sounds.playSelect()
      const fact = game.facts[factIndex]
      speakEquation(fact.a, fact.b)
      resetHint()
      setFeedbackMessage(null)
      setWrongVisual(null)

      setDrag({
        factIndex,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        factRect,
      })
    },
    [game.matched, game.facts, gameComplete, resetHint]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag) return
      e.preventDefault()

      const newDrag = { ...drag, currentX: e.clientX, currentY: e.clientY }
      setDrag(newDrag)

      // Detect hovering over answer card
      const answerIdx = findAnswerAtPoint(e.clientX, e.clientY)
      if (answerIdx !== null && !isAnswerMatched(answerIdx)) {
        setHoveredAnswer(answerIdx)
      } else {
        setHoveredAnswer(null)
      }
    },
    [drag, findAnswerAtPoint, isAnswerMatched]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!drag) return

      const answerIdx = findAnswerAtPoint(e.clientX, e.clientY)
      setHoveredAnswer(null)

      if (answerIdx !== null && !isAnswerMatched(answerIdx)) {
        const selectedFact = game.facts[drag.factIndex]
        const tappedAnswer = game.shuffledAnswers[answerIdx]

        if (tappedAnswer === selectedFact.product) {
          // ------ CORRECT MATCH ------
          sounds.playCorrect()
          const newMatched = new Set(game.matched)
          newMatched.add(drag.factIndex)

          const isComplete = newMatched.size === game.facts.length

          const msg = getRandomMessage(CORRECT_ANSWER_MESSAGES)
          setFeedbackMessage(msg)
          setWrongVisual(null)

          setGame(prev => ({
            ...prev,
            matched: newMatched,
          }))

          if (isComplete) {
            const wrong = game.wrongCount
            const rawStars = wrong === 0 ? 3 : wrong <= 2 ? 2 : 1
            const stars = Math.max(Math.round(rawStars - hintPenalty), 1)
            setEarnedStars(stars)
            setGameComplete(true)
            recordModeScore(tableNumber, 'dragmatch', stars)
            setTimeout(() => {
              showCelebration({
                type: 'level_complete',
                title: 'Great Dragging!',
                subtitle: `${stars} star${stars !== 1 ? 's' : ''} earned!`,
                emoji: '🎯',
                stars,
              })
            }, 400)
          }

          setTimeout(() => setFeedbackMessage(null), 1500)
        } else {
          // ------ WRONG MATCH ------
          sounds.playGentleError()
          const msg = getRandomMessage(WRONG_ANSWER_MESSAGES)
          setFeedbackMessage(msg)
          setWrongVisual(selectedFact)
          setShakingAnswer(answerIdx)

          setGame(prev => ({
            ...prev,
            wrongCount: prev.wrongCount + 1,
          }))

          setTimeout(() => setShakingAnswer(null), 600)
          setTimeout(() => {
            setWrongVisual(null)
            setFeedbackMessage(null)
          }, 2000)
        }
      }

      // Always clear drag
      setDrag(null)
    },
    [
      drag,
      findAnswerAtPoint,
      isAnswerMatched,
      game,
      tableNumber,
      recordModeScore,
      showCelebration,
      hintPenalty,
    ]
  )

  // Global pointer-move and pointer-up to catch events outside cards
  useEffect(() => {
    if (!drag) return

    const onMove = (e: PointerEvent) => {
      e.preventDefault()
      setDrag(prev =>
        prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null
      )

      const answerIdx = findAnswerAtPoint(e.clientX, e.clientY)
      if (answerIdx !== null && !isAnswerMatched(answerIdx)) {
        setHoveredAnswer(answerIdx)
      } else {
        setHoveredAnswer(null)
      }
    }

    const onUp = (e: PointerEvent) => {
      const answerIdx = findAnswerAtPoint(e.clientX, e.clientY)
      setHoveredAnswer(null)

      if (answerIdx !== null && !isAnswerMatched(answerIdx)) {
        const selectedFact = game.facts[drag.factIndex]
        const tappedAnswer = game.shuffledAnswers[answerIdx]

        if (tappedAnswer === selectedFact.product) {
          sounds.playCorrect()
          const newMatched = new Set(game.matched)
          newMatched.add(drag.factIndex)

          const isComplete = newMatched.size === game.facts.length
          const msg = getRandomMessage(CORRECT_ANSWER_MESSAGES)
          setFeedbackMessage(msg)
          setWrongVisual(null)

          setGame(prev => ({ ...prev, matched: newMatched }))

          if (isComplete) {
            const wrong = game.wrongCount
            const rawStars = wrong === 0 ? 3 : wrong <= 2 ? 2 : 1
            const stars = Math.max(Math.round(rawStars - hintPenalty), 1)
            setEarnedStars(stars)
            setGameComplete(true)
            recordModeScore(tableNumber, 'dragmatch', stars)
            setTimeout(() => {
              showCelebration({
                type: 'level_complete',
                title: 'Great Dragging!',
                subtitle: `${stars} star${stars !== 1 ? 's' : ''} earned!`,
                emoji: '🎯',
                stars,
              })
            }, 400)
          }
          setTimeout(() => setFeedbackMessage(null), 1500)
        } else {
          sounds.playGentleError()
          const msg = getRandomMessage(WRONG_ANSWER_MESSAGES)
          setFeedbackMessage(msg)
          setWrongVisual(selectedFact)
          setShakingAnswer(answerIdx)

          setGame(prev => ({ ...prev, wrongCount: prev.wrongCount + 1 }))
          setTimeout(() => setShakingAnswer(null), 600)
          setTimeout(() => {
            setWrongVisual(null)
            setFeedbackMessage(null)
          }, 2000)
        }
      }

      setDrag(null)
    }

    document.addEventListener('pointermove', onMove, { passive: false })
    document.addEventListener('pointerup', onUp)

    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
  }, [
    drag,
    findAnswerAtPoint,
    isAnswerMatched,
    game,
    tableNumber,
    recordModeScore,
    showCelebration,
    hintPenalty,
  ])

  // -------------------------------------------------------------------------
  // Play Again
  // -------------------------------------------------------------------------
  const handlePlayAgain = useCallback(() => {
    setGame(initGame(tableNumber))
    setGameComplete(false)
    setEarnedStars(0)
    setFeedbackMessage(null)
    setWrongVisual(null)
    setDrag(null)
    resetHint()
    cancelSpeech()
  }, [tableNumber, resetHint])

  // -------------------------------------------------------------------------
  // Compute drag ghost position
  // -------------------------------------------------------------------------
  const dragOffsetX = drag ? drag.currentX - drag.startX : 0
  const dragOffsetY = drag ? drag.currentY - drag.startY : 0

  // The currently dragged fact (for the hint system / speaker)
  const activeFact = drag ? game.facts[drag.factIndex] : null

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-blue-300 via-indigo-300 to-violet-400 p-4 pb-24 select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* ---- Header ---- */}
      <motion.div
        className="text-center mb-4 pt-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">
          Drag to Match!
        </h1>
        <p className="text-white/80 text-sm">
          Drag a problem onto its answer
        </p>
      </motion.div>

      {/* ---- Speaker button for active drag ---- */}
      <AnimatePresence>
        {activeFact && !gameComplete && (
          <motion.div
            className="flex justify-center mb-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <button
              onClick={() => speakEquation(activeFact.a, activeFact.b)}
              className="text-lg opacity-60 hover:opacity-100 transition-opacity min-w-[36px] min-h-[36px] flex items-center justify-center bg-white/20 rounded-full px-3 py-1"
              aria-label="Read aloud"
            >
              <span role="img" aria-hidden="true">
                &#128266;
              </span>
              <span className="ml-1 text-sm text-white font-semibold">
                {activeFact.a} x {activeFact.b}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Feedback message ---- */}
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

      {/* ---- Wrong answer visual hint ---- */}
      <AnimatePresence>
        {wrongVisual && (
          <motion.div
            className="mb-3 max-w-xs mx-auto bg-white/15 backdrop-blur-sm rounded-2xl p-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <VisualMultiplication
              a={wrongVisual.a}
              b={wrongVisual.b}
              show={{ groups: true, additionBridge: true, answer: false }}
              size="compact"
              animateIn={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Game area: two columns ---- */}
      <div className="flex gap-3 justify-center max-w-lg mx-auto">
        {/* Facts column (left) */}
        <div className="flex flex-col gap-2 flex-1">
          <p className="text-xs font-bold text-white/70 text-center mb-1">
            PROBLEMS
          </p>
          {game.facts.map((fact, index) => {
            const isMatched = game.matched.has(index)
            const isDragging = drag?.factIndex === index

            return (
              <div
                key={`fact-${index}`}
                ref={el => setFactRef(index, el)}
                className="relative"
              >
                <motion.div
                  className={`rounded-2xl px-4 py-3 text-lg font-bold shadow-md min-h-[56px]
                    flex items-center justify-center
                    border-l-4 border-2 cursor-grab active:cursor-grabbing
                    ${borderColor}
                    ${
                      isMatched
                        ? 'bg-green-200 border-green-400 text-green-700 opacity-60'
                        : isDragging
                          ? `${bgAccent} border-indigo-400 opacity-40`
                          : `bg-white/95 border-white/50 text-gray-800`
                    }`}
                  animate={isMatched ? { scale: [1, 1.05, 1] } : {}}
                  transition={isMatched ? { duration: 0.3 } : {}}
                  onPointerDown={e => handlePointerDown(e, index)}
                  style={{
                    touchAction: 'none',
                    userSelect: 'none',
                  }}
                >
                  {isMatched ? (
                    <span>&#10003; {fact.a} x {fact.b}</span>
                  ) : (
                    <span>{fact.a} x {fact.b}</span>
                  )}
                </motion.div>
              </div>
            )
          })}
        </div>

        {/* Answers column (right) */}
        <div className="flex flex-col gap-2 flex-1">
          <p className="text-xs font-bold text-white/70 text-center mb-1">
            ANSWERS
          </p>
          {game.shuffledAnswers.map((answer, index) => {
            const matched = isAnswerMatched(index)
            const isShaking = shakingAnswer === index
            const isHovered = hoveredAnswer === index && !matched

            return (
              <motion.div
                key={`ans-${index}`}
                ref={el => setAnswerRef(index, el)}
                className={`rounded-2xl px-4 py-3 text-lg font-bold shadow-md min-h-[56px]
                  flex items-center justify-center
                  border-2 transition-colors
                  ${
                    matched
                      ? 'bg-green-200 border-green-400 text-green-700 opacity-60'
                      : isHovered
                        ? 'bg-indigo-100 border-indigo-400 border-dashed text-indigo-700 scale-105'
                        : 'bg-white/90 border-dashed border-gray-300 text-gray-800'
                  }`}
                animate={
                  isShaking
                    ? { x: [0, -4, 4, -4, 0], borderColor: '#f59e0b' }
                    : matched
                      ? { scale: [1, 1.05, 1] }
                      : {}
                }
                transition={isShaking ? { duration: 0.4 } : { duration: 0.3 }}
                style={{ touchAction: 'none', userSelect: 'none' }}
              >
                {matched ? (
                  <span>&#10003; {answer}</span>
                ) : (
                  <span>{answer}</span>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ---- Drag ghost (follows pointer) ---- */}
      {drag && (
        <div
          className={`fixed pointer-events-none z-50 rounded-2xl px-5 py-3
            text-lg font-bold shadow-2xl min-h-[56px]
            flex items-center justify-center
            border-l-4 border-2 ${borderColor} bg-white/95 text-gray-800`}
          style={{
            left: drag.factRect.left + dragOffsetX,
            top: drag.factRect.top + dragOffsetY,
            width: drag.factRect.width,
            opacity: 0.92,
            transform: 'rotate(2deg)',
            transition: 'none',
          }}
        >
          {game.facts[drag.factIndex].a} x {game.facts[drag.factIndex].b}
        </div>
      )}

      {/* ---- Hint button ---- */}
      <AnimatePresence>
        {activeFact && !gameComplete && (
          <motion.div
            className="flex flex-col items-center gap-2 mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <HintButton onTap={showHint} hintLevel={hintLevel} />
            {hintLevel > 0 && (
              <motion.div
                className="max-w-xs w-full bg-white/15 backdrop-blur-sm rounded-2xl p-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <VisualMultiplication
                  a={activeFact.a}
                  b={activeFact.b}
                  show={visualProps}
                  size="compact"
                  animateIn={true}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Score indicator ---- */}
      <motion.div
        className="text-center mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-white/70 text-sm">
          Matched: {game.matched.size} / {game.facts.length}
          {game.wrongCount > 0 && ` | Mistakes: ${game.wrongCount}`}
        </span>
      </motion.div>

      {/* ---- Game complete: Play Again ---- */}
      <AnimatePresence>
        {gameComplete && !celebration && (
          <motion.div
            className="fixed inset-x-0 bottom-20 flex justify-center z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600
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
      </AnimatePresence>

      {/* ---- Back button ---- */}
      <motion.div
        className="fixed bottom-4 left-0 right-0 flex justify-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
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
