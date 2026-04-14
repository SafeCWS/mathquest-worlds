'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { getRandomFacts, MultiplicationFact } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { shuffleAnswers } from '@/lib/utils/multiplicationDifficulty'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import { useHintSystem, HintButton } from '@/lib/hooks/useHintSystem'
import VisualMultiplication from './VisualMultiplication'
import { WRONG_ANSWER_MESSAGES, CORRECT_ANSWER_MESSAGES, getRandomMessage } from '@/lib/constants/encouragementMessages'

interface DragDropMatchProps {
  tableNumber: number
}

interface MatchState {
  facts: MultiplicationFact[]
  shuffledAnswers: number[]
  matched: Set<number>
  selectedProblem: number | null
  wrongCount: number
  shakeAnswer: number | null
}

function initGame(tableNumber: number): MatchState {
  const facts = getRandomFacts(tableNumber, 4)
  const shuffledAnswers = shuffleAnswers(facts.map(f => f.product))
  return {
    facts,
    shuffledAnswers,
    matched: new Set(),
    selectedProblem: null,
    wrongCount: 0,
    shakeAnswer: null,
  }
}

export default function DragDropMatch({ tableNumber }: DragDropMatchProps) {
  const [game, setGame] = useState<MatchState>(() => initGame(tableNumber))
  const [gameComplete, setGameComplete] = useState(false)
  const [earnedStars, setEarnedStars] = useState(0)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [wrongVisual, setWrongVisual] = useState<MultiplicationFact | null>(null)
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const { hintLevel, showHint, resetHint, totalHintsUsed, visualProps, hintPenalty } = useHintSystem()

  const handleProblemTap = useCallback((index: number) => {
    if (game.matched.has(index)) return
    sounds.playSelect()
    setGame(prev => ({ ...prev, selectedProblem: index }))
    resetHint()
    setFeedbackMessage(null)
    setWrongVisual(null)
  }, [game.matched, resetHint])

  const handleAnswerTap = useCallback((answerIndex: number) => {
    if (game.selectedProblem === null) return

    const selectedFact = game.facts[game.selectedProblem]
    const tappedAnswer = game.shuffledAnswers[answerIndex]

    // Check if this answer is already matched
    const alreadyMatched = Array.from(game.matched).some(factIdx => {
      return game.facts[factIdx].product === tappedAnswer
    })
    if (alreadyMatched) return

    if (tappedAnswer === selectedFact.product) {
      // Correct match
      sounds.playCorrect()
      const newMatched = new Set(game.matched)
      newMatched.add(game.selectedProblem)

      const isComplete = newMatched.size === game.facts.length
      const msg = getRandomMessage(CORRECT_ANSWER_MESSAGES)
      setFeedbackMessage(msg)
      setWrongVisual(null)

      setGame(prev => ({
        ...prev,
        matched: newMatched,
        selectedProblem: null,
      }))

      if (isComplete) {
        const wrong = game.wrongCount
        const rawStars = wrong <= 2 ? 3 : wrong <= 4 ? 2 : 1
        const stars = Math.max(Math.round(rawStars - hintPenalty), 1)
        setEarnedStars(stars)
        setGameComplete(true)
        recordModeScore(tableNumber, 'match', stars)
        setTimeout(() => {
          showCelebration({
            type: 'level_complete',
            title: 'Great Matching!',
            subtitle: `${stars} star${stars !== 1 ? 's' : ''} earned!`,
            emoji: '🎯',
            stars,
          })
        }, 400)
      }

      // Clear correct message after a moment
      setTimeout(() => setFeedbackMessage(null), 1500)
    } else {
      // Wrong match - gentle wobble instead of harsh shake
      sounds.playGentleError()
      const msg = getRandomMessage(WRONG_ANSWER_MESSAGES)
      setFeedbackMessage(msg)
      setWrongVisual(selectedFact)

      setGame(prev => ({
        ...prev,
        wrongCount: prev.wrongCount + 1,
        shakeAnswer: answerIndex,
      }))

      // Clear shake after gentle animation
      setTimeout(() => {
        setGame(prev => ({ ...prev, shakeAnswer: null }))
      }, 600)

      // Clear visual hint after 2 seconds
      setTimeout(() => {
        setWrongVisual(null)
        setFeedbackMessage(null)
      }, 2000)
    }
  }, [game, tableNumber, recordModeScore, showCelebration, hintPenalty])

  const handlePlayAgain = useCallback(() => {
    setGame(initGame(tableNumber))
    setGameComplete(false)
    setEarnedStars(0)
    setFeedbackMessage(null)
    setWrongVisual(null)
    resetHint()
  }, [tableNumber, resetHint])

  // Find which answer index corresponds to a matched fact
  const isAnswerMatched = (answerIndex: number): boolean => {
    const answer = game.shuffledAnswers[answerIndex]
    return Array.from(game.matched).some(factIdx => game.facts[factIdx].product === answer)
  }

  const selectedFact = game.selectedProblem !== null ? game.facts[game.selectedProblem] : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 via-indigo-300 to-violet-400 p-4 pb-24">
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Header */}
      <motion.div
        className="text-center mb-4 pt-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">
          Match the Pairs!
        </h1>
        <p className="text-white/80 text-sm">
          Tap a problem, then tap its answer
        </p>
      </motion.div>

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

      {/* Wrong answer visual hint */}
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

      {/* Game area: two columns */}
      <div className="flex gap-3 justify-center max-w-lg mx-auto">
        {/* Problems column */}
        <div className="flex flex-col gap-2 flex-1">
          <p className="text-xs font-bold text-white/70 text-center mb-1">PROBLEMS</p>
          {game.facts.map((fact, index) => {
            const isMatched = game.matched.has(index)
            const isSelected = game.selectedProblem === index
            return (
              <motion.button
                key={`p-${index}`}
                className={`rounded-2xl px-4 py-3 text-lg font-bold shadow-md min-h-[52px]
                           transition-colors border-3
                           ${isMatched
                             ? 'bg-green-200 border-green-400 text-green-700 opacity-60'
                             : isSelected
                               ? 'bg-white border-indigo-500 text-indigo-700 ring-2 ring-indigo-400'
                               : 'bg-white/90 border-white/50 text-gray-800'
                           }`}
                whileTap={!isMatched ? { scale: 0.95 } : {}}
                animate={isMatched ? { scale: [1, 1.05, 1] } : {}}
                transition={isMatched ? { duration: 0.3 } : {}}
                onClick={() => handleProblemTap(index)}
                disabled={isMatched}
              >
                {isMatched ? (
                  <span>&#10003; {fact.a} x {fact.b}</span>
                ) : (
                  <span>{fact.a} x {fact.b}</span>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Answers column */}
        <div className="flex flex-col gap-2 flex-1">
          <p className="text-xs font-bold text-white/70 text-center mb-1">ANSWERS</p>
          {game.shuffledAnswers.map((answer, index) => {
            const matched = isAnswerMatched(index)
            const isShaking = game.shakeAnswer === index
            return (
              <motion.button
                key={`a-${index}`}
                className={`rounded-2xl px-4 py-3 text-lg font-bold shadow-md min-h-[52px]
                           transition-colors border-3
                           ${matched
                             ? 'bg-green-200 border-green-400 text-green-700 opacity-60'
                             : 'bg-white/90 border-white/50 text-gray-800'
                           }`}
                whileTap={!matched ? { scale: 0.95 } : {}}
                animate={
                  isShaking
                    ? { x: [0, -3, 3, -3, 0], borderColor: '#f59e0b' }
                    : matched
                      ? { scale: [1, 1.05, 1] }
                      : {}
                }
                transition={isShaking ? { duration: 0.4 } : { duration: 0.3 }}
                onClick={() => handleAnswerTap(index)}
                disabled={matched}
              >
                {matched ? <span>&#10003; {answer}</span> : answer}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Hint button - shows when a problem is selected */}
      <AnimatePresence>
        {selectedFact && !gameComplete && (
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
                  a={selectedFact.a}
                  b={selectedFact.b}
                  show={visualProps}
                  size="compact"
                  animateIn={true}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score indicator */}
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

      {/* Game complete overlay */}
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

      {/* Back button */}
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
