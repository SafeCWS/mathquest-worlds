'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { MULTIPLICATION_TABLES } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { generateWrongAnswers, shuffleAnswers } from '@/lib/utils/multiplicationDifficulty'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { speak } from '@/lib/sounds/speechUtils'
import { useInteractionCooldown } from '@/lib/hooks/useInteractionCooldown'
import { useEmojiThemeStore } from '@/lib/stores/emojiThemeStore'
import { EMOJI_NAME_FALLBACK } from '@/lib/constants/emojiOptions'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import { WRONG_ANSWER_MESSAGES, CORRECT_ANSWER_MESSAGES, getRandomMessage } from '@/lib/constants/encouragementMessages'

interface TimesTableChartProps {
  tableNumber: number
}

const HIDDEN_COUNT = 5

// Fun facts per table shown after completion
const TABLE_FUN_FACTS: Record<number, string> = {
  1: 'The 1s table is the easiest -- every answer is the same as the other number!',
  2: 'All answers in the 2s table are even numbers!',
  3: 'Add the digits of any answer in the 3s table -- you always get 3, 6, or 9!',
  4: 'The 4s table is just the 2s table doubled!',
  5: 'All answers in the 5s table end in 0 or 5!',
  6: 'The 6s table -- when multiplied by an even number, the answer ends in the same digit!',
  7: 'The 7s table has no easy pattern -- you just have to be extra smart to learn it!',
  8: 'The 8s table is the 4s table doubled, or the 2s table tripled!',
  9: 'Add the digits of any 9s answer -- you always get 9! (like 9x3=27, 2+7=9)',
  10: 'All answers in the 10s table just add a zero!',
}

