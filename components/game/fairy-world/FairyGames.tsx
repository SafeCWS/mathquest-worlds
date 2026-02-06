'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { EncouragingMessage, CelebrationConfetti, getEncouragingMessage } from '../GameFeedback'

interface FairyGameProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
  emoji?: string
}

// ============================================
// UNICORN COUNT GAME - Count unicorns in the meadow!
// ============================================
export function UnicornCountGame({ question, correctAnswer, options, onCorrect, onWrong }: FairyGameProps) {
  const [isHappy, setIsHappy] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)
  const unicorns = Array(correctAnswer).fill('🦄')

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setIsHappy(true)
      setShowCelebration(true)
      setTimeout(() => {
        setShowCelebration(false)
        onCorrect()
      }, 1000)
    } else {
      sounds.playGentleError()
      setEncourageMsg(getEncouragingMessage())
      setShowEncouragement(true)
      setTimeout(() => {
        setShowEncouragement(false)
      }, 1200)
      onWrong()
    }
  }

  return (
    <div className="bg-gradient-to-b from-purple-100 to-pink-200 rounded-3xl p-6 shadow-2xl">
      {/* Magical meadow header */}
      <div className="text-center mb-6">
        <motion.div
          className="text-8xl mb-2"
          animate={isHappy
            ? { scale: [1, 1.2, 1], rotate: [-5, 5, -5, 0] }
            : { y: [0, -8, 0] }
          }
          transition={{ duration: isHappy ? 0.5 : 2, repeat: isHappy ? 0 : Infinity }}
        >
          {isHappy ? '🦄' : '🦄'}
        </motion.div>

        {!isHappy && (
          <motion.div
            className="inline-block bg-white rounded-2xl px-4 py-2 shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-lg font-bold text-purple-600">Unicorns are prancing!</span>
          </motion.div>
        )}

        {isHappy && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-purple-600"
          >
            Magical! ✨
          </motion.div>
        )}
      </div>

      {/* INSTRUCTION BANNER - Unicorns to count */}
      <div className="bg-white/80 rounded-2xl p-4 mb-6">
        <p className="text-2xl font-bold text-center text-purple-700 mb-2">{question}</p>
        <p className="text-base text-center text-pink-500">
          Count the unicorns! 🦄
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {unicorns.map((unicorn, i) => (
            <motion.span
              key={i}
              className="text-4xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: 1,
                rotate: 0,
                y: isHappy ? [0, -10, 0] : 0
              }}
              transition={{
                delay: i * 0.1,
                type: 'spring',
                y: { duration: 0.5, repeat: isHappy ? Infinity : 0, delay: i * 0.1 }
              }}
            >
              {unicorn}
              {isHappy && (
                <motion.span
                  className="absolute text-sm"
                  animate={{ opacity: [0, 1, 0], y: [-5, -15] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  ✨
                </motion.span>
              )}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt, i) => (
          <motion.button
            key={opt}
            className="bg-white rounded-2xl p-4 text-3xl font-bold shadow-lg
                       hover:bg-purple-50 active:bg-purple-100 game-interactive"
            onClick={() => handleAnswer(opt)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {opt} 🦄
          </motion.button>
        ))}
      </div>
      <CelebrationConfetti show={showCelebration} emoji={['✨', '🦄', '💎', '🦋', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// FAIRY DUST GAME - Collect magic fairy dust!
// ============================================
export function FairyDustGame({ question, correctAnswer, options, onCorrect, onWrong }: FairyGameProps) {
  const [selectedDust, setSelectedDust] = useState<number | null>(null)
  const [isCollecting, setIsCollecting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)

  const dustColors = ['bg-pink-300', 'bg-purple-300', 'bg-yellow-300', 'bg-blue-300', 'bg-rose-300', 'bg-indigo-300']

  const handleDustSelect = (answer: number) => {
    setSelectedDust(answer)
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setIsCollecting(true)
      setShowCelebration(true)
      setTimeout(() => {
        setShowCelebration(false)
        onCorrect()
      }, 1200)
    } else {
      sounds.playGentleError()
      setEncourageMsg(getEncouragingMessage())
      setShowEncouragement(true)
      setTimeout(() => {
        setSelectedDust(null)
        setShowEncouragement(false)
      }, 1200)
      onWrong()
    }
  }

  return (
    <div className="bg-gradient-to-b from-pink-100 to-purple-200 rounded-3xl p-6 shadow-2xl">
      {/* Fairy with wand */}
      <div className="text-center mb-6">
        <motion.div
          className="text-8xl"
          animate={isCollecting
            ? { rotate: [-20, 20, -20], scale: [1, 1.1, 1] }
            : { rotate: [0, 5, -5, 0] }
          }
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {isCollecting ? '🧚' : '🧚‍♀️'}
        </motion.div>

        <p className="text-xl font-bold text-pink-700 mt-2">
          {isCollecting ? 'Magical sparkles! ✨' : 'Catch the fairy dust! ✨'}
        </p>
      </div>

      {/* Floating sparkles */}
      <div className="relative h-20 mb-4 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl"
            style={{ left: `${10 + i * 12}%` }}
            animate={{
              y: [0, 60, 0],
              opacity: [1, 0.5, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2
            }}
          >
            ✨
          </motion.span>
        ))}
      </div>

      {/* Question */}
      <div className="bg-white/90 rounded-2xl p-4 mb-6 text-center">
        <p className="text-2xl font-bold text-purple-800">{question}</p>
      </div>

      {/* Fairy dust options */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt, i) => (
          <motion.button
            key={opt}
            className={`relative rounded-2xl p-6 text-center shadow-lg game-interactive
                       ${selectedDust === opt
                         ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white'
                         : 'bg-white hover:bg-pink-50'}`}
            onClick={() => handleDustSelect(opt)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <motion.div
              className={`text-5xl mb-2 rounded-full w-16 h-16 mx-auto flex items-center justify-center ${dustColors[i % dustColors.length]}`}
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            >
              <span className="text-3xl">✨</span>
            </motion.div>
            <span className="text-2xl font-bold">{opt}</span>
          </motion.button>
        ))}
      </div>
      <CelebrationConfetti show={showCelebration} emoji={['✨', '🦄', '💎', '🦋', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// CRYSTAL MATCH GAME - Match crystals with numbers!
// ============================================
export function CrystalMatchGame({ question, correctAnswer, options, onCorrect, onWrong }: FairyGameProps) {
  const [isGlowing, setIsGlowing] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)
  const crystals = Array(correctAnswer).fill('💎')

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setIsGlowing(true)
      setShowCelebration(true)
      setTimeout(() => {
        setShowCelebration(false)
        onCorrect()
      }, 1200)
    } else {
      sounds.playGentleError()
      setEncourageMsg(getEncouragingMessage())
      setShowEncouragement(true)
      setTimeout(() => {
        setShowEncouragement(false)
      }, 1200)
      onWrong()
    }
  }

  return (
    <div className="bg-gradient-to-b from-blue-100 to-purple-200 rounded-3xl p-6 shadow-2xl">
      {/* INSTRUCTION BANNER */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-purple-700 mb-1">{question}</h3>
        <p className="text-lg text-blue-500">
          {isGlowing ? 'The crystals glow bright! ✨' : 'Count the magic crystals! 💎'}
        </p>
      </div>

      {/* Crystal display */}
      <div className="bg-white/60 rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap justify-center gap-3">
          {crystals.map((_, i) => (
            <motion.div
              key={i}
              className="relative"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.15 }}
            >
              <motion.span
                className="text-5xl block"
                animate={isGlowing
                  ? {
                      scale: [1, 1.3, 1],
                      filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
                    }
                  : { rotate: [0, 5, -5, 0] }
                }
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              >
                💎
              </motion.span>

              {/* Sparkle effect when glowing */}
              {isGlowing && (
                <motion.span
                  className="absolute -top-2 -right-2 text-lg"
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                >
                  ✨
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Answer options */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt, i) => (
          <motion.button
            key={opt}
            className="bg-white rounded-2xl p-4 text-3xl font-bold shadow-lg
                       hover:bg-blue-50 game-interactive"
            onClick={() => handleAnswer(opt)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            {opt} 💎
          </motion.button>
        ))}
      </div>
      <CelebrationConfetti show={showCelebration} emoji={['✨', '🦄', '💎', '🦋', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// MAGIC WAND GAME - Wave the wand for the right answer!
// ============================================
export function MagicWandGame({ question, correctAnswer, options, onCorrect, onWrong }: FairyGameProps) {
  const [isWaving, setIsWaving] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)

  const handleAnswer = (answer: number) => {
    setSelectedAnswer(answer)
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setIsWaving(true)
      setShowFireworks(true)
      setShowCelebration(true)
      sounds.playCelebration()
      setTimeout(() => {
        setShowCelebration(false)
        onCorrect()
      }, 1500)
    } else {
      sounds.playGentleError()
      setEncourageMsg(getEncouragingMessage())
      setShowEncouragement(true)
      setTimeout(() => {
        setSelectedAnswer(null)
        setShowEncouragement(false)
      }, 1200)
      onWrong()
    }
  }

  return (
    <div className="bg-gradient-to-b from-yellow-100 to-pink-200 rounded-3xl p-6 shadow-2xl min-h-[400px] relative overflow-hidden">
      {/* INSTRUCTION BANNER */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-pink-700">
          {showFireworks ? 'Amazing magic! 🎆' : 'Wave the magic wand! 🪄'}
        </h3>
        <p className="text-lg text-yellow-700">{question}</p>
        {!showFireworks && (
          <p className="text-base text-pink-600 font-bold mt-1">
            Pick right to see the magic!
          </p>
        )}
      </div>

      {/* Magic Wand Display */}
      <div className="flex justify-center mb-6">
        <motion.div
          className="text-8xl"
          animate={isWaving
            ? { rotate: [-30, 30, -30], x: [-10, 10, -10] }
            : { rotate: [0, 10, -10, 0] }
          }
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          🪄
        </motion.div>
      </div>

      {/* Sparkle trail */}
      <div className="flex justify-center gap-2 mb-4">
        {[...Array(5)].map((_, i) => (
          <motion.span
            key={i}
            className="text-2xl"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
              y: [0, -10, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          >
            ✨
          </motion.span>
        ))}
      </div>

      {/* Fireworks when correct */}
      <AnimatePresence>
        {showFireworks && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl"
                style={{
                  left: `${10 + (i % 4) * 25}%`,
                  top: `${10 + Math.floor(i / 4) * 30}%`
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.1
                }}
              >
                {['🎆', '🎇', '✨', '⭐'][i % 4]}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Success message */}
      <AnimatePresence>
        {showFireworks && (
          <motion.div
            className="text-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <span className="text-5xl">🎉</span>
            <p className="text-xl font-bold text-pink-600">Pure magic!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer options */}
      {!showFireworks && (
        <div className="grid grid-cols-2 gap-4">
          {options.map((opt, i) => (
            <motion.button
              key={opt}
              className={`bg-white rounded-2xl p-4 text-3xl font-bold shadow-lg game-interactive
                         ${selectedAnswer === opt ? 'ring-4 ring-pink-400' : 'hover:bg-yellow-50'}`}
              onClick={() => handleAnswer(opt)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              {opt} 🪄
            </motion.button>
          ))}
        </div>
      )}
      <CelebrationConfetti show={showCelebration} emoji={['✨', '🦄', '💎', '🦋', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// ENCHANTED GARDEN GAME - Count flowers in the magical garden!
// ============================================
export function EnchantedGardenGame({ question, correctAnswer, options, onCorrect, onWrong }: FairyGameProps) {
  const [showButterfly, setShowButterfly] = useState(false)
  const [showQuestion, setShowQuestion] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)

  const flowerEmojis = ['🌸', '🌺', '🌷', '🌻', '🌼']
  const flowers = Array(correctAnswer).fill(null).map((_, i) => flowerEmojis[i % flowerEmojis.length])

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setShowButterfly(true)
      setShowCelebration(true)
      sounds.playCelebration()
      setTimeout(() => {
        setShowCelebration(false)
        onCorrect()
      }, 2000)
    } else {
      sounds.playGentleError()
      setEncourageMsg(getEncouragingMessage())
      setShowEncouragement(true)
      setTimeout(() => {
        setShowEncouragement(false)
      }, 1200)
      onWrong()
    }
  }

  return (
    <div className="bg-gradient-to-b from-green-100 to-pink-200 rounded-3xl p-6 shadow-2xl min-h-[400px]">
      {/* Title */}
      <div className="text-center mb-4">
        <motion.h3
          className="text-2xl font-bold text-green-700"
          animate={showButterfly ? { scale: [1, 1.1, 1], color: ['#15803D', '#DB2777', '#15803D'] } : {}}
          transition={{ duration: 0.5, repeat: showButterfly ? Infinity : 0 }}
        >
          {showButterfly ? 'Beautiful garden! 🦋' : 'The Enchanted Garden 🌸'}
        </motion.h3>
      </div>

      {/* Garden display */}
      <div className="bg-white/60 rounded-2xl p-4 mb-6 relative">
        <div className="flex flex-wrap justify-center gap-3">
          {flowers.map((flower, i) => (
            <motion.div
              key={i}
              className="text-5xl"
              animate={showButterfly
                ? {
                    y: [0, -10, 0],
                    rotate: [-5, 5, -5],
                    scale: [1, 1.1, 1]
                  }
                : { y: [0, -3, 0] }
              }
              transition={{
                duration: showButterfly ? 0.8 : 2,
                repeat: Infinity,
                delay: i * 0.1
              }}
            >
              {flower}
            </motion.div>
          ))}
        </div>

        {/* Butterfly appears when correct */}
        {showButterfly && (
          <motion.div
            className="absolute text-5xl"
            initial={{ x: -50, y: 50, opacity: 0 }}
            animate={{
              x: [0, 100, 200, 150, 50, 0],
              y: [0, -30, 0, 20, -20, 0],
              opacity: 1
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🦋
          </motion.div>
        )}
      </div>

      {/* Question and answers */}
      {showQuestion && !showButterfly && (
        <>
          <div className="bg-white/90 rounded-2xl p-4 mb-6 text-center">
            <p className="text-2xl font-bold text-green-800">{question}</p>
            <p className="text-lg text-pink-500">
              Count the flowers in the garden! 🌸
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {options.map((opt, i) => (
              <motion.button
                key={opt}
                className="bg-white rounded-2xl p-4 text-3xl font-bold shadow-lg
                           hover:bg-green-50 game-interactive"
                onClick={() => handleAnswer(opt)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                {opt} 🌸
              </motion.button>
            ))}
          </div>
        </>
      )}

      {/* Success message when butterfly appears */}
      {showButterfly && (
        <motion.div
          className="text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <p className="text-2xl font-bold text-pink-600 mb-2">
            A butterfly came to visit!
          </p>
          <div className="flex justify-center gap-2">
            {['🌸', '🦋', '🌺', '✨', '🌷'].map((emoji, i) => (
              <motion.span
                key={i}
                className="text-3xl"
                animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
      <CelebrationConfetti show={showCelebration} emoji={['✨', '🦄', '💎', '🦋', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}
