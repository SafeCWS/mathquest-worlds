'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { EncouragingMessage, CelebrationConfetti, getEncouragingMessage } from '../GameFeedback'

interface CatGameProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
  emoji?: string
}

// ============================================
// CAT TREATS GAME - Count treats for hungry kitty!
// ============================================
export function CatTreatsGame({ question, correctAnswer, options, onCorrect, onWrong }: CatGameProps) {
  const [isHappy, setIsHappy] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)
  const treats = Array(correctAnswer).fill('🐟')

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
    <div className="bg-gradient-to-b from-pink-100 to-pink-300 rounded-3xl p-4 md:p-6 shadow-2xl max-h-[70vh]">
      {/* Hungry cat */}
      <div className="text-center mb-3 md:mb-6">
        <motion.div
          className="text-6xl md:text-8xl mb-2"
          animate={isHappy
            ? { scale: [1, 1.2, 1], rotate: [-5, 5, -5, 0] }
            : { y: [0, -5, 0] }
          }
          transition={{ duration: isHappy ? 0.5 : 2, repeat: isHappy ? 0 : Infinity }}
        >
          {isHappy ? '😻' : '😺'}
        </motion.div>

        {!isHappy && (
          <motion.div
            className="inline-block bg-white rounded-2xl px-4 py-2 shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-lg font-bold text-pink-600">Meow! I&apos;m hungry!</span>
          </motion.div>
        )}

        {isHappy && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-pink-600"
          >
            Purrfect! 💖
          </motion.div>
        )}
      </div>

      {/* INSTRUCTION BANNER - Fish treats to count */}
      <div className="bg-white/80 rounded-2xl p-3 md:p-4 mb-3 md:mb-6">
        <p className="text-xl md:text-2xl font-bold text-center text-pink-700 mb-2">{question}</p>
        <p className="text-sm md:text-base text-center text-pink-500">
          Count the fish treats!
        </p>
        <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
          {treats.map((treat, i) => (
            <motion.span
              key={i}
              className="text-2xl sm:text-3xl md:text-4xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
            >
              {treat}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {options.map((opt, i) => (
          <motion.button
            key={opt}
            className="bg-white rounded-2xl p-3 md:p-4 text-2xl md:text-3xl font-bold shadow-lg
                       hover:bg-pink-50 active:bg-pink-100 game-interactive"
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
      <CelebrationConfetti show={showCelebration} emoji={['🐟', '😻', '✨', '💖', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// YARN BALL GAME - Playful kitten picks yarn!
// ============================================
export function YarnBallGame({ question, correctAnswer, options, onCorrect, onWrong }: CatGameProps) {
  const [selectedYarn, setSelectedYarn] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)

  const yarnColors = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400']

  const handleYarnSelect = (answer: number) => {
    setSelectedYarn(answer)
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setIsPlaying(true)
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
        setSelectedYarn(null)
        setShowEncouragement(false)
      }, 1200)
      onWrong()
    }
  }

  return (
    <div className="bg-gradient-to-b from-purple-100 to-pink-200 rounded-3xl p-4 md:p-6 shadow-2xl max-h-[70vh]">
      {/* Playful kitten */}
      <div className="text-center mb-3 md:mb-6">
        <motion.div
          className="text-6xl md:text-8xl"
          animate={isPlaying
            ? { rotate: [-20, 20, -20], x: [-10, 10, -10] }
            : { rotate: [0, 5, -5, 0] }
          }
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {isPlaying ? '😹' : '🐱'}
        </motion.div>

        <p className="text-lg md:text-xl font-bold text-purple-700 mt-2">
          {isPlaying ? 'Wheee! So fun!' : 'Pick the right yarn ball!'}
        </p>
      </div>

      {/* Question */}
      <div className="bg-white/90 rounded-2xl p-3 md:p-4 mb-3 md:mb-6 text-center">
        <p className="text-xl md:text-2xl font-bold text-purple-800">{question}</p>
      </div>

      {/* Yarn ball options */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {options.map((opt, i) => (
          <motion.button
            key={opt}
            className={`relative rounded-2xl p-4 md:p-6 text-center shadow-lg game-interactive
                       ${selectedYarn === opt
                         ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white'
                         : 'bg-white hover:bg-purple-50'}`}
            onClick={() => handleYarnSelect(opt)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <motion.div
              className={`text-4xl md:text-5xl mb-2 rounded-full w-12 h-12 md:w-16 md:h-16 mx-auto flex items-center justify-center ${yarnColors[i % yarnColors.length]}`}
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            >
              <span className="text-2xl md:text-3xl">🧶</span>
            </motion.div>
            <span className="text-xl md:text-2xl font-bold">{opt}</span>
          </motion.button>
        ))}
      </div>
      <CelebrationConfetti show={showCelebration} emoji={['🧶', '🐱', '✨', '💜', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// CAT NAP GAME - Count sleeping kitties!
// ============================================
export function CatNapGame({ question, correctAnswer, options, onCorrect, onWrong }: CatGameProps) {
  const [allAwake, setAllAwake] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)
  const sleepingCats = Array(correctAnswer).fill('😴')

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setAllAwake(true)
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
    <div className="bg-gradient-to-b from-indigo-100 to-purple-200 rounded-3xl p-4 md:p-6 shadow-2xl max-h-[70vh]">
      {/* INSTRUCTION BANNER */}
      <div className="text-center mb-3 md:mb-4">
        <h3 className="text-xl md:text-2xl font-bold text-purple-700 mb-1">{question}</h3>
        <p className="text-base md:text-lg text-purple-500">
          {allAwake ? 'Good morning kitties!' : 'Shhh... Count the sleeping kitties!'}
        </p>
      </div>

      {/* Sleeping cats */}
      <div className="bg-white/60 rounded-2xl p-3 md:p-4 mb-3 md:mb-6">
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {sleepingCats.map((_, i) => (
            <motion.div
              key={i}
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              <motion.span
                className="text-4xl md:text-5xl block"
                animate={allAwake
                  ? { scale: [1, 1.2, 1] }
                  : { y: [0, -3, 0] }
                }
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              >
                {allAwake ? '😺' : '😴'}
              </motion.span>

              {/* Zzz for sleeping */}
              {!allAwake && (
                <motion.span
                  className="absolute -top-2 -right-2 text-lg"
                  animate={{ opacity: [0, 1, 0], y: [0, -10, -20] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                >
                  💤
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Answer options */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {options.map((opt, i) => (
          <motion.button
            key={opt}
            className="bg-white rounded-2xl p-3 md:p-4 text-2xl md:text-3xl font-bold shadow-lg
                       hover:bg-purple-50 game-interactive"
            onClick={() => handleAnswer(opt)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            {opt} 🐱
          </motion.button>
        ))}
      </div>
      <CelebrationConfetti show={showCelebration} emoji={['😺', '💤', '✨', '☀️', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// CAT TOWER GAME - Stack kitties to reach the height!
// ============================================
export function CatTowerGame({ question, correctAnswer, options, onCorrect, onWrong }: CatGameProps) {
  const [stackedCats, setStackedCats] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)

  const handleAnswer = (answer: number) => {
    setSelectedAnswer(answer)
    if (answer === correctAnswer) {
      sounds.playCorrect()
      // Animate stacking cats
      let count = 0
      const stackInterval = setInterval(() => {
        count++
        setStackedCats(count)
        sounds.playBoing()
        if (count >= correctAnswer) {
          clearInterval(stackInterval)
          setIsComplete(true)
          setShowCelebration(true)
          sounds.playCelebration()
          setTimeout(() => {
            setShowCelebration(false)
            onCorrect()
          }, 1000)
        }
      }, 200)
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
    <div className="bg-gradient-to-b from-orange-100 to-pink-200 rounded-3xl p-4 md:p-6 shadow-2xl min-h-[280px] sm:min-h-[350px] md:min-h-[400px] max-h-[70vh]">
      {/* INSTRUCTION BANNER */}
      <div className="text-center mb-3 md:mb-4">
        <h3 className="text-lg md:text-xl font-bold text-orange-700">
          {isComplete ? 'Purrfect tower!' : 'Build a cat tower!'}
        </h3>
        <p className="text-base md:text-lg text-orange-600">{question}</p>
        {!isComplete && (
          <p className="text-sm md:text-base text-pink-600 font-bold mt-1">
            Tap how many cats to stack!
          </p>
        )}
      </div>

      {/* Cat Tower Display */}
      <div className="flex justify-center mb-4 md:mb-6">
        <div className="relative">
          {/* Platform */}
          <div className="w-24 md:w-32 h-3 md:h-4 bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg shadow-lg" />

          {/* Stacked cats */}
          <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center">
            {Array(stackedCats).fill(null).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl md:text-4xl -mb-2"
              >
                {i === stackedCats - 1 ? '😸' : '🐱'}
              </motion.div>
            ))}
          </div>

          {/* Target height indicator */}
          <motion.div
            className="absolute -right-12 md:-right-16 bottom-3 md:bottom-4 flex flex-col items-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-sm md:text-lg font-bold text-pink-600">Goal:</span>
            <span className="text-2xl md:text-3xl font-bold text-pink-700">{correctAnswer}</span>
            <span className="text-xl md:text-2xl">🐱</span>
          </motion.div>
        </div>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="text-center mb-3 md:mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <span className="text-4xl md:text-5xl">🎉</span>
            <p className="text-lg md:text-xl font-bold text-pink-600">Amazing tower!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer options */}
      {!isComplete && (
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {options.map((opt, i) => (
            <motion.button
              key={opt}
              className={`bg-white rounded-2xl p-3 md:p-4 text-2xl md:text-3xl font-bold shadow-lg game-interactive
                         ${selectedAnswer === opt ? 'ring-4 ring-pink-400' : 'hover:bg-orange-50'}`}
              onClick={() => handleAnswer(opt)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              {opt} 🐱
            </motion.button>
          ))}
        </div>
      )}
      <CelebrationConfetti show={showCelebration} emoji={['🐱', '🏆', '✨', '🎉', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// KITTY DANCE GAME - Cats dance when you pick right!
// ============================================
export function KittyDanceGame({ question, correctAnswer, options, onCorrect, onWrong }: CatGameProps) {
  const [isDancing, setIsDancing] = useState(false)
  const [showQuestion, setShowQuestion] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)

  const dancingCats = ['🐱', '😺', '😸', '😻', '🙀']

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setShowQuestion(false)
      setIsDancing(true)
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
    <div className="bg-gradient-to-b from-pink-200 via-purple-200 to-pink-300 rounded-3xl p-4 md:p-6 shadow-2xl min-h-[280px] sm:min-h-[350px] md:min-h-[400px] max-h-[70vh]">
      {/* Title */}
      <div className="text-center mb-3 md:mb-4">
        <motion.h3
          className="text-xl md:text-2xl font-bold text-pink-700"
          animate={isDancing ? { scale: [1, 1.1, 1], color: ['#DB2777', '#9333EA', '#DB2777'] } : {}}
          transition={{ duration: 0.5, repeat: isDancing ? Infinity : 0 }}
        >
          {isDancing ? 'Dance Party!' : 'Get the cats dancing!'}
        </motion.h3>
      </div>

      {/* Dancing cats display */}
      <div className="flex justify-center gap-1 sm:gap-2 mb-4 md:mb-6 h-24 md:h-32">
        {dancingCats.map((cat, i) => (
          <motion.div
            key={i}
            className="text-4xl md:text-5xl"
            animate={isDancing
              ? {
                  y: [0, -30, 0],
                  rotate: [-15, 15, -15],
                  scale: [1, 1.2, 1]
                }
              : { y: [0, -5, 0] }
            }
            transition={{
              duration: isDancing ? 0.5 : 2,
              repeat: Infinity,
              delay: i * 0.1
            }}
          >
            {cat}
          </motion.div>
        ))}
      </div>

      {/* Disco lights when dancing */}
      {isDancing && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-8 h-8 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#FF69B4', '#FFD700', '#00CED1', '#FF6B6B', '#9B59B6'][i % 5]
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      )}

      {/* Question and answers */}
      {showQuestion && (
        <>
          <div className="bg-white/90 rounded-2xl p-3 md:p-4 mb-3 md:mb-6 text-center">
            <p className="text-xl md:text-2xl font-bold text-purple-800">{question}</p>
            <p className="text-base md:text-lg text-pink-600 font-bold">
              Pick right to start the dance!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {options.map((opt, i) => (
              <motion.button
                key={opt}
                className="bg-white rounded-2xl p-3 md:p-4 text-2xl md:text-3xl font-bold shadow-lg
                           hover:bg-pink-50 game-interactive"
                onClick={() => handleAnswer(opt)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </>
      )}
      <CelebrationConfetti show={showCelebration} emoji={['💃', '🕺', '🐱', '🎉', '✨']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}