// Table-specific colors for the grid
const TABLE_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-700' },
  2: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
  3: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700' },
  4: { bg: 'bg-lime-100', border: 'border-lime-300', text: 'text-lime-700' },
  5: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700' },
  6: { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-700' },
  7: { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700' },
  8: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' },
  9: { bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-700' },
  10: { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-700' },
}

interface CellState {
  columnNumber: number // 1-10 (the multiplier)
  product: number
  isHidden: boolean
  isSolved: boolean
  firstTryCorrect: boolean
}

interface ActivePopup {
  cellIndex: number
  choices: number[]
}

function generateCells(tableNumber: number): CellState[] {
  const facts = MULTIPLICATION_TABLES[tableNumber]
  if (!facts) return []

  // Pick 5 random indices to hide
  const indices = Array.from({ length: 10 }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  const hiddenIndices = new Set(indices.slice(0, HIDDEN_COUNT))

  return facts.map((fact, i) => ({
    columnNumber: fact.b,
    product: fact.product,
    isHidden: hiddenIndices.has(i),
    isSolved: false,
    firstTryCorrect: false,
  }))
}

export default function TimesTableChart({ tableNumber }: TimesTableChartProps) {
  const [cells, setCells] = useState<CellState[]>(() => generateCells(tableNumber))
  const [activePopup, setActivePopup] = useState<ActivePopup | null>(null)
  const [score, setScore] = useState(0)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [feedbackCorrect, setFeedbackCorrect] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [showFunFact, setShowFunFact] = useState(false)
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const { isLocked, triggerCooldown } = useInteractionCooldown()
  // Spoken name for the table's chosen emoji ("balloons" not "things").
  // Selector pattern matches Zustand idiom; resolves on every render so a
  // theme change in another tab is reflected after rehydrate.
  //
  // Hydration gate (added 2026-04-27 PACA G2): if the kid has set a custom
  // emoji for this table, SSR would render the DEFAULT_EMOJIS name while
  // the client rehydrates to the custom name — same shape as the Apr-19
  // React.memo silent-damage bug. We mirror the page.tsx pattern: emit the
  // generic 'thing'/'things' fallback until `_hasHydrated` is true, then
  // swap in the real spoken name. Worst case the kid hears "How many
  // things?" for one frame on a cold load — the speak() useEffect re-fires
  // when `emojiName.plural` changes after hydration.
  const _hasHydrated = useEmojiThemeStore(s => s._hasHydrated)
  const getTableEmojiName = useEmojiThemeStore(s => s.getTableEmojiName)
  const emojiName = _hasHydrated ? getTableEmojiName(tableNumber) : EMOJI_NAME_FALLBACK
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const colors = TABLE_COLORS[tableNumber] || TABLE_COLORS[1]

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout)
  }, [])

  // Count how many were solved on first try
  const firstTryCount = useMemo(
    () => cells.filter(c => c.firstTryCorrect).length,
    [cells]
  )

  // Count solved
  const solvedCount = useMemo(
    () => cells.filter(c => c.isHidden && c.isSolved).length,
    [cells]
  )

  // Speak intro on mount — names the chosen emoji so audio matches the
  // visual theme ("with balloons!" / "with bunnies!" / etc.)
  useEffect(() => {
    const t = setTimeout(() => {
      speak(`The ${tableNumber} times table — with ${emojiName.plural}! Tap the question marks.`)
    }, 500)
    return () => clearTimeout(t)
  }, [tableNumber, emojiName.plural])

  const handleCellTap = useCallback((cellIndex: number) => {
    const cell = cells[cellIndex]
    if (!cell.isHidden || cell.isSolved) return
    if (activePopup?.cellIndex === cellIndex) return

    sounds.playSelect()
    // Speak the cell prompt with the chosen emoji name so audio + visual
    // match. Never speaks the product.
    speak(`${tableNumber} groups of ${cell.columnNumber} ${emojiName.plural}. How many ${emojiName.plural}?`)

    // Generate 3 choices (1 correct + 2 wrong)
    const wrong = generateWrongAnswers(cell.product, 2, 'product')
    const choices = shuffleAnswers([cell.product, ...wrong])

    setActivePopup({ cellIndex, choices })
    setFeedbackMessage(null)
  }, [cells, activePopup, tableNumber, emojiName.plural])

  const handleChoiceTap = useCallback((answer: number) => {
    if (isLocked || !activePopup) return
    triggerCooldown()

    const cell = cells[activePopup.cellIndex]
    const isCorrect = answer === cell.product

    if (isCorrect) {
      sounds.playCorrect()
      const msg = getRandomMessage(CORRECT_ANSWER_MESSAGES)
      setFeedbackMessage(msg)
      setFeedbackCorrect(true)

      const newScore = score + 1
      setScore(newScore)

      // Mark cell as solved
      setCells(prev => prev.map((c, i) =>
        i === activePopup.cellIndex
          ? { ...c, isSolved: true, firstTryCorrect: true }
          : c
      ))

      setActivePopup(null)

      // Check if game is done
      const totalSolved = solvedCount + 1
      if (totalSolved >= HIDDEN_COUNT) {
        const t = setTimeout(() => {
          const finalFirstTry = cells.filter((c, i) =>
            c.isHidden && c.isSolved && c.firstTryCorrect
          ).length + 1 // +1 for the one we just solved

          const stars = finalFirstTry >= 5 ? 3 : finalFirstTry >= 3 ? 2 : 1
          setGameComplete(true)
          recordModeScore(tableNumber, 'chart', stars)

          // Show fun fact briefly, then celebration
          setShowFunFact(true)
          speak(TABLE_FUN_FACTS[tableNumber] || 'Great job!')

          const t2 = setTimeout(() => {
            showCelebration({
              type: 'level_complete',
              title: 'Chart Complete!',
              subtitle: `${finalFirstTry}/${HIDDEN_COUNT} first try - ${stars} star${stars !== 1 ? 's' : ''}!`,
              emoji: '📊',
              stars,
            })
          }, 3000)
          timeoutsRef.current.push(t2)
        }, 800)
        timeoutsRef.current.push(t)
      } else {
        // Clear feedback after a beat
        const t = setTimeout(() => setFeedbackMessage(null), 1200)
        timeoutsRef.current.push(t)
      }
    } else {
      sounds.playGentleError()
      const msg = getRandomMessage(WRONG_ANSWER_MESSAGES)
      setFeedbackMessage(msg)
      setFeedbackCorrect(false)

      // Mark as not first-try anymore (cell stays open for retry)
      setCells(prev => prev.map((c, i) =>
        i === activePopup.cellIndex
          ? { ...c, firstTryCorrect: false }
          : c
      ))

      // Clear feedback after a moment but keep popup open
      const t = setTimeout(() => setFeedbackMessage(null), 1500)
      timeoutsRef.current.push(t)
    }
  }, [isLocked, activePopup, cells, score, solvedCount, tableNumber,
      recordModeScore, showCelebration, triggerCooldown])

  const handlePlayAgain = useCallback(() => {
    setCells(generateCells(tableNumber))
    setActivePopup(null)
    setScore(0)
    setFeedbackMessage(null)
    setFeedbackCorrect(false)
    setGameComplete(false)
    setShowFunFact(false)
  }, [tableNumber])

  const handleDismissPopup = useCallback(() => {
    setActivePopup(null)
    setFeedbackMessage(null)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-300 via-purple-300 to-fuchsia-400 p-4 pb-24">
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Back button - fixed top-left */}
      <div className="fixed top-4 left-4 z-50">
        <Link href={`/multiplication/${tableNumber}`}>
          <motion.button
            className="px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 font-bold rounded-full shadow-lg min-h-[48px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center gap-1">
              <span>&#11013;&#65039;</span> Back
            </span>
          </motion.button>
        </Link>
      </div>

      {/* Header */}
      <motion.div
        className="text-center mb-4 pt-14"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">
          Times Table Chart
        </h1>
        <p className="text-white/80 text-sm">
          Fill in the missing answers! | Solved: {solvedCount}/{HIDDEN_COUNT}
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
            <span className={`text-base font-bold bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full ${
              feedbackCorrect ? 'text-green-100' : 'text-amber-100'
            }`}>
              {feedbackMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid header row */}
      <motion.div
        className="max-w-md mx-auto mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Table label */}
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <span className="text-lg font-extrabold text-white drop-shadow">
            {tableNumber} x
          </span>
          <div className="flex-1 h-0.5 bg-white/30 rounded-full" />
        </div>

        {/* Column headers (1-10) */}
        <div className="grid grid-cols-5 gap-1.5 mb-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <div
              key={`header-${n}`}
              className="text-center text-xs font-bold text-white/70"
            >
              x{n}
            </div>
          ))}
        </div>

        {/* Grid cells */}
        <div className="grid grid-cols-5 gap-1.5">
          {cells.map((cell, index) => {
            const isActive = activePopup?.cellIndex === index
            const showQuestion = cell.isHidden && !cell.isSolved
            const showSolved = cell.isHidden && cell.isSolved

            return (
              <motion.button
                key={`cell-${index}`}
                className={`relative rounded-xl py-3 text-center font-bold shadow-md min-h-[64px]
                           flex flex-col items-center justify-center border-2 transition-colors
                           ${showSolved
                             ? 'bg-green-200 border-green-400 text-green-700'
                             : showQuestion
                               ? isActive
                                 ? 'bg-yellow-200 border-yellow-400 text-yellow-700 ring-2 ring-yellow-400'
                                 : 'bg-white/60 border-dashed border-white/80 text-gray-500'
                               : `${colors.bg} ${colors.border} ${colors.text}`
                           }`}
                onClick={() => showQuestion ? handleCellTap(index) : undefined}
                whileTap={showQuestion ? { scale: 0.92 } : {}}
                animate={showQuestion && !isActive ? {
                  scale: [1, 1.03, 1],
                } : {}}
                transition={showQuestion && !isActive ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                } : {}}
                disabled={!showQuestion}
              >
                {/* Small label */}
                <span className="text-[10px] opacity-60 leading-none mb-0.5">
                  {tableNumber}x{cell.columnNumber}
                </span>

                {showQuestion ? (
                  <motion.span
                    className="text-2xl"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ?
                  </motion.span>
                ) : (
                  <motion.span
                    className="text-lg font-extrabold"
                    initial={showSolved ? { scale: 0 } : {}}
                    animate={showSolved ? { scale: 1 } : {}}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    {cell.product}
                  </motion.span>
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Answer choice popup */}
      <AnimatePresence>
        {activePopup && (
          <motion.div
            className="max-w-md mx-auto mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4">
              <p className="text-center text-white font-bold mb-3 text-lg">
                {tableNumber} x {cells[activePopup.cellIndex].columnNumber} = ?
              </p>
              <div className="grid grid-cols-3 gap-3">
                {activePopup.choices.map((choice, idx) => (
                  <motion.button
                    key={`choice-${idx}`}
                    className="rounded-2xl py-4 text-2xl font-bold shadow-lg min-h-[56px]
                               bg-white/90 border-3 border-white/50 text-gray-800
                               active:bg-gray-100"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleChoiceTap(choice)}
                  >
                    {choice}
                  </motion.button>
                ))}
              </div>
              <motion.button
                className="mt-3 w-full text-center text-white/60 text-sm py-2 min-h-[44px]"
                whileTap={{ scale: 0.95 }}
                onClick={handleDismissPopup}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fun fact (shown after completion) */}
      <AnimatePresence>
        {showFunFact && !celebration && (
          <motion.div
            className="max-w-sm mx-auto mt-6 bg-white/20 backdrop-blur-md rounded-2xl p-5 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <p className="text-3xl mb-2">💡</p>
            <p className="text-white font-bold text-base leading-relaxed">
              {TABLE_FUN_FACTS[tableNumber]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete screen */}
      {gameComplete && !celebration && !showFunFact && (
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-2xl font-extrabold text-white mb-4">
            {firstTryCount}/{HIDDEN_COUNT} first try!
          </p>
          <motion.button
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600
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
        {Array.from({ length: HIDDEN_COUNT }, (_, i) => (
          <motion.div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < solvedCount ? 'bg-white' : 'bg-white/30'
            }`}
            animate={i === solvedCount && !gameComplete ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  )
}
