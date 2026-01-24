'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'

// Themed object collections - MUCH more variety!
const THEMED_OBJECTS = {
  jungle: ['🦁', '🐯', '🦒', '🐘', '🦓', '🐵', '🦜', '🐍', '🦋', '🌴', '🥥', '🍌', '🌺', '🦎', '🐆'],
  ocean: ['🐙', '🦑', '🐠', '🐟', '🦈', '🐬', '🐳', '🦀', '🦐', '🐚', '🪸', '🦭', '🐡', '🦞', '🧜‍♀️'],
  space: ['🚀', '🛸', '👽', '🌟', '⭐', '🌙', '☄️', '🪐', '👨‍🚀', '🛰️', '🌍', '🔭', '💫', '✨', '🌌'],
  candy: ['🍭', '🍬', '🧁', '🍰', '🍪', '🍩', '🎂', '🍫', '🍡', '🧇', '🍦', '🍨', '🥧', '🍮', '🎀'],
  castle: ['🏰', '👸', '🤴', '🦄', '🐲', '⚔️', '👑', '🗡️', '🛡️', '🧙‍♂️', '🧚', '💎', '🔮', '🏆', '🌹'],
  dino: ['🦕', '🦖', '🥚', '🌋', '🦴', '🪨', '🌿', '🦎', '🐊', '🦩', '🐢', '🐸', '🦜', '🦤', '🪺']
}

// Animal helpers with personalities
const ANIMAL_HELPERS = [
  { emoji: '🦉', name: 'Professor Owl', messages: ['Hoo-hoo! Think carefully!', 'Great job!', 'You can do it!'] },
  { emoji: '🐰', name: 'Bunny', messages: ['Hop to it!', 'Amazing!', 'Keep trying!'] },
  { emoji: '🦊', name: 'Clever Fox', messages: ['Let me help!', 'Fantastic!', "You're so smart!"] },
  { emoji: '🐼', name: 'Panda', messages: ['Take your time!', 'Wonderful!', 'Almost there!'] },
  { emoji: '🦋', name: 'Butterfly', messages: ['Flutter flutter!', 'Beautiful work!', 'Try again!'] },
]

interface DragDropGameProps {
  type: 'counting' | 'addition' | 'subtraction'
  num1: number
  num2?: number
  answer: number
  worldId: string
  onCorrect: () => void
  onWrong: () => void
}

