'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { getRandomFacts, MultiplicationFact } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { shuffleAnswers } from '@/lib/utils/multiplicationDifficulty'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'

interface DragDropMatchProps {
  tableNumber: number
}

interface MatchState {
  facts: MultiplicationFact[]
  shuffledAnswers: number[]
  matched: Set<number>         // indices of matched facts
  selectedProblem: number | null // index of currently selected problem
  wrongCount: number
  shakeAnswer: number | null    // answer index currently shaking
}

function initGame(tableNumber: number): MatchState {
  const facts = getRandomFacts(tableNumber, 5)
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
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()

  const handleProblemTap = useCallback((index: number) => {
    if (game.matched.has(index)) return
    sounds.playSelect()
    setGame(prev => ({ ...prev, selectedProblem: index }))
  }, [game.matched])

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

      setGame(prev => ({
        ...prev,
        matched: newMatched,
        selectedProblem: null,
      }))

      if (isComplete) {
        const wrong = game.wrongCount
        const stars = wrong <= 1 ? 3 : wrong <= 3 ? 2 : 1
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
    } else {
      // Wrong match
      sounds.playWrong()
      setGame(prev => ({
        ...prev,
        wrongCount: prev.wrongCount + 1,
        shakeAnswer: answerIndex,
      }))
      // Clear shake after animation
      setTimeout(() => {
        setGame(prev => ({ ...prev, shakeAnswer: null }))
      }, 600)
    }
  }, [game, tableNumber, recordModeScore, showCelebration])

  const handlePlayAgain = useCallback(() => {
    setGame(initGame(tableNumber))
    setGameComplete(false)
    setEarnedStars(0)
  }, [tableNumber])

  // Find which answer index corresponds to a matched fact
  const isAnswerMatched = (answerIndex: number): boolean => {
    const answer = game.shuffledAnswers[answerIndex]
    return Array.from(game.matched).some(factIdx => game.facts[factIdx].product === answer)
  }

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
                    ? { x: [0, -8, 8, -8, 8, 0], borderColor: '#ef4444' }
                    : matched
                      ? { scale: [1, 1.05, 1] }
                      : {}
                }
                transition={isShaking ? { duration: 0.5 } : { duration: 0.3 }}
                onClick={() => handleAnswerTap(index)}
                disabled={matched}
              >
                {matched ? <span>&#10003; {answer}</span> : answer}
              </motion.button>
            )
          })}
        </div>
      </div>

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
