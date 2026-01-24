'use client'

import { motion, AnimatePresence } from 'motion/react'

interface GameInstructionProps {
  gameType: string
  emoji: string
  onStart: () => void
  show: boolean
}

// Instructions for each game type - kid-friendly language!
const GAME_INSTRUCTIONS: Record<string, { title: string; instruction: string; demo: string }> = {
  bubblePop: {
    title: 'Pop the Bubble!',
    instruction: 'Tap the bubble with the right answer!',
    demo: '👆 🫧'
  },
  feedAnimal: {
    title: 'Feed the Animal!',
    instruction: 'Count the food and tap how many!',
    demo: '🔢 👆'
  },
  dragDrop: {
    title: 'Drag & Drop!',
    instruction: 'Drag items to the basket!',
    demo: '👆 ➡️ 🧺'
  },
  matching: {
    title: 'Match It!',
    instruction: 'Find cards that match!',
    demo: '🎴 = 🎴'
  },
  race: {
    title: 'Race Time!',
    instruction: 'Pick fast to win the race!',
    demo: '⚡ 🏆'
  },
  whackMole: {
    title: 'Whack-a-Mole!',
    instruction: 'Tap the mole with the right number!',
    demo: '👆 🐹'
  },
  balloonOrder: {
    title: 'Pop in Order!',
    instruction: 'Pop balloons smallest to biggest!',
    demo: '1 → 2 → 3'
  },
  fishing: {
    title: 'Go Fishing!',
    instruction: 'Catch the fish with the right number!',
    demo: '🎣 🐟'
  },
  rocketLaunch: {
    title: 'Launch the Rocket!',
    instruction: 'Pick right to blast off!',
    demo: '🚀 3 2 1'
  },
  treasureHunt: {
    title: 'Find the Treasure!',
    instruction: 'Dig up the chest with the answer!',
    demo: '⛏️ 📦'
  },
  puzzle: {
    title: 'Puzzle Time!',
    instruction: 'Find the missing piece!',
    demo: '🧩 ?'
  },
  bouncingBall: {
    title: 'Catch the Ball!',
    instruction: 'Catch the bouncing answer!',
    demo: '👆 🎾'
  },
  shuffle: {
    title: 'Find the Card!',
    instruction: 'Watch and tap the right cup!',
    demo: '👀 👆'
  },
  memoryFlip: {
    title: 'Memory Match!',
    instruction: 'Match the pictures! Count items = number',
    demo: '🍎🍎🍎 = 3'
  },
  // Cat World Games
  catTreats: {
    title: 'Feed the Kitty!',
    instruction: 'Count the treats and tap how many!',
    demo: '🐱 🐟🐟🐟'
  },
  yarnBall: {
    title: 'Yarn Ball Fun!',
    instruction: 'Pick the right yarn ball!',
    demo: '🐱 🧶'
  },
  catNap: {
    title: 'Sleepy Kitties!',
    instruction: 'Count the sleeping cats!',
    demo: '😴😴😴 = ?'
  },
  catTower: {
    title: 'Cat Tower!',
    instruction: 'How many cats to stack?',
    demo: '🐱🐱🐱'
  },
  kittyDance: {
    title: 'Kitty Dance Party!',
    instruction: 'Pick right to start the party!',
    demo: '🐱 💃'
  },
  // Space Galaxy Games
  asteroidBlast: {
    title: 'Asteroid Blast!',
    instruction: 'Blast the asteroid with the right answer!',
    demo: '🚀 💥 ☄️'
  },
  planetHop: {
    title: 'Planet Hop!',
    instruction: 'Hop to planets smallest to biggest!',
    demo: '👨‍🚀 🪐 🌍 🌙'
  },
  alienFeeding: {
    title: 'Feed the Alien!',
    instruction: 'Count the food and tap how many!',
    demo: '👽 🍕🍕🍕'
  },
  starCollector: {
    title: 'Star Collector!',
    instruction: 'Tap to collect the right number of stars!',
    demo: '⭐⭐⭐ = 3'
  },
  // Default/standard
  standard: {
    title: 'Math Time!',
    instruction: 'Pick the right answer!',
    demo: '👆 ✓'
  },
  // Enhanced Toca Boca-style drag games
  basketCounting: {
    title: 'Fill the Basket!',
    instruction: 'Drag items into the basket!',
    demo: '👆 ➡️ 🧺'
  },
  numberLineDrag: {
    title: 'Number Line!',
    instruction: 'Drag to the right number!',
    demo: '👆 ➡️ 🔢'
  },
  sortingDrag: {
    title: 'Sort Them!',
    instruction: 'Drag to put in order!',
    demo: '3️⃣ ➡️ 1️⃣2️⃣3️⃣'
  },
  matchDrag: {
    title: 'Match It!',
    instruction: 'Drag to the right answer!',
    demo: '👆 ➡️ ✅'
  }
}

