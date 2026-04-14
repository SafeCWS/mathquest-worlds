'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { getRandomFacts, MultiplicationFact } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { shuffleAnswers } from '@/lib/utils/multiplicationDifficulty'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import { TABLE_EMOJIS } from './VisualMultiplication'

interface MemoryCardsProps {
  tableNumber: number
}

interface MemoryCard {
  id: number
  factIndex: number
  type: 'problem' | 'answer'
  displayText: string
  isFlipped: boolean
  isMatched: boolean
  fact?: MultiplicationFact
}

function createCards(tableNumber: number): MemoryCard[] {
  const facts = getRandomFacts(tableNumber, 4)
  const cards: MemoryCard[] = []

  facts.forEach((fact, i) => {
    // Problem card
    cards.push({
      id: i * 2,
      factIndex: i,
      type: 'problem',
      displayText: `${fact.a} x ${fact.b}`,
      isFlipped: false,
      isMatched: false,
      fact,
    })
    // Answer card
    cards.push({
      id: i * 2 + 1,
      factIndex: i,
      type: 'answer',
      displayText: String(fact.product),
      isFlipped: false,
      isMatched: false,
      fact,
    })
  })

  return shuffleAnswers(cards)
}

export default function MemoryCards({ tableNumber }: MemoryCardsProps) {
  const [cards, setCards] = useState<MemoryCard[]>(() => createCards(tableNumber))
  const [flippedIds, setFlippedIds] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [mismatchMessage, setMismatchMessage] = useState<string | null>(null)
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emoji = TABLE_EMOJIS[tableNumber] || '⭐'

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleCardTap = useCallback((cardId: number) => {
    if (isChecking) return
    const card = cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched) return
    if (flippedIds.length >= 2) return

    sounds.playCardFlip()
    setMismatchMessage(null)

    // Flip the card
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, isFlipped: true } : c))
    )

    const newFlipped = [...flippedIds, cardId]
    setFlippedIds(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      setIsChecking(true)

      const card1 = cards.find(c => c.id === newFlipped[0])!
      const card2 = cards.find(c => c.id === cardId)!

      if (card1.factIndex === card2.factIndex && card1.type !== card2.type) {
        // Match found!
        timeoutRef.current = setTimeout(() => {
          sounds.playCorrect()
          setCards(prev =>
            prev.map(c =>
              c.factIndex === card1.factIndex
                ? { ...c, isMatched: true, isFlipped: true }
                : c
            )
          )
          const newMatchedCount = matchedPairs + 1
          setMatchedPairs(newMatchedCount)
          setFlippedIds([])
          setIsChecking(false)

          // Check if game complete (4 pairs)
          if (newMatchedCount === 4) {
            const totalMoves = moves + 1
            const stars = totalMoves <= 8 ? 3 : totalMoves <= 12 ? 2 : 1
            setGameComplete(true)
            recordModeScore(tableNumber, 'memory', stars)
            setTimeout(() => {
              showCelebration({
                type: 'level_complete',
                title: 'Memory Master!',
                subtitle: `${totalMoves} moves - ${stars} star${stars !== 1 ? 's' : ''}!`,
                emoji: '🧠',
                stars,
              })
            }, 500)
          }
        }, 400)
      } else {
        // No match - flip back after longer delay (1200ms)
        setMismatchMessage('Not a pair \u2014 keep trying!')
        timeoutRef.current = setTimeout(() => {
          sounds.playGentleError()
          setCards(prev =>
            prev.map(c =>
              newFlipped.includes(c.id) && !c.isMatched
                ? { ...c, isFlipped: false }
                : c
            )
          )
          setFlippedIds([])
          setIsChecking(false)
          setMismatchMessage(null)
        }, 1200)
      }
    }
  }, [cards, flippedIds, isChecking, matchedPairs, moves, tableNumber, recordModeScore, showCelebration])

  const handlePlayAgain = useCallback(() => {
    setCards(createCards(tableNumber))
    setFlippedIds([])
    setMoves(0)
    setMatchedPairs(0)
    setIsChecking(false)
    setGameComplete(false)
    setMismatchMessage(null)
  }, [tableNumber])

  // Build mini emoji rows for answer cards (max 2 rows shown)
  const renderMiniEmoji = (fact: MultiplicationFact) => {
    const rowsToShow = Math.min(fact.a, 2)
    const colsToShow = Math.min(fact.b, 6)
    return (
      <div className="flex flex-col items-center gap-0 mt-1">
        {Array.from({ length: rowsToShow }, (_, r) => (
          <div key={r} className="flex gap-0">
            {Array.from({ length: colsToShow }, (_, c) => (
              <span key={c} className="text-[10px] leading-tight">{emoji}</span>
            ))}
            {fact.b > 6 && <span className="text-[8px] text-gray-400">...</span>}
          </div>
        ))}
        {fact.a > 2 && <span className="text-[8px] text-gray-400">...</span>}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-300 via-violet-300 to-fuchsia-400 p-4 pb-24">
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Header */}
      <motion.div
        className="text-center mb-3 pt-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">
          Memory Match
        </h1>
        <p className="text-white/80 text-sm">
          Moves: {moves} | Pairs: {matchedPairs}/4
        </p>
      </motion.div>

      {/* Mismatch message */}
      <AnimatePresence>
        {mismatchMessage && (
          <motion.div
            className="text-center mb-2"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-sm font-bold text-white bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">
              {mismatchMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card grid: 2x4 */}
      <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
        {cards.map((card, index) => (
          <motion.button
            key={card.id}
            className="relative aspect-[3/4] rounded-xl overflow-hidden min-h-[100px]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, type: 'spring' }}
            whileTap={!card.isFlipped && !card.isMatched ? { scale: 0.95 } : {}}
            onClick={() => handleCardTap(card.id)}
            disabled={card.isFlipped || card.isMatched || isChecking}
            style={{ perspective: 600 }}
          >
            {/* Card inner with 3D flip */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotateY: card.isFlipped ? 180 : 0 }}
              transition={{ duration: 0.4, type: 'spring', damping: 20 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Card back (face down) */}
              <div
                className={`absolute inset-0 rounded-xl flex items-center justify-center
                           bg-gradient-to-br from-purple-500 to-indigo-600
                           border-3 border-purple-400 shadow-lg
                           ${card.isFlipped ? 'invisible' : ''}`}
                style={{ backfaceVisibility: 'hidden' }}
              >
                <span className="text-3xl">?</span>
              </div>

              {/* Card front (face up) */}
              <div
                className={`absolute inset-0 rounded-xl flex flex-col items-center justify-center
                           ${card.isMatched
                             ? 'bg-gradient-to-br from-green-100 to-green-200 border-3 border-green-400'
                             : 'bg-white border-3 border-purple-200'
                           }
                           shadow-lg`}
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <span className={`font-bold ${card.type === 'problem' ? 'text-lg text-indigo-700' : 'text-2xl text-emerald-700'}`}>
                  {card.displayText}
                </span>
                {/* Mini emoji hint on answer cards */}
                {card.type === 'answer' && card.fact && renderMiniEmoji(card.fact)}
                {card.isMatched && (
                  <motion.span
                    className="absolute top-1 right-1 text-green-500 text-sm"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    &#10003;
                  </motion.span>
                )}
              </div>
            </motion.div>
          </motion.button>
        ))}
      </div>

      {/* Play Again */}
      <AnimatePresence>
        {gameComplete && !celebration && (
          <motion.div
            className="flex justify-center mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-600
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
