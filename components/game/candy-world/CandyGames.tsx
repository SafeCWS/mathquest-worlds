'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { EncouragingMessage, CelebrationConfetti, getEncouragingMessage } from '../GameFeedback'

interface CandyGameProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
  emoji?: string
}

// ============================================
// LOLLIPOP COUNT GAME - Count colorful lollipops!
// ============================================
export function LollipopCountGame({ question, correctAnswer, options, onCorrect, onWrong }: CandyGameProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)
  const lollipops = Array(correctAnswer).fill('🍭')

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setIsSpinning(true)
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
    <div className="bg-gradient-to-b from-pink-100 to-red-200 rounded-3xl p-6 shadow-2xl">
      {/* Happy candy mascot */}
      <div className="text-center mb-6">
        <motion.div
          className="text-8xl mb-2"
          animate={isSpinning
            ? { rotate: [0, 360], scale: [1, 1.2, 1] }
            : { y: [0, -5, 0] }
          }
          transition={{ duration: isSpinning ? 0.5 : 2, repeat: isSpinning ? 0 : Infinity }}
        >
          {isSpinning ? '🎉' : '🍭'}
        </motion.div>

        {!isSpinning && (
          <motion.div
            className="inline-block bg-white rounded-2xl px-4 py-2 shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-lg font-bold text-pink-600">Count my lollipop friends!</span>
          </motion.div>
        )}

        {isSpinning && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-pink-600"
          >
            Sweet! You got it! 🍬
          </motion.div>
        )}
      </div>

      {/* INSTRUCTION BANNER - Lollipops to count */}
      <div className="bg-white/80 rounded-2xl p-4 mb-6">
        <p className="text-2xl font-bold text-center text-pink-700 mb-2">{question}</p>
        <p className="text-base text-center text-pink-500">
          Count the lollipops! 🍭
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {lollipops.map((lollipop, i) => (
            <motion.span
              key={i}
              className="text-4xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={isSpinning
                ? { scale: 1, rotate: 360 }
                : { scale: 1, rotate: 0 }
              }
              transition={{ delay: i * 0.1, type: 'spring' }}
            >
              {lollipop}
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
                       hover:bg-pink-50 active:bg-pink-100 game-interactive"
            onClick={() => handleAnswer(opt)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {opt} 🍭
          </motion.button>
        ))}
      </div>
      <CelebrationConfetti show={showCelebration} emoji={['🍭', '🧁', '🍬', '🍫', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// CUPCAKE DECORATION GAME - Decorate with the right count!
// ============================================
export function CupcakeDecorationGame({ question, correctAnswer, options, onCorrect, onWrong }: CandyGameProps) {
  const [showSprinkles, setShowSprinkles] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)
  const cupcakes = Array(correctAnswer).fill('🧁')

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setShowSprinkles(true)
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

  const sprinkleColors = ['bg-pink-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400']

  return (
    <div className="bg-gradient-to-b from-pink-100 to-yellow-200 rounded-3xl p-6 shadow-2xl">
      {/* Header with cupcake */}
      <div className="text-center mb-6">
        <motion.div
          className="text-8xl"
          animate={showSprinkles
            ? { scale: [1, 1.3, 1], rotate: [-5, 5, -5, 0] }
            : { y: [0, -5, 0] }
          }
          transition={{ duration: showSprinkles ? 0.5 : 2, repeat: showSprinkles ? 0 : Infinity }}
        >
          🧁
        </motion.div>

        <p className="text-xl font-bold text-pink-700 mt-2">
          {showSprinkles ? 'Yummy! Perfect cupcakes! 🎉' : '👆 Count the cupcakes to decorate! 🧁'}
        </p>
      </div>

      {/* Sprinkles animation when correct */}
      {showSprinkles && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-4 rounded-full ${sprinkleColors[i % sprinkleColors.length]}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
              }}
              animate={{
                y: [0, 400],
                rotate: [0, 360],
                opacity: [1, 0]
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.05,
              }}
            />
          ))}
        </div>
      )}

      {/* Cupcakes to count */}
      <div className="bg-white/90 rounded-2xl p-4 mb-6">
        <p className="text-2xl font-bold text-center text-yellow-700 mb-2">{question}</p>
        <p className="text-base text-center text-yellow-500">
          Count the cupcakes! 🧁
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {cupcakes.map((cupcake, i) => (
            <motion.span
              key={i}
              className="text-4xl"
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
            >
              {cupcake}
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
                       hover:bg-yellow-50 game-interactive"
            onClick={() => handleAnswer(opt)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            {opt} 🧁
          </motion.button>
        ))}
      </div>
      <CelebrationConfetti show={showCelebration} emoji={['🧁', '🍭', '🍬', '🎂', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// GUMBALL MACHINE GAME - Count the gumballs!
// ============================================
export function GumballMachineGame({ question, correctAnswer, options, onCorrect, onWrong }: CandyGameProps) {
  const [gumballsOut, setGumballsOut] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)

  const gumballColors = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠']
  const gumballs = Array(correctAnswer).fill(null).map((_, i) => gumballColors[i % gumballColors.length])

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setGumballsOut(true)
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
    <div className="bg-gradient-to-b from-blue-100 to-pink-200 rounded-3xl p-6 shadow-2xl">
      {/* INSTRUCTION BANNER */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-blue-700 mb-1">{question}</h3>
        <p className="text-lg text-pink-500">
          {gumballsOut ? 'Gumballs everywhere! 🎉' : 'Count the gumballs in the machine!'}
        </p>
      </div>

      {/* Gumball machine */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {/* Machine glass dome */}
          <div className="w-40 h-40 bg-white/60 rounded-full border-4 border-gray-300 flex flex-wrap justify-center items-center p-2 overflow-hidden">
            {gumballs.map((gumball, i) => (
              <motion.div
                key={i}
                className="text-2xl m-0.5"
                initial={{ opacity: 0, scale: 0 }}
                animate={gumballsOut
                  ? {
                      y: [0, -20, 100],
                      x: [0, (Math.random() - 0.5) * 100],
                      opacity: [1, 1, 0],
                      scale: [1, 1.2, 0.8]
                    }
                  : { opacity: 1, scale: 1, y: [0, -3, 0] }
                }
                transition={{
                  delay: gumballsOut ? i * 0.1 : i * 0.05,
                  duration: gumballsOut ? 0.8 : 1.5,
                  repeat: gumballsOut ? 0 : Infinity
                }}
              >
                {gumball}
              </motion.div>
            ))}
          </div>

          {/* Machine base */}
          <div className="w-32 h-16 bg-gradient-to-b from-red-500 to-red-700 rounded-lg mx-auto -mt-2 flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full border-2 border-gray-400" />
          </div>

          {/* Machine stand */}
          <div className="w-8 h-12 bg-gray-400 mx-auto" />
          <div className="w-20 h-4 bg-gray-500 rounded-lg mx-auto" />
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
            {opt} {gumballColors[i % gumballColors.length]}
          </motion.button>
        ))}
      </div>
      <CelebrationConfetti show={showCelebration} emoji={['🔴', '🟡', '🟢', '🔵', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// CHOCOLATE BAR GAME - Count chocolate squares!
// ============================================
export function ChocolateBarGame({ question, correctAnswer, options, onCorrect, onWrong }: CandyGameProps) {
  const [isMelting, setIsMelting] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)

  const handleAnswer = (answer: number) => {
    setSelectedAnswer(answer)
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setIsMelting(true)
      setShowCelebration(true)
      sounds.playCelebration()
      setTimeout(() => {
        setShowCelebration(false)
        onCorrect()
      }, 1200)
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

  // Create chocolate squares grid
  const rows = Math.ceil(correctAnswer / 4)
  const chocolateSquares = Array(correctAnswer).fill('🟫')

  return (
    <div className="bg-gradient-to-b from-amber-100 to-amber-300 rounded-3xl p-6 shadow-2xl">
      {/* INSTRUCTION BANNER */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-amber-800">
          {isMelting ? 'Yummy chocolate! 🍫✨' : 'Count the chocolate pieces!'}
        </h3>
        <p className="text-lg text-amber-700">{question}</p>
        {!isMelting && (
          <p className="text-base text-amber-600 font-bold mt-1">
            👆 Tap how many chocolate squares!
          </p>
        )}
      </div>

      {/* Chocolate bar display */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {/* Wrapper */}
          <motion.div
            className="bg-gradient-to-br from-amber-700 to-amber-900 p-4 rounded-xl shadow-lg"
            animate={isMelting ? { scale: [1, 1.1, 1] } : {}}
          >
            <div className="grid grid-cols-4 gap-1">
              {chocolateSquares.map((_, i) => (
                <motion.div
                  key={i}
                  className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-sm flex items-center justify-center text-2xl shadow-inner"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isMelting
                    ? {
                        opacity: [1, 0.8, 1],
                        y: [0, 2, 0],
                        scale: [1, 0.95, 1]
                      }
                    : { opacity: 1, scale: 1 }
                  }
                  transition={{
                    delay: i * 0.05,
                    duration: isMelting ? 0.5 : 0.3,
                    repeat: isMelting ? 2 : 0
                  }}
                >
                  🍫
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Melting effect */}
          {isMelting && (
            <motion.div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-4xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              🤤
            </motion.div>
          )}
        </div>
      </div>

      {/* Answer options */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt, i) => (
          <motion.button
            key={opt}
            className={`bg-white rounded-2xl p-4 text-3xl font-bold shadow-lg game-interactive
                       ${selectedAnswer === opt ? 'ring-4 ring-amber-400' : 'hover:bg-amber-50'}`}
            onClick={() => handleAnswer(opt)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            {opt} 🍫
          </motion.button>
        ))}
      </div>
      <CelebrationConfetti show={showCelebration} emoji={['🍫', '🍬', '✨', '🤤', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// CANDY JAR GAME - Count candies in the jar!
// ============================================
export function CandyJarGame({ question, correctAnswer, options, onCorrect, onWrong }: CandyGameProps) {
  const [candiesFlying, setCandiesFlying] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)

  const candyTypes = ['🍬', '🍫', '🍭', '🍩', '🧁']
  const candies = Array(correctAnswer).fill(null).map((_, i) => candyTypes[i % candyTypes.length])

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setCandiesFlying(true)
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
    <div className="bg-gradient-to-b from-purple-100 to-pink-200 rounded-3xl p-6 shadow-2xl min-h-[400px]">
      {/* Title */}
      <div className="text-center mb-4">
        <motion.h3
          className="text-2xl font-bold text-purple-700 mb-1"
          animate={candiesFlying ? { scale: [1, 1.1, 1], color: ['#7C3AED', '#EC4899', '#7C3AED'] } : {}}
          transition={{ duration: 0.5, repeat: candiesFlying ? Infinity : 0 }}
        >
          {question}
        </motion.h3>
        <p className="text-lg text-pink-500">
          {candiesFlying ? 'Sweet celebration! 🎉🍬' : 'Count the candies in the jar!'}
        </p>
      </div>

      {/* Candy jar */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {/* Jar lid */}
          <div className="w-24 h-6 bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-lg mx-auto" />

          {/* Jar body */}
          <div className="w-36 h-40 bg-white/40 border-4 border-blue-200 rounded-b-3xl flex flex-wrap justify-center items-center p-2 overflow-hidden">
            {candies.map((candy, i) => (
              <motion.div
                key={i}
                className="text-2xl m-0.5"
                initial={{ opacity: 0, scale: 0 }}
                animate={candiesFlying
                  ? {
                      y: [0, -150, -300],
                      x: [0, (Math.random() - 0.5) * 200],
                      rotate: [0, 360, 720],
                      opacity: [1, 1, 0],
                      scale: [1, 1.5, 0.5]
                    }
                  : { opacity: 1, scale: 1, y: [0, -2, 0] }
                }
                transition={{
                  delay: candiesFlying ? i * 0.1 : i * 0.05,
                  duration: candiesFlying ? 1.2 : 1.5,
                  repeat: candiesFlying ? 0 : Infinity
                }}
              >
                {candy}
              </motion.div>
            ))}
          </div>

          {/* Jar reflection */}
          <div className="absolute top-8 left-4 w-4 h-20 bg-white/30 rounded-full transform -rotate-12" />
        </div>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {candiesFlying && (
          <motion.div
            className="text-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <span className="text-5xl">🍬</span>
            <p className="text-xl font-bold text-pink-600">Candies for everyone!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer options */}
      {!candiesFlying && (
        <div className="grid grid-cols-2 gap-4">
          {options.map((opt, i) => (
            <motion.button
              key={opt}
              className="bg-white rounded-2xl p-4 text-3xl font-bold shadow-lg
                         hover:bg-purple-50 game-interactive"
              onClick={() => handleAnswer(opt)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              {opt} {candyTypes[i % candyTypes.length]}
            </motion.button>
          ))}
        </div>
      )}
      <CelebrationConfetti show={showCelebration} emoji={['🍭', '🧁', '🍬', '🍫', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}