export function DragDropGame({
  type,
  num1,
  num2 = 0,
  answer,
  worldId,
  onCorrect,
  onWrong
}: DragDropGameProps) {
  // Get themed objects for this world
  const worldObjects = THEMED_OBJECTS[worldId as keyof typeof THEMED_OBJECTS] || THEMED_OBJECTS.jungle

  // Pick random unique objects for this problem
  const [usedObjects] = useState(() => {
    const shuffled = [...worldObjects].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3)
  })

  // Random animal helper
  const [helper] = useState(() => ANIMAL_HELPERS[Math.floor(Math.random() * ANIMAL_HELPERS.length)])

  // Game state
  const [countedItems, setCountedItems] = useState<number[]>([])
  const [draggedItems, setDraggedItems] = useState<string[]>([])
  const [dropZoneItems, setDropZoneItems] = useState<string[]>([])
  const [showHelper, setShowHelper] = useState(false)
  const [helperMessage, setHelperMessage] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  // Create draggable objects
  const [availableObjects] = useState(() => {
    const obj = usedObjects[0]
    return Array(num1 + (num2 || 0) + 3).fill(obj).map((o, i) => ({ id: `obj-${i}`, emoji: o }))
  })

  // Handle tapping to count
  const handleTapToCount = useCallback((index: number) => {
    if (countedItems.includes(index)) {
      // Uncount
      setCountedItems(prev => prev.filter(i => i !== index))
      sounds.playCount()
    } else {
      // Count this item
      setCountedItems(prev => [...prev, index])
      sounds.playCount()
      sounds.playBoing()
    }
  }, [countedItems])

  // Check if count is correct
  const checkCountAnswer = useCallback(() => {
    if (countedItems.length === answer) {
      setIsComplete(true)
      sounds.playCorrect()
      setHelperMessage(helper.messages[1])
      setShowHelper(true)
      setTimeout(() => {
        onCorrect()
      }, 1500)
    } else {
      sounds.playGentleError()
      setHelperMessage(helper.messages[2])
      setShowHelper(true)
      setTimeout(() => setShowHelper(false), 2000)
      onWrong()
    }
  }, [countedItems.length, answer, helper.messages, onCorrect, onWrong])

  // Handle drag start
  const handleDragStart = (itemId: string) => {
    sounds.playSelect()
    setDraggedItems(prev => [...prev, itemId])
  }

  // Handle drop
  const handleDrop = useCallback(() => {
    if (draggedItems.length > 0) {
      const lastDragged = draggedItems[draggedItems.length - 1]
      setDropZoneItems(prev => [...prev, lastDragged])
      sounds.playPop()
    }
  }, [draggedItems])

  // Check drag-drop answer
  const checkDragAnswer = useCallback(() => {
    if (dropZoneItems.length === answer) {
      setIsComplete(true)
      sounds.playCorrect()
      setHelperMessage(helper.messages[1])
      setShowHelper(true)
      setTimeout(() => onCorrect(), 1500)
    } else {
      sounds.playGentleError()
      setHelperMessage(`Try counting ${answer} objects!`)
      setShowHelper(true)
      setTimeout(() => setShowHelper(false), 2000)
    }
  }, [dropZoneItems.length, answer, helper.messages, onCorrect])

  // Render counting game (tap to count)
  if (type === 'counting') {
    return (
      <div className="relative">
        {/* Animal helper */}
        <AnimatePresence>
          {showHelper && (
            <motion.div
              className="absolute -top-16 left-1/2 transform -translate-x-1/2
                         bg-white rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2 z-10"
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <motion.span
                className="text-4xl"
                animate={{ rotate: [-10, 10, -10] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {helper.emoji}
              </motion.span>
              <span className="font-bold text-gray-700">{helperMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-2">
            Tap to Count! 👆
          </h2>
          <p className="text-lg text-white/90 drop-shadow">
            Tap exactly <span className="font-bold text-yellow-300 text-2xl">{answer}</span> objects
          </p>
        </motion.div>

        {/* Counting grid */}
        <motion.div
          className="bg-white/95 rounded-3xl p-6 shadow-2xl max-w-lg mx-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="grid grid-cols-5 gap-3 justify-items-center">
            {availableObjects.slice(0, num1 + 5).map((obj, i) => (
              <motion.button
                key={obj.id}
                className={`text-4xl p-2 rounded-xl transition-all ${
                  countedItems.includes(i)
                    ? 'bg-green-200 ring-4 ring-green-400 scale-110'
                    : 'bg-gray-50 hover:bg-yellow-100'
                }`}
                onClick={() => handleTapToCount(i)}
                disabled={isComplete}
                initial={{ scale: 0, rotate: -180 }}
                animate={{
                  scale: 1,
                  rotate: 0,
                  y: countedItems.includes(i) ? -5 : 0
                }}
                transition={{ delay: i * 0.05, type: 'spring' }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                {obj.emoji}
                {countedItems.includes(i) && (
                  <motion.span
                    className="absolute -top-2 -right-2 bg-green-500 text-white
                               text-sm w-6 h-6 rounded-full flex items-center justify-center font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    {countedItems.indexOf(i) + 1}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Counter display */}
          <motion.div
            className="mt-6 flex items-center justify-center gap-4"
            animate={{ scale: countedItems.length === answer ? [1, 1.1, 1] : 1 }}
          >
            <div className={`text-4xl font-bold px-6 py-3 rounded-2xl ${
              countedItems.length === answer
                ? 'bg-green-100 text-green-600'
                : 'bg-yellow-100 text-yellow-600'
            }`}>
              {countedItems.length} / {answer}
            </div>

            <motion.button
              className={`px-6 py-3 rounded-2xl font-bold text-xl shadow-lg ${
                countedItems.length === answer
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}
              onClick={checkCountAnswer}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Check! ✓
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Render addition/subtraction with drag and drop
  return (
    <div className="relative">
      {/* Animal helper */}
      <AnimatePresence>
        {showHelper && (
          <motion.div
            className="absolute -top-16 left-1/2 transform -translate-x-1/2
                       bg-white rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2 z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-4xl">{helper.emoji}</span>
            <span className="font-bold text-gray-700">{helperMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Problem display */}
      <motion.div
        className="text-center mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-2">
          {type === 'addition' ? 'Drag to Add! ➕' : 'Drag to Take Away! ➖'}
        </h2>
        <div className="flex items-center justify-center gap-3 text-4xl font-bold bg-white/90
                        rounded-2xl px-6 py-4 shadow-lg max-w-md mx-auto">
          <span className="bg-blue-100 px-4 py-2 rounded-xl">{num1}</span>
          <span className={type === 'addition' ? 'text-green-500' : 'text-red-500'}>
            {type === 'addition' ? '+' : '-'}
          </span>
          <span className={`px-4 py-2 rounded-xl ${type === 'addition' ? 'bg-green-100' : 'bg-red-100'}`}>
            {num2}
          </span>
          <span className="text-gray-400">=</span>
          <span className="bg-yellow-100 px-4 py-2 rounded-xl">?</span>
        </div>
      </motion.div>

      {/* Visual manipulatives */}
      <motion.div
        className="bg-white/95 rounded-3xl p-6 shadow-2xl max-w-2xl mx-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* First group */}
        <div className="mb-4">
          <p className="text-sm font-bold text-gray-500 mb-2">First Group ({num1})</p>
          <div className="flex flex-wrap gap-2 p-4 bg-blue-50 rounded-xl min-h-[60px]">
            {Array(num1).fill(usedObjects[0]).map((emoji, i) => (
              <motion.span
                key={`g1-${i}`}
                className="text-3xl cursor-grab active:cursor-grabbing"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.2, rotate: 10 }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                onDragEnd={() => {
                  sounds.playPop()
                }}
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Second group (for addition) or crossed out (for subtraction) */}
        {type === 'addition' ? (
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-500 mb-2">Second Group ({num2})</p>
            <div className="flex flex-wrap gap-2 p-4 bg-green-50 rounded-xl min-h-[60px]">
              {Array(num2).fill(usedObjects[1] || usedObjects[0]).map((emoji, i) => (
                <motion.span
                  key={`g2-${i}`}
                  className="text-3xl cursor-grab"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileHover={{ scale: 1.2, rotate: -10 }}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                >
                  {emoji}
                </motion.span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-500 mb-2">Take Away ({num2})</p>
            <div className="flex flex-wrap gap-2 p-4 bg-red-50 rounded-xl min-h-[60px] relative">
              {Array(num2).fill(usedObjects[0]).map((emoji, i) => (
                <motion.span
                  key={`take-${i}`}
                  className="text-3xl opacity-50"
                  initial={{ scale: 1 }}
                  animate={{ scale: 0.8, opacity: 0.3 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {emoji}
                  <span className="absolute text-red-500 text-2xl">✕</span>
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Answer hint */}
        <motion.div
          className="text-center p-4 bg-yellow-50 rounded-xl"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <p className="text-lg font-bold text-gray-700 mb-2">
            {type === 'addition'
              ? `Count all together: ${num1} + ${num2} = ?`
              : `What's left: ${num1} - ${num2} = ?`
            }
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {Array(answer).fill(usedObjects[0]).map((emoji, i) => (
              <motion.span
                key={`ans-${i}`}
                className="text-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                {emoji}
              </motion.span>
            ))}
          </div>
          <p className="text-3xl font-bold text-green-600 mt-2">= {answer}</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

// Interactive counting component with tappable objects
export function TapToCount({
  targetCount,
  objects,
  onComplete
}: {
  targetCount: number
  objects: string[]
  onComplete: (correct: boolean) => void
}) {
  const [tapped, setTapped] = useState<Set<number>>(new Set())

  const handleTap = (index: number) => {
    const newTapped = new Set(tapped)
    if (newTapped.has(index)) {
      newTapped.delete(index)
    } else {
      newTapped.add(index)
    }
    setTapped(newTapped)
    sounds.playCount()

    // Check if correct
    if (newTapped.size === targetCount) {
      sounds.playSuccessChime()
    }
  }

  return (
    <div className="text-center">
      <h3 className="text-xl font-bold text-white mb-4">
        Tap exactly {targetCount} objects!
      </h3>
      <div className="flex flex-wrap gap-3 justify-center p-4 bg-white/90 rounded-2xl">
        {objects.map((obj, i) => (
          <motion.button
            key={i}
            className={`text-4xl p-2 rounded-lg ${
              tapped.has(i) ? 'bg-green-200 ring-2 ring-green-500' : 'bg-gray-100'
            }`}
            onClick={() => handleTap(i)}
            whileTap={{ scale: 0.8 }}
            animate={tapped.has(i) ? { y: -5 } : { y: 0 }}
          >
            {obj}
          </motion.button>
        ))}
      </div>
      <div className="mt-4 text-2xl font-bold text-white">
        Count: {tapped.size} / {targetCount}
      </div>
      <motion.button
        className="mt-4 px-6 py-3 bg-yellow-400 rounded-full font-bold text-xl"
        onClick={() => onComplete(tapped.size === targetCount)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Check Answer ✓
      </motion.button>
    </div>
  )
}
