'use client'

import { motion, AnimatePresence, useDragControls } from 'motion/react'
import { useState, useEffect } from 'react'
import type { StoryProblem } from '@/lib/math/storyProblems'
import { sounds } from '@/lib/sounds/webAudioSounds'

interface StoryProblemViewProps {
  problem: StoryProblem
  onAnswer: (answer: number) => void
  isSubmitted: boolean
  isCorrect: boolean
}

export function StoryProblemView({
  problem,
  onAnswer,
  isSubmitted,
  isCorrect
}: StoryProblemViewProps) {
  const [countedItems, setCountedItems] = useState<number[]>([])
  const [draggedAnswer, setDraggedAnswer] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [interactionMode] = useState<'tap' | 'drag' | 'choice'>(
    Math.random() > 0.5 ? 'drag' : Math.random() > 0.5 ? 'tap' : 'choice'
  )

  // Reset when problem changes
  useEffect(() => {
    setCountedItems([])
    setDraggedAnswer(null)
    setShowHint(false)
  }, [problem.id])

  // Handle item tap (for counting mode)
  const handleItemTap = (index: number) => {
    if (isSubmitted) return

    if (!countedItems.includes(index)) {
      sounds.playCount()
      setCountedItems([...countedItems, index])

      // Auto-submit when all items counted
      if (countedItems.length + 1 === problem.visualItems.length && problem.type === 'counting') {
        setTimeout(() => onAnswer(problem.answer), 500)
      }
    }
  }

  // Handle drag to answer zone
  const handleDragEnd = (answer: number, info: { point: { x: number; y: number } }) => {
    // Check if dropped in answer zone (bottom of screen)
    if (info.point.y > window.innerHeight - 200) {
      sounds.playSelect()
      onAnswer(answer)
    }
    setDraggedAnswer(null)
  }

  const renderVisualItems = () => {
    const { visualItems, type, num1, num2 } = problem

    if (type === 'addition') {
      // Show two groups that can combine
      return (
        <div className="flex flex-wrap justify-center gap-4 my-4">
          {/* First group */}
          <motion.div
            className="bg-blue-100 rounded-2xl p-4 flex flex-wrap gap-2 justify-center max-w-[150px]"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <p className="w-full text-center text-blue-600 font-bold text-sm mb-2">First: {num1}</p>
            {Array.from({ length: num1 }).map((_, i) => (
              <motion.span
                key={`g1-${i}`}
                className="text-3xl cursor-pointer"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleItemTap(i)}
              >
                {problem.emoji}
              </motion.span>
            ))}
          </motion.div>

          {/* Plus sign */}
          <motion.span
            className="text-4xl font-bold text-green-500 self-center"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            +
          </motion.span>

          {/* Second group */}
          <motion.div
            className="bg-green-100 rounded-2xl p-4 flex flex-wrap gap-2 justify-center max-w-[150px]"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <p className="w-full text-center text-green-600 font-bold text-sm mb-2">Then: {num2}</p>
            {Array.from({ length: num2 }).map((_, i) => (
              <motion.span
                key={`g2-${i}`}
                className="text-3xl cursor-pointer"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleItemTap(num1 + i)}
              >
                {problem.emoji}
              </motion.span>
            ))}
          </motion.div>
        </div>
      )
    }

    if (type === 'subtraction') {
      // Show items with some crossed out
      return (
        <div className="flex flex-wrap justify-center gap-2 my-4 max-w-md mx-auto bg-white/80 rounded-2xl p-4">
          {visualItems.map((item, i) => {
            const isRemoved = i >= problem.answer && isSubmitted && isCorrect
            const isCountedForRemoval = i >= problem.answer

            return (
              <motion.div
                key={i}
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <motion.span
                  className={`text-3xl ${isRemoved ? 'opacity-30' : ''}`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleItemTap(i)}
                  style={{ cursor: 'pointer' }}
                >
                  {item}
                </motion.span>
                {countedItems.includes(i) && (
                  <motion.span
                    className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    {countedItems.indexOf(i) + 1}
                  </motion.span>
                )}
                {isCountedForRemoval && isSubmitted && (
                  <motion.span
                    className="absolute inset-0 text-4xl text-red-500 flex items-center justify-center"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                  >
                    ✕
                  </motion.span>
                )}
              </motion.div>
            )
          })}
        </div>
      )
    }

    // Counting mode
    return (
      <div className="flex flex-wrap justify-center gap-3 my-4 max-w-md mx-auto bg-white/80 rounded-2xl p-4">
        {visualItems.map((item, i) => (
          <motion.div
            key={i}
            className="relative"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.05, type: 'spring' }}
          >
            <motion.span
              className="text-4xl cursor-pointer"
              whileHover={{ scale: 1.3, rotate: 10 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => handleItemTap(i)}
            >
              {item}
            </motion.span>
            {countedItems.includes(i) && (
              <motion.span
                className="absolute -top-2 -right-2 bg-purple-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                {countedItems.indexOf(i) + 1}
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    )
  }

  const renderAnswerOptions = () => {
    if (interactionMode === 'drag') {
      // Draggable answer options
      return (
        <div className="mt-6">
          <p className="text-center text-white font-medium mb-2">
            🎯 Drag the correct answer down!
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {problem.options.map((option, i) => (
              <motion.div
                key={`drag-${problem.id}-${option}`}
                className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center
                  text-2xl font-bold cursor-grab active:cursor-grabbing
                  ${isSubmitted && option === problem.answer
                    ? 'bg-green-400 text-white'
                    : 'bg-white shadow-lg'
                  }
                `}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 200 }}
                dragElastic={0.5}
                onDragStart={() => setDraggedAnswer(option)}
                onDragEnd={(e, info) => handleDragEnd(option, info)}
                whileDrag={{ scale: 1.2, zIndex: 50 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {option}
              </motion.div>
            ))}
          </div>
          {/* Drop zone */}
          <motion.div
            className={`mt-8 mx-auto w-32 h-20 border-4 border-dashed rounded-2xl
                        flex items-center justify-center text-xl font-bold
                        ${draggedAnswer ? 'border-yellow-400 bg-yellow-100' : 'border-white/50 bg-white/20'}`}
            animate={{ scale: draggedAnswer ? 1.1 : 1 }}
          >
            {draggedAnswer ? draggedAnswer : '?'}
          </motion.div>
        </div>
      )
    }

    // Choice mode (tap to select)
    return (
      <div className="grid grid-cols-2 gap-4 mt-6 max-w-sm mx-auto">
        {problem.options.map((option, i) => {
          const isSelected = isSubmitted && option === problem.answer

          return (
            <motion.button
              key={`choice-${problem.id}-${option}`}
              className={`
                p-5 text-3xl font-bold rounded-2xl shadow-lg
                transition-all duration-200
                ${isSubmitted && option === problem.answer
                  ? 'bg-green-400 text-white ring-4 ring-green-200'
                  : isSubmitted
                  ? 'bg-white/60'
                  : 'bg-white hover:bg-yellow-100 active:bg-yellow-200'
                }
              `}
              onClick={() => !isSubmitted && onAnswer(option)}
              disabled={isSubmitted}
              whileHover={!isSubmitted ? { scale: 1.05 } : {}}
              whileTap={!isSubmitted ? { scale: 0.95 } : {}}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                x: isSubmitted && !isCorrect && option !== problem.answer ? [0, -5, 5, -5, 5, 0] : 0
              }}
              transition={{ delay: i * 0.1 }}
            >
              {option}
            </motion.button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Story text */}
      <motion.div
        className="bg-white/95 rounded-3xl p-6 shadow-xl mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Story emoji */}
        <motion.span
          className="text-5xl block text-center mb-3"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {problem.emoji}
        </motion.span>

        {/* Story text */}
        <p className="text-lg text-gray-800 text-center leading-relaxed">
          {problem.story}
        </p>

        {/* Question */}
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-2xl font-bold text-purple-600">
            {problem.question}
          </p>
        </motion.div>
      </motion.div>

      {/* Visual items */}
      {renderVisualItems()}

      {/* Count display */}
      {countedItems.length > 0 && (
        <motion.div
          className="text-center my-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-2xl font-bold text-white bg-purple-500 px-4 py-2 rounded-full">
            Count: {countedItems.length}
          </span>
        </motion.div>
      )}

      {/* Answer options */}
      {renderAnswerOptions()}

      {/* Hint button */}
      {!isSubmitted && (
        <div className="mt-4 text-center">
          <motion.button
            className="text-white/80 underline text-sm"
            onClick={() => {
              setShowHint(!showHint)
              sounds.playThinking()
            }}
            whileHover={{ scale: 1.05 }}
          >
            {showHint ? 'Hide hint' : '💡 Need a hint?'}
          </motion.button>
          <AnimatePresence>
            {showHint && (
              <motion.p
                className="mt-2 text-white/90 bg-white/20 rounded-xl px-4 py-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {problem.hint}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
