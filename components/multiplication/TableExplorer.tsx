'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { MULTIPLICATION_TABLES } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { sounds } from '@/lib/sounds/webAudioSounds'
import VisualMultiplication, { TABLE_EMOJIS } from './VisualMultiplication'

interface TableExplorerProps {
  tableNumber: number
}

// Background gradient per table
const TABLE_GRADIENTS: Record<number, string> = {
  1: 'from-yellow-200 via-amber-200 to-orange-200',
  2: 'from-pink-200 via-rose-200 to-red-200',
  3: 'from-green-200 via-emerald-200 to-teal-200',
  4: 'from-blue-200 via-sky-200 to-cyan-200',
  5: 'from-purple-200 via-violet-200 to-fuchsia-200',
  6: 'from-orange-200 via-amber-200 to-yellow-200',
  7: 'from-cyan-200 via-teal-200 to-emerald-200',
  8: 'from-indigo-200 via-blue-200 to-sky-200',
  9: 'from-fuchsia-200 via-pink-200 to-rose-200',
  10: 'from-amber-200 via-yellow-200 to-lime-200',
}

export default function TableExplorer({ tableNumber }: TableExplorerProps) {
  const markExplored = useMultiplicationStore(s => s.markExplored)
  const facts = MULTIPLICATION_TABLES[tableNumber] || []
  const emoji = TABLE_EMOJIS[tableNumber] || '⭐'
  const gradient = TABLE_GRADIENTS[tableNumber] || 'from-gray-200 to-gray-300'
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [viewedCount, setViewedCount] = useState(0)
  const [viewedCards, setViewedCards] = useState<Set<number>>(new Set())

  // Mark as explored on mount
  useEffect(() => {
    markExplored(tableNumber)
  }, [tableNumber, markExplored])

  const handleCardTap = (index: number) => {
    sounds.playPop()
    if (expandedCard === index) {
      setExpandedCard(null)
    } else {
      setExpandedCard(index)
      if (!viewedCards.has(index)) {
        const newViewed = new Set(viewedCards)
        newViewed.add(index)
        setViewedCards(newViewed)
        setViewedCount(newViewed.size)
      }
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${gradient} p-4 pb-24`}>
      {/* Header */}
      <motion.div
        className="text-center mb-6 pt-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <motion.span
          className="text-5xl block mb-2"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {emoji}
        </motion.span>
        <h1 className="text-3xl font-extrabold text-gray-800">
          The {tableNumber} Times Table
        </h1>
        <p className="text-gray-600 mt-1">Tap each card to see how it works!</p>
      </motion.div>

      {/* Fact cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
        {facts.map((fact, index) => {
          const isExpanded = expandedCard === index
          return (
            <motion.div
              key={`${fact.a}x${fact.b}`}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-2 border-white/60
                         cursor-pointer select-none overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.08,
                type: 'spring',
                damping: 15,
                stiffness: 200,
              }}
              whileTap={{ scale: 1.02 }}
              onClick={() => handleCardTap(index)}
              layout
            >
              {/* Equation */}
              <div className="text-center mb-2">
                <span className="text-2xl font-bold text-gray-800">
                  {fact.a} x {fact.b} = {fact.product}
                </span>
              </div>

              {/* Visual representation - compact when collapsed, full when expanded */}
              <AnimatePresence mode="wait">
                {isExpanded ? (
                  <motion.div
                    key="full"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VisualMultiplication
                      a={fact.a}
                      b={fact.b}
                      show={{ groups: true, additionBridge: true, answer: false }}
                      size="full"
                      animateIn={true}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="compact"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center"
                  >
                    <VisualMultiplication
                      a={fact.a}
                      b={fact.b}
                      show={{ groups: true, additionBridge: false, answer: false }}
                      size="compact"
                      animateIn={false}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Ready to play prompt - appears after viewing 3+ cards */}
      <AnimatePresence>
        {viewedCount >= 3 && (
          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Link href={`/multiplication/${tableNumber}/match`}>
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-indigo-400 to-purple-500
                           text-white font-bold text-lg rounded-full shadow-xl
                           border-4 border-white/30 min-h-[48px]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Ready to play? Try Match! 🎯
              </motion.button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button */}
      <motion.div
        className="fixed bottom-4 left-0 right-0 flex justify-center z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Link href={`/multiplication/${tableNumber}`}>
          <motion.button
            className="px-8 py-3 bg-gradient-to-r from-white/80 to-white/60
                       backdrop-blur-md text-gray-700 font-bold text-lg rounded-full
                       shadow-lg border-2 border-white/50 min-h-[48px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Table {tableNumber}
          </motion.button>
        </Link>
      </motion.div>
    </div>
  )
}
