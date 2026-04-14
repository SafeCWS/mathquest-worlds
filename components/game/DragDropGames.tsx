'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo, Reorder } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'

interface DragDropGameProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
  emoji: string
  worldId?: string
}

// ============================================
// BASKET COUNTING - Drag items into basket!
// ============================================
export function BasketCountingGame({ question, correctAnswer, options, onCorrect, onWrong, emoji }: DragDropGameProps) {
  const [itemsInBasket, setItemsInBasket] = useState<number[]>([])
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [showOverflow, setShowOverflow] = useState(false)
  const basketRef = useRef<HTMLDivElement>(null)

  // Generate draggable items (more than needed so kids can choose)
  const totalItems = Math.min(correctAnswer + 3, 10)
  const items = Array.from({ length: totalItems }, (_, i) => i)

  const handleDragEnd = (itemId: number, info: PanInfo) => {
    // Check if dropped in basket area
    if (basketRef.current) {
      const basketRect = basketRef.current.getBoundingClientRect()
      const dropX = info.point.x
      const dropY = info.point.y

      if (
        dropX >= basketRect.left &&
        dropX <= basketRect.right &&
        dropY >= basketRect.top &&
        dropY <= basketRect.bottom
      ) {
        // Dropped in basket!
        if (!itemsInBasket.includes(itemId)) {
          sounds.playPop()
          const newItems = [...itemsInBasket, itemId]
          if (newItems.length > correctAnswer) {
            // Too many items! Give gentle feedback
            sounds.playGentleError()
            setShowOverflow(true)
            setTimeout(() => setShowOverflow(false), 1500)
            return
          }
          setItemsInBasket(newItems)

          // Check if correct count reached
          if (newItems.length === correctAnswer) {
            sounds.playCorrect()
            sounds.playCelebration()
            setTimeout(onCorrect, 800)
          }
        }
      }
    }
    setDraggedItem(null)
  }

  const removeFromBasket = (itemId: number) => {
    sounds.playSelect()
    setItemsInBasket(prev => prev.filter(id => id !== itemId))
  }

  return (
    <div className="bg-gradient-to-b from-green-200 to-green-400 rounded-3xl p-6 min-h-[450px]">
      {/* Instruction */}
      <motion.div
        className="bg-white/95 rounded-2xl p-4 mb-4 text-center shadow-lg"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <p className="text-2xl font-bold">Drag {correctAnswer} {emoji} into the basket!</p>
        <p className="text-lg text-green-600 font-bold">Count: {itemsInBasket.length} / {correctAnswer}</p>
      </motion.div>

      {/* Draggable items area */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {items.map((itemId) => {
          const isInBasket = itemsInBasket.includes(itemId)
          if (isInBasket) return null

          return (
            <motion.div
              key={itemId}
              className="text-5xl cursor-grab active:cursor-grabbing select-none"
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={1}
              onDragStart={() => setDraggedItem(itemId)}
              onDragEnd={(_, info) => handleDragEnd(itemId, info)}
              whileDrag={{ scale: 1.2, zIndex: 100 }}
              whileHover={{ scale: 1.1 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
              transition={{ delay: itemId * 0.05 }}
              style={{ touchAction: 'none' }}
            >
              {emoji}
            </motion.div>
          )
        })}
      </div>

      {/* Basket drop zone */}
      <motion.div
        ref={basketRef}
        className={`mx-auto w-64 h-40 rounded-3xl border-4 border-dashed flex flex-wrap items-center justify-center gap-2 p-4 transition-all ${
          draggedItem !== null
            ? 'border-yellow-400 bg-yellow-100/50 scale-105'
            : 'border-amber-500 bg-amber-100/30'
        }`}
        animate={draggedItem !== null ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.5, repeat: draggedItem !== null ? Infinity : 0 }}
      >
        {itemsInBasket.length === 0 ? (
          <p className="text-gray-500 text-lg">Drop here!</p>
        ) : (
          itemsInBasket.map((itemId) => (
            <motion.span
              key={itemId}
              className="text-4xl cursor-pointer"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              whileHover={{ scale: 1.2 }}
              onClick={() => removeFromBasket(itemId)}
              title="Tap to remove"
            >
              {emoji}
            </motion.span>
          ))
        )}
      </motion.div>

      {/* Helper text */}
      <p className="text-center text-white mt-4 text-sm">
        Tap items in basket to remove them
      </p>

      {/* Overflow feedback */}
      <AnimatePresence>
        {showOverflow && (
          <motion.div
            className="text-center mt-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <p className="text-lg font-bold text-red-500">Oops! That&apos;s too many!</p>
            <p className="text-sm text-white">Tap items in basket to remove some</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// NUMBER LINE DRAG - Drag to the right spot!
// ============================================
export function NumberLineDragGame({ question, correctAnswer, options, onCorrect, onWrong, emoji }: DragDropGameProps) {
  const [position, setPosition] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  // Scale number line to fit the answer, capped at 20 for usable tick spacing
  const maxNumber = Math.min(20, Math.max(10, correctAnswer + 2, ...options))

  const handleTapNumber = (num: number) => {
    if (submitted) return
    setPosition(num)
    sounds.playSelect()
  }

  const handleSubmit = () => {
    if (position === null) return
    setSubmitted(true)
    if (position === correctAnswer) {
      sounds.playCorrect()
      sounds.playCelebration()
      setTimeout(onCorrect, 800)
    } else {
      sounds.playGentleError()
      setTimeout(() => {
        setSubmitted(false)
        setPosition(null)
        onWrong()
      }, 1000)
    }
  }

  return (
    <div className="bg-gradient-to-b from-blue-200 to-purple-300 rounded-3xl p-6">
      {/* Question */}
      <motion.div
        className="bg-white/95 rounded-2xl p-4 mb-6 text-center shadow-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <p className="text-2xl font-bold">{question}</p>
        <p className="text-lg text-purple-600 font-bold">Tap the {emoji} on the right number!</p>
      </motion.div>

      {/* Number line */}
      <div className="relative mx-auto max-w-[320px] h-32">
        {/* Line */}
        <div className="absolute top-1/2 left-4 right-4 h-2 bg-white rounded-full shadow-inner" />

        {/* Number markers - tappable! */}
        <div className="absolute top-1/2 left-4 right-4 flex justify-between">
          {Array.from({ length: maxNumber + 1 }, (_, i) => (
            <motion.button
              key={i}
              className={`flex flex-col items-center -translate-y-1/2 cursor-pointer rounded-lg px-1 py-0.5 transition-colors ${
                position === i
                  ? 'bg-yellow-300/80 scale-110'
                  : 'hover:bg-white/50'
              }`}
              onClick={() => handleTapNumber(i)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className={`w-1 h-4 rounded ${position === i ? 'bg-yellow-500' : 'bg-gray-400'}`} />
              <span className={`text-sm font-bold mt-1 ${position === i ? 'text-yellow-700 text-base' : ''}`}>{i}</span>
            </motion.button>
          ))}
        </div>

        {/* Animated marker on selected position */}
        {position !== null && (
          <motion.div
            className="absolute top-0 text-5xl pointer-events-none"
            style={{ left: `${(position / maxNumber) * 100}%` }}
            initial={{ scale: 0, y: -10 }}
            animate={{ scale: 1, y: 0, left: `${(position / maxNumber) * (100 - 8) + 4}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {emoji}
          </motion.div>
        )}
      </div>

      {/* Current position display */}
      <motion.div
        className="text-center mt-8 text-4xl font-bold"
        animate={position !== null ? { scale: [1, 1.1, 1] } : {}}
        key={position}
      >
        <span className={submitted ? (position === correctAnswer ? 'text-green-500' : 'text-red-500') : 'text-purple-700'}>
          {position !== null ? position : '?'}
        </span>
      </motion.div>

      {/* Submit button */}
      <motion.button
        className={`mx-auto mt-6 block px-8 py-3 text-white text-xl font-bold rounded-2xl shadow-lg ${
          position === null
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-400 to-blue-500'
        }`}
        onClick={handleSubmit}
        whileHover={position !== null ? { scale: 1.05 } : {}}
        whileTap={position !== null ? { scale: 0.95 } : {}}
        disabled={submitted || position === null}
      >
        {submitted
          ? (position === correctAnswer ? 'Correct!' : 'Try Again!')
          : (position === null ? 'Tap a Number!' : 'Check Answer!')
        }
      </motion.button>
    </div>
  )
}

// ============================================
// SORTING GAME - Drag numbers in order!
// ============================================
export function SortingDragGame({ question, correctAnswer, options, onCorrect, onWrong, emoji }: DragDropGameProps) {
  const [numbers, setNumbers] = useState(() => {
    const sorted = [...options].sort((a, b) => a - b)
    let nums: number[]
    // Fisher-Yates shuffle that guarantees items are NOT already in sorted order
    do {
      nums = [...options]
      for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]]
      }
    } while (nums.every((n, i) => n === sorted[i]) && nums.length > 1)
    return nums.map((n, i) => ({ id: i, value: n }))
  })
  const [isComplete, setIsComplete] = useState(false)

  const handleReorder = (newOrder: typeof numbers) => {
    setNumbers(newOrder)
    sounds.playPop()

    // Check if sorted correctly (smallest to biggest)
    const isSorted = newOrder.every((n, i) =>
      i === 0 || newOrder[i - 1].value <= n.value
    )

    if (isSorted) {
      setIsComplete(true)
      sounds.playCorrect()
      sounds.playCelebration()
      setTimeout(onCorrect, 1000)
    }
  }

  return (
    <div className="bg-gradient-to-b from-orange-200 to-pink-300 rounded-3xl p-6">
      {/* Instruction */}
      <motion.div
        className="bg-white/95 rounded-2xl p-4 mb-6 text-center shadow-lg"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
      >
        <p className="text-2xl font-bold">Put numbers in order!</p>
        <p className="text-lg text-orange-600 font-bold">Smallest to biggest!</p>
      </motion.div>

      {/* Visual hint showing the goal */}
      <motion.div
        className="bg-yellow-100 border-2 border-yellow-400 rounded-xl px-4 py-2 mb-4 mx-auto text-center max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-base font-bold text-yellow-800">Goal: </span>
        <span className="text-lg font-black text-purple-700">
          {[...options].sort((a, b) => a - b).join(' < ')}
        </span>
      </motion.div>

      {/* Sortable numbers using Reorder */}
      <Reorder.Group
        axis="x"
        values={numbers}
        onReorder={handleReorder}
        className="flex justify-center gap-4 flex-wrap"
      >
        {numbers.map((num, index) => (
          <Reorder.Item
            key={num.id}
            value={num}
            className={`bg-white rounded-2xl p-6 shadow-xl cursor-grab active:cursor-grabbing select-none ${
              isComplete ? 'bg-green-100' : ''
            }`}
            whileDrag={{ scale: 1.2, zIndex: 100, rotate: 5 }}
            style={{ touchAction: 'none' }}
            animate={isComplete ? { y: [0, -10, 0] } : {}}
            transition={isComplete ? { duration: 0.3, delay: index * 0.1 } : {}}
          >
            <span className="text-4xl font-bold">{num.value}</span>
            <div className="text-2xl mt-1">{emoji}</div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Progress indicator */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {isComplete ? (
          <motion.p
            className="text-2xl font-bold text-green-600"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
          >
            Perfect!
          </motion.p>
        ) : (
          <p className="text-white text-lg">Drag to reorder!</p>
        )}
      </motion.div>
    </div>
  )
}

// ============================================
// MATCH DRAG GAME - Drag to matching target!
// ============================================
export function MatchDragGame({ question, correctAnswer, options, onCorrect, onWrong, emoji }: DragDropGameProps) {
  const [matched, setMatched] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const targetRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const handleDragEnd = (info: PanInfo) => {
    setIsDragging(false)

    // Check which target we're over
    for (const [value, ref] of targetRefs.current.entries()) {
      if (ref) {
        const rect = ref.getBoundingClientRect()
        if (
          info.point.x >= rect.left &&
          info.point.x <= rect.right &&
          info.point.y >= rect.top &&
          info.point.y <= rect.bottom
        ) {
          setMatched(value)
          if (value === correctAnswer) {
            sounds.playCorrect()
            sounds.playCelebration()
            setTimeout(onCorrect, 800)
          } else {
            sounds.playGentleError()
            setTimeout(() => {
              setMatched(null)
              onWrong()
            }, 1000)
          }
          return
        }
      }
    }
  }

  const setTargetRef = useCallback((value: number, el: HTMLDivElement | null) => {
    if (el) {
      targetRefs.current.set(value, el)
    } else {
      targetRefs.current.delete(value)
    }
  }, [])

  return (
    <div className="bg-gradient-to-b from-teal-200 to-cyan-400 rounded-3xl p-6">
      {/* Question with draggable emoji */}
      <motion.div
        className="bg-white/95 rounded-2xl p-4 mb-6 text-center shadow-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <p className="text-xl font-bold mb-2">{question}</p>
        <p className="text-lg text-teal-600">Drag the {emoji} to the answer!</p>
      </motion.div>

      {/* Visual representation of the problem */}
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {Array(Math.min(correctAnswer, 10)).fill(0).map((_, i) => (
          <motion.span
            key={i}
            className="text-4xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      {/* Draggable source */}
      <div className="flex justify-center mb-8">
        <motion.div
          className={`text-6xl cursor-grab active:cursor-grabbing select-none ${matched !== null ? 'opacity-50' : ''}`}
          drag={matched === null}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={1}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(_, info) => handleDragEnd(info)}
          whileDrag={{ scale: 1.3, zIndex: 100 }}
          whileHover={matched === null ? { scale: 1.1 } : {}}
          style={{ touchAction: 'none' }}
          animate={isDragging ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.3, repeat: isDragging ? Infinity : 0 }}
        >
          {emoji}
        </motion.div>
      </div>

      {/* Hint text when dragging */}
      <AnimatePresence>
        {isDragging && (
          <motion.p
            className="text-center text-white text-lg mb-4 font-bold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Drop on the right number!
          </motion.p>
        )}
      </AnimatePresence>

      {/* Target zones */}
      <div className="flex justify-center gap-4 flex-wrap">
        {options.map((opt) => (
          <motion.div
            key={opt}
            ref={(el) => setTargetRef(opt, el)}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg transition-all ${
              matched === opt
                ? opt === correctAnswer
                  ? 'bg-green-400 text-white scale-110'
                  : 'bg-red-400 text-white'
                : isDragging
                  ? 'bg-yellow-100 border-4 border-yellow-400 scale-105'
                  : 'bg-white hover:bg-teal-50'
            }`}
            whileHover={matched === null ? { scale: 1.1 } : {}}
            animate={isDragging && matched === null ? { y: [0, -5, 0] } : {}}
            transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0, delay: opt * 0.1 }}
          >
            {opt}
          </motion.div>
        ))}
      </div>

      {/* Success/fail indicator */}
      <AnimatePresence>
        {matched !== null && (
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            {matched === correctAnswer ? (
              <p className="text-3xl font-bold text-green-600">Correct!</p>
            ) : (
              <p className="text-2xl font-bold text-red-600">Try again!</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