// Game type icons (emojis for visual appeal)
const GAME_ICONS: Record<string, string> = {
  bubblePop: '🫧',
  feedAnimal: '🍎',
  dragDrop: '👆',
  matching: '🎴',
  race: '🏃',
  whackMole: '🔨',
  balloonOrder: '🎈',
  fishing: '🎣',
  rocketLaunch: '🚀',
  treasureHunt: '📦',
  puzzle: '🧩',
  bouncingBall: '🎾',
  shuffle: '🎯',
  memoryFlip: '🧠',
  catTreats: '🐱',
  yarnBall: '🧶',
  catNap: '😴',
  catTower: '🗼',
  kittyDance: '💃',
  // Space Galaxy Games
  asteroidBlast: '🚀',
  planetHop: '🪐',
  alienFeeding: '👽',
  starCollector: '⭐',
  standard: '⭐',
  // Enhanced Toca Boca-style drag games
  basketCounting: '🧺',
  numberLineDrag: '📏',
  sortingDrag: '🔢',
  matchDrag: '🎯'
}

export function GameInstruction({ gameType, emoji, onStart, show }: GameInstructionProps) {
  const info = GAME_INSTRUCTIONS[gameType] || GAME_INSTRUCTIONS.bubblePop

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
          >
            {/* Game icon with animation */}
            <motion.div
              className="text-7xl mb-4"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {emoji}
            </motion.div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {info.title}
            </h2>

            {/* Instruction */}
            <p className="text-xl text-gray-600 mb-4">
              {info.instruction}
            </p>

            {/* Visual demo with world emoji */}
            <div className="text-3xl mb-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl py-4 px-6 font-bold">
              {info.demo}
            </div>

            {/* Start button */}
            <motion.button
              className="w-full py-4 bg-gradient-to-r from-green-400 to-blue-500
                         text-white text-2xl font-bold rounded-2xl shadow-lg
                         hover:from-green-500 hover:to-blue-600 active:scale-95"
              onClick={onStart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(34, 197, 94, 0.4)',
                  '0 0 40px rgba(34, 197, 94, 0.6)',
                  '0 0 20px rgba(34, 197, 94, 0.4)'
                ]
              }}
              transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
            >
              Got it! Let's Go!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Quick instruction overlay (shows for 1-2 seconds during game transitions)
interface QuickInstructionProps {
  gameType: string
  show: boolean
}

export function QuickInstruction({ gameType, show }: QuickInstructionProps) {
  const info = GAME_INSTRUCTIONS[gameType] || GAME_INSTRUCTIONS.bubblePop

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-24 left-1/2 -translate-x-1/2 z-40"
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
        >
          <div className="bg-white/95 rounded-2xl px-6 py-3 shadow-xl border-2 border-yellow-400">
            <p className="text-lg font-bold text-gray-800">{info.title}</p>
            <p className="text-sm text-gray-600">{info.instruction}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
