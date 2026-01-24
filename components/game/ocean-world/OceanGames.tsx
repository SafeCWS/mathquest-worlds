'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'

interface OceanGameProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
  emoji?: string
}

// ============================================
// BUBBLE COUNT GAME - Count bubbles rising from the ocean floor!
// ============================================
export function BubbleCountGame({ question, correctAnswer, options, onCorrect, onWrong }: OceanGameProps) {
  const [popped, setPopped] = useState(false)
  const bubbles = Array(correctAnswer).fill(null)

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setPopped(true)
      setTimeout(onCorrect, 1000)
    } else {
      sounds.playGentleError()
      onWrong()
    }
  }

  return (
    <div className="bg-gradient-to-b from-cyan-300 via-blue-400 to-blue-700 rounded-3xl p-6 shadow-2xl min-h-[400px] relative overflow-hidden">
      {/* Underwater light rays */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-8 opacity-20 bg-gradient-to-b from-white to-transparent"
          style={{
            left: `${15 + i * 18}%`,
            top: 0,
            height: '100%',
            transform: `rotate(${-10 + i * 5}deg)`
          }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}

      {/* Instruction Banner */}
      <div className="text-center mb-4 relative z-10">
        <h3 className="text-2xl font-bold text-white drop-shadow-lg">
          {popped ? 'Splashing Fun!' : 'Count the Bubbles!'}
        </h3>
        {!popped && (
          <p className="text-lg text-cyan-100 font-bold">
            How many bubbles are rising?
          </p>
        )}
      </div>

      {/* Bubbles rising */}
      <div className="relative h-48 mb-6">
        {/* Ocean floor */}
        <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-amber-700 to-amber-600 rounded-full" />

        {/* Seaweed decorations */}
        <motion.span
          className="absolute bottom-6 left-4 text-4xl"
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🌿
        </motion.span>
        <motion.span
          className="absolute bottom-6 right-8 text-3xl"
          animate={{ rotate: [5, -5, 5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          🌿
        </motion.span>

        {/* Bubbles */}
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          {bubbles.map((_, i) => (
            <motion.div
              key={i}
              className="relative"
              initial={{ y: 100, opacity: 0 }}
              animate={popped
                ? { y: -200, opacity: 0, scale: 1.5 }
                : { y: [0, -15, 0], opacity: 1 }
              }
              transition={{
                delay: i * 0.1,
                duration: popped ? 0.5 : 2,
                repeat: popped ? 0 : Infinity
              }}
            >
              <motion.div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-white/80 to-cyan-200/60
                           border-2 border-white/40 flex items-center justify-center shadow-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              >
                <div className="w-3 h-3 rounded-full bg-white/80 absolute top-2 left-2" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {popped && (
          <motion.div
            className="text-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <span className="text-5xl">🌊</span>
            <p className="text-xl font-bold text-white">Bubble-icious!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer options */}
      {!popped && (
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {options.map((opt, i) => (
            <motion.button
              key={opt}
              className="bg-white/90 rounded-2xl p-4 text-3xl font-bold shadow-lg
                         hover:bg-cyan-50 active:bg-cyan-100 game-interactive"
              onClick={() => handleAnswer(opt)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {opt} 🫧
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// FISH SCHOOL GAME - Count fish in a school!
// ============================================
export function FishSchoolGame({ question, correctAnswer, options, onCorrect, onWrong }: OceanGameProps) {
  const [isHappy, setIsHappy] = useState(false)
  const fishEmojis = ['🐠', '🐟', '🐡']
  const fish = Array(correctAnswer).fill(null).map((_, i) => fishEmojis[i % fishEmojis.length])

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setIsHappy(true)
      setTimeout(onCorrect, 1200)
    } else {
      sounds.playGentleError()
      onWrong()
    }
  }

  return (
    <div className="bg-gradient-to-b from-teal-300 via-cyan-500 to-blue-600 rounded-3xl p-6 shadow-2xl min-h-[400px] relative overflow-hidden">
      {/* Coral decorations */}
      <motion.span
        className="absolute bottom-4 left-4 text-4xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🪸
      </motion.span>
      <motion.span
        className="absolute bottom-4 right-4 text-3xl"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        🪸
      </motion.span>

      {/* Title */}
      <div className="text-center mb-4 relative z-10">
        <motion.h3
          className="text-2xl font-bold text-white drop-shadow-lg"
          animate={isHappy ? { scale: [1, 1.1, 1] } : {}}
        >
          {isHappy ? 'You found them all!' : 'Count the Fish School!'}
        </motion.h3>
        {!isHappy && (
          <p className="text-lg text-cyan-100 font-bold mt-1">
            How many fish are swimming?
          </p>
        )}
      </div>

      {/* Fish swimming */}
      <div className="bg-blue-500/30 rounded-2xl p-4 mb-6 min-h-[140px] relative">
        <div className="flex flex-wrap justify-center gap-2">
          {fish.map((emoji, i) => (
            <motion.span
              key={i}
              className="text-5xl"
              initial={{ x: -100, opacity: 0 }}
              animate={isHappy
                ? { x: [0, 20, 0], y: [0, -10, 0], scale: [1, 1.2, 1] }
                : { x: [0, 10, 0], y: [0, -5, 0] }
              }
              transition={{
                delay: i * 0.1,
                duration: isHappy ? 0.5 : 2 + Math.random(),
                repeat: Infinity
              }}
              style={{ display: 'inline-block' }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        {/* Water ripples */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: [-100, 100] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {/* Success celebration */}
      <AnimatePresence>
        {isHappy && (
          <motion.div
            className="text-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <span className="text-4xl">🎣</span>
            <p className="text-xl font-bold text-white">Fin-tastic!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer buttons */}
      {!isHappy && (
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {options.map((opt, i) => (
            <motion.button
              key={opt}
              className="bg-white/90 rounded-2xl p-4 text-3xl font-bold shadow-lg
                         hover:bg-teal-50 game-interactive"
              onClick={() => handleAnswer(opt)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {opt} 🐟
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// TREASURE CHEST GAME - Open chests to find the right number of coins!
// ============================================
export function TreasureChestGame({ question, correctAnswer, options, onCorrect, onWrong }: OceanGameProps) {
  const [selectedChest, setSelectedChest] = useState<number | null>(null)
  const [openedChest, setOpenedChest] = useState<number | null>(null)
  const [showTreasure, setShowTreasure] = useState(false)

  const handleChestSelect = (answer: number) => {
    setSelectedChest(answer)
    setOpenedChest(answer)

    setTimeout(() => {
      if (answer === correctAnswer) {
        sounds.playCorrect()
        setShowTreasure(true)
        sounds.playCelebration()
        setTimeout(onCorrect, 1200)
      } else {
        sounds.playGentleError()
        setTimeout(() => {
          setSelectedChest(null)
          setOpenedChest(null)
        }, 800)
        onWrong()
      }
    }, 500)
  }

  const treasureIcons = ['🪙', '💰', '💎', '👑']

  return (
    <div className="bg-gradient-to-b from-blue-400 via-blue-600 to-indigo-800 rounded-3xl p-6 shadow-2xl min-h-[400px] relative overflow-hidden">
      {/* Sandy ocean floor */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-500 to-amber-400 rounded-b-3xl" />

      {/* Starfish decorations */}
      <motion.span
        className="absolute bottom-8 left-8 text-3xl"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        ⭐
      </motion.span>
      <motion.span
        className="absolute bottom-6 right-12 text-2xl"
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity }}
      >
        🐚
      </motion.span>

      {/* Instruction */}
      <div className="text-center mb-6 relative z-10">
        <h3 className="text-2xl font-bold text-white drop-shadow-lg">
          {showTreasure ? 'You found the treasure!' : 'Find the Treasure!'}
        </h3>
        <div className="bg-white/20 backdrop-blur rounded-xl p-3 mt-2 inline-block">
          <p className="text-xl font-bold text-yellow-200">{question}</p>
        </div>
        {!showTreasure && (
          <p className="text-lg text-cyan-100 font-bold mt-2">
            Pick the chest with the right answer!
          </p>
        )}
      </div>

      {/* Treasure chests */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-20 relative z-10">
        {options.map((opt, i) => (
          <motion.button
            key={opt}
            className={`relative p-4 rounded-2xl text-center game-interactive
                       ${openedChest === opt
                         ? opt === correctAnswer
                           ? 'bg-yellow-400/90'
                           : 'bg-red-400/90'
                         : 'bg-gradient-to-b from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700'
                       }`}
            onClick={() => !openedChest && handleChestSelect(opt)}
            disabled={openedChest !== null}
            whileHover={{ scale: openedChest ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            {/* Chest */}
            <motion.div
              className="text-5xl mb-2"
              animate={openedChest === opt && opt === correctAnswer
                ? { rotateX: [0, -20, 0], scale: [1, 1.2, 1] }
                : {}
              }
            >
              {openedChest === opt ? (opt === correctAnswer ? '📦' : '📦') : '🧰'}
            </motion.div>

            {/* Show coins if opened and correct */}
            {openedChest === opt && opt === correctAnswer && (
              <motion.div
                className="flex justify-center gap-1 mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                {Array(Math.min(correctAnswer, 5)).fill(null).map((_, j) => (
                  <motion.span
                    key={j}
                    className="text-2xl"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: j * 0.1 }}
                  >
                    {treasureIcons[j % treasureIcons.length]}
                  </motion.span>
                ))}
              </motion.div>
            )}

            <span className={`text-2xl font-bold ${openedChest === opt ? 'text-white' : 'text-yellow-200'}`}>
              {opt}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {showTreasure && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Floating coins */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-4xl"
                style={{ left: `${20 + (i * 10)}%`, top: '50%' }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -100, opacity: 0, rotate: 360 }}
                transition={{ duration: 1, delay: i * 0.1 }}
              >
                {treasureIcons[i % treasureIcons.length]}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// SEASHELL SORT GAME - Sort seashells by number (smallest to biggest)!
// ============================================
export function SeashellSortGame({ question, correctAnswer, options, onCorrect, onWrong }: OceanGameProps) {
  const [sortedShells, setSortedShells] = useState<number[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const sortedOptions = [...options].sort((a, b) => a - b)

  const shellEmojis = ['🐚', '🦪', '🐚', '🦪']
  const shellColors = ['bg-pink-200', 'bg-amber-200', 'bg-purple-200', 'bg-cyan-200']

  const handleShellTap = (value: number) => {
    // Check if this is the next expected value
    const expectedValue = sortedOptions[sortedShells.length]

    if (value === expectedValue && !sortedShells.includes(value)) {
      sounds.playPop()
      const newSorted = [...sortedShells, value]
      setSortedShells(newSorted)

      if (newSorted.length === sortedOptions.length) {
        sounds.playCorrect()
        sounds.playCelebration()
        setIsComplete(true)
        setTimeout(onCorrect, 1000)
      }
    } else if (!sortedShells.includes(value)) {
      sounds.playGentleError()
      onWrong()
    }
  }

  return (
    <div className="bg-gradient-to-b from-cyan-200 via-teal-400 to-blue-500 rounded-3xl p-6 shadow-2xl min-h-[400px] relative overflow-hidden">
      {/* Beach sand at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-yellow-300 to-yellow-200 rounded-b-3xl" />

      {/* Wave decoration */}
      <motion.div
        className="absolute bottom-16 left-0 right-0 h-4"
        animate={{ x: [-20, 20, -20] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full" />
      </motion.div>

      {/* Instruction */}
      <div className="text-center mb-4 relative z-10">
        <h3 className="text-2xl font-bold text-white drop-shadow-lg">
          {isComplete ? 'Perfectly Sorted!' : 'Sort the Seashells!'}
        </h3>
        {!isComplete && (
          <p className="text-lg text-cyan-100 font-bold">
            Tap from smallest to biggest!
          </p>
        )}
      </div>

      {/* Sorting area - where sorted shells go */}
      <div className="bg-white/30 backdrop-blur rounded-2xl p-4 mb-6 min-h-[80px] relative z-10">
        <p className="text-sm text-white font-bold mb-2 text-center">Sorted shells:</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {sortedShells.map((value, i) => (
            <motion.div
              key={`sorted-${value}`}
              className={`w-16 h-16 ${shellColors[i % shellColors.length]} rounded-2xl flex flex-col items-center justify-center shadow-lg`}
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <span className="text-2xl">{shellEmojis[i % shellEmojis.length]}</span>
              <span className="text-lg font-bold text-gray-700">{value}</span>
            </motion.div>
          ))}
          {sortedShells.length === 0 && (
            <p className="text-white/70 italic">Tap shells below in order...</p>
          )}
        </div>
      </div>

      {/* Unsorted shells on the beach */}
      <div className="relative z-10 mb-16">
        <p className="text-sm text-white font-bold mb-2 text-center">Shells on the beach:</p>
        <div className="flex justify-center gap-4 flex-wrap">
          {options.map((value, i) => {
            const isSorted = sortedShells.includes(value)
            return (
              <motion.button
                key={`shell-${value}`}
                className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-xl game-interactive
                           ${isSorted
                             ? 'bg-gray-300 opacity-50'
                             : `${shellColors[i % shellColors.length]} hover:scale-110`
                           }`}
                onClick={() => handleShellTap(value)}
                disabled={isSorted}
                animate={!isSorted
                  ? { y: [0, -5, 0], rotate: [-2, 2, -2] }
                  : {}
                }
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                whileHover={{ scale: isSorted ? 1 : 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-3xl">{shellEmojis[i % shellEmojis.length]}</span>
                <span className="text-xl font-bold text-gray-700">{value}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="text-center text-white font-bold relative z-10 mb-4">
        <p>Sorted: {sortedShells.length} / {options.length}</p>
      </div>

      {/* Celebration */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              className="text-center"
            >
              <span className="text-7xl block">🧜‍♀️</span>
              <p className="text-2xl font-bold text-white drop-shadow-lg mt-2">Shell-ebration!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
