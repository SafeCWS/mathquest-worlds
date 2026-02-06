'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { EncouragingMessage, CelebrationConfetti, getEncouragingMessage } from '../GameFeedback'

interface DinoGameProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
  emoji?: string
}

// ============================================
// FOSSIL HUNT GAME - Count fossils found in the dig site!
// ============================================
export function FossilHuntGame({ question, correctAnswer, options, onCorrect, onWrong }: DinoGameProps) {
  const [isHappy, setIsHappy] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)
  const fossils = Array(correctAnswer).fill('🦴')

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
    <div className="bg-gradient-to-b from-amber-100 to-orange-200 rounded-3xl p-6 shadow-2xl">
      {/* Paleontologist dino */}
      <div className="text-center mb-6">
        <motion.div
          className="text-8xl mb-2"
          animate={isHappy
            ? { scale: [1, 1.2, 1], rotate: [-5, 5, -5, 0] }
            : { y: [0, -5, 0] }
          }
          transition={{ duration: isHappy ? 0.5 : 2, repeat: isHappy ? 0 : Infinity }}
        >
          {isHappy ? '🦖' : '🦕'}
        </motion.div>

        {!isHappy && (
          <motion.div
            className="inline-block bg-white rounded-2xl px-4 py-2 shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-lg font-bold text-amber-600">ROAR! Let&apos;s dig for fossils!</span>
          </motion.div>
        )}

        {isHappy && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-orange-600"
          >
            Amazing discovery! ROAR!
          </motion.div>
        )}
      </div>

      {/* INSTRUCTION BANNER - Fossils to count */}
      <div className="bg-white/80 rounded-2xl p-4 mb-6">
        <p className="text-2xl font-bold text-center text-amber-700 mb-2">{question}</p>
        <p className="text-base text-center text-amber-500">
          Count the fossils at the dig site! 🦴
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {fossils.map((fossil, i) => (
            <motion.span
              key={i}
              className="text-4xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
            >
              {fossil}
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
                       hover:bg-amber-50 active:bg-amber-100 game-interactive"
            onClick={() => handleAnswer(opt)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {opt} 🦴
          </motion.button>
        ))}
      </div>
      <CelebrationConfetti show={showCelebration} emoji={['🦖', '🦕', '🥚', '🦴', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// EGG HATCH GAME - How many eggs will hatch?
// ============================================
export function EggHatchGame({ question, correctAnswer, options, onCorrect, onWrong }: DinoGameProps) {
  const [hatched, setHatched] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)
  const eggs = Array(correctAnswer).fill('🥚')

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setHatched(true)
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
    <div className="bg-gradient-to-b from-yellow-100 to-amber-200 rounded-3xl p-6 shadow-2xl">
      {/* INSTRUCTION BANNER */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-amber-700 mb-1">{question}</h3>
        <p className="text-lg text-yellow-500">
          {hatched ? 'Welcome baby dinos! 🦕' : 'Count the eggs in the nest! 🥚'}
        </p>
      </div>

      {/* Eggs / Baby dinos */}
      <div className="bg-white/60 rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap justify-center gap-3">
          {eggs.map((_, i) => (
            <motion.div
              key={i}
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              <motion.span
                className="text-5xl block"
                animate={hatched
                  ? { scale: [1, 1.3, 1], rotate: [-10, 10, -10, 0] }
                  : { rotate: [-3, 3, -3] }
                }
                transition={{ duration: hatched ? 0.5 : 2, repeat: hatched ? 0 : Infinity, delay: i * 0.2 }}
              >
                {hatched ? '🦕' : '🥚'}
              </motion.span>

              {/* Wobble effect for eggs */}
              {!hatched && (
                <motion.span
                  className="absolute -top-1 left-1/2 -translate-x-1/2 text-sm"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                >
                  crack!
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
                       hover:bg-yellow-50 game-interactive"
            onClick={() => handleAnswer(opt)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            {opt} 🥚
          </motion.button>
        ))}
      </div>
      <CelebrationConfetti show={showCelebration} emoji={['🦖', '🦕', '🥚', '🦴', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// VOLCANO COUNTDOWN GAME - Count to launch the eruption!
// ============================================
export function VolcanoCountdownGame({ question, correctAnswer, options, onCorrect, onWrong }: DinoGameProps) {
  const [isErupting, setIsErupting] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      // Start countdown animation
      let count = correctAnswer
      const countdownInterval = setInterval(() => {
        count--
        setCountdown(count)
        sounds.playBoing()
        if (count <= 0) {
          clearInterval(countdownInterval)
          setIsErupting(true)
          setShowCelebration(true)
          sounds.playCelebration()
          setTimeout(() => {
            setShowCelebration(false)
            onCorrect()
          }, 1500)
        }
      }, 300)
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
    <div className="bg-gradient-to-b from-orange-100 to-red-200 rounded-3xl p-6 shadow-2xl min-h-[400px]">
      {/* INSTRUCTION BANNER */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-red-700">
          {isErupting ? 'BOOM! Eruption!' : 'Pick the right number to start the eruption!'}
        </h3>
        <p className="text-lg text-orange-600">{question}</p>
        {!isErupting && countdown === null && (
          <p className="text-base text-red-600 font-bold mt-1">
            Tap to countdown and erupt!
          </p>
        )}
      </div>

      {/* Volcano Display */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <motion.div
            className="text-8xl"
            animate={isErupting
              ? { scale: [1, 1.3, 1], y: [0, -10, 0] }
              : { scale: [1, 1.02, 1] }
            }
            transition={{ duration: isErupting ? 0.3 : 2, repeat: Infinity }}
          >
            🌋
          </motion.div>

          {/* Eruption particles */}
          {isErupting && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-3xl"
                  style={{ left: '50%', top: '0' }}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 150,
                    y: -100 - Math.random() * 100,
                    opacity: 0,
                    rotate: Math.random() * 360
                  }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                >
                  {['🔥', '💥', '⭐', '🌟'][i % 4]}
                </motion.div>
              ))}
            </>
          )}

          {/* Countdown display */}
          {countdown !== null && countdown > 0 && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-white"
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={countdown}
            >
              {countdown}
            </motion.div>
          )}
        </div>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {isErupting && (
          <motion.div
            className="text-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <span className="text-5xl">💥</span>
            <p className="text-xl font-bold text-red-600">Incredible eruption!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer options */}
      {!isErupting && countdown === null && (
        <div className="grid grid-cols-2 gap-4">
          {options.map((opt, i) => (
            <motion.button
              key={opt}
              className="bg-white rounded-2xl p-4 text-3xl font-bold shadow-lg
                         hover:bg-orange-50 game-interactive"
              onClick={() => handleAnswer(opt)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              {opt} 🌋
            </motion.button>
          ))}
        </div>
      )}
      <CelebrationConfetti show={showCelebration} emoji={['🦖', '🦕', '🥚', '🦴', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// DINO FOOTPRINT GAME - Count the dinosaur footprints!
// ============================================
export function DinoFootprintGame({ question, correctAnswer, options, onCorrect, onWrong }: DinoGameProps) {
  const [showDino, setShowDino] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)
  const footprints = Array(correctAnswer).fill('🐾')

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setShowDino(true)
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
    <div className="bg-gradient-to-b from-amber-200 to-orange-300 rounded-3xl p-6 shadow-2xl">
      {/* INSTRUCTION BANNER */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-amber-800 mb-1">{question}</h3>
        <p className="text-lg text-amber-500">
          {showDino ? 'You found the T-Rex! 🦖' : 'Count the footprints to find the dino! 🐾'}
        </p>
      </div>

      {/* Footprint trail */}
      <div className="bg-white/60 rounded-2xl p-4 mb-6 min-h-[120px]">
        <div className="flex flex-wrap justify-center gap-2 items-center">
          {footprints.map((_, i) => (
            <motion.span
              key={i}
              className="text-4xl"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.15, type: 'spring' }}
              style={{ transform: `rotate(${(i % 2 === 0 ? -15 : 15)}deg)` }}
            >
              🐾
            </motion.span>
          ))}

          {/* T-Rex appears at the end */}
          <AnimatePresence>
            {showDino && (
              <motion.span
                className="text-6xl"
                initial={{ scale: 0, x: 50 }}
                animate={{ scale: 1, x: 0, rotate: [-5, 5, -5, 0] }}
                transition={{ type: 'spring', duration: 0.5 }}
              >
                🦖
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {showDino && (
          <motion.div
            className="text-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <p className="text-xl font-bold text-amber-700">ROAR! Great tracking!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer options */}
      {!showDino && (
        <div className="grid grid-cols-2 gap-4">
          {options.map((opt, i) => (
            <motion.button
              key={opt}
              className="bg-white rounded-2xl p-4 text-3xl font-bold shadow-lg
                         hover:bg-amber-50 game-interactive"
              onClick={() => handleAnswer(opt)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              {opt} 🐾
            </motion.button>
          ))}
        </div>
      )}
      <CelebrationConfetti show={showCelebration} emoji={['🦖', '🦕', '🥚', '🦴', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}

// ============================================
// PTERODACTYL FLY GAME - Help pterodactyls fly to the right number!
// ============================================
export function PterodactylFlyGame({ question, correctAnswer, options, onCorrect, onWrong }: DinoGameProps) {
  const [isFlying, setIsFlying] = useState(false)
  const [showQuestion, setShowQuestion] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encourageMsg, setEncourageMsg] = useState<{ text: string; emoji: string } | null>(null)

  const pterodactyls = ['🦅', '🦅', '🦅'] // Using eagle as closest to pterodactyl

  const handleAnswer = (answer: number) => {
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setShowQuestion(false)
      setIsFlying(true)
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
    <div className="bg-gradient-to-b from-sky-100 to-amber-200 rounded-3xl p-6 shadow-2xl min-h-[400px] overflow-hidden relative">
      {/* Title */}
      <div className="text-center mb-4">
        <motion.h3
          className="text-2xl font-bold text-sky-700"
          animate={isFlying ? { y: [-5, 5, -5] } : {}}
          transition={{ duration: 1, repeat: isFlying ? Infinity : 0 }}
        >
          {isFlying ? 'Soaring high!' : 'Help the pterodactyls fly!'}
        </motion.h3>
      </div>

      {/* Flying dinosaurs display */}
      <div className="flex justify-center gap-4 mb-6 h-32 relative">
        {pterodactyls.map((bird, i) => (
          <motion.div
            key={i}
            className="text-5xl"
            animate={isFlying
              ? {
                  y: [-50, -100, -150],
                  x: [(i - 1) * 20, (i - 1) * 40, (i - 1) * 60],
                  scale: [1, 0.8, 0.6],
                  opacity: [1, 0.8, 0]
                }
              : {
                  y: [0, -10, 0],
                  rotate: [-5, 5, -5]
                }
            }
            transition={{
              duration: isFlying ? 2 : 2,
              repeat: isFlying ? 0 : Infinity,
              delay: i * 0.2
            }}
          >
            {bird}
          </motion.div>
        ))}

        {/* Sun in corner */}
        <motion.div
          className="absolute top-0 right-0 text-4xl"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          ☀️
        </motion.div>

        {/* Clouds */}
        <motion.div
          className="absolute top-4 left-4 text-3xl"
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ☁️
        </motion.div>
        <motion.div
          className="absolute top-8 right-12 text-2xl"
          animate={{ x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          ☁️
        </motion.div>
      </div>

      {/* Flying celebration */}
      {isFlying && (
        <motion.div
          className="text-center mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <span className="text-5xl">🎉</span>
          <p className="text-xl font-bold text-sky-600">They&apos;re flying so high!</p>
        </motion.div>
      )}

      {/* Question and answers */}
      {showQuestion && (
        <>
          <div className="bg-white/90 rounded-2xl p-4 mb-6 text-center">
            <p className="text-2xl font-bold text-amber-800">{question}</p>
            <p className="text-lg text-sky-600 font-bold">
              Pick right to help them soar!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {options.map((opt, i) => (
              <motion.button
                key={opt}
                className="bg-white rounded-2xl p-4 text-3xl font-bold shadow-lg
                           hover:bg-sky-50 game-interactive"
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
      <CelebrationConfetti show={showCelebration} emoji={['🦖', '🦕', '🥚', '🦴', '⭐']} />
      <EncouragingMessage show={showEncouragement} message={encourageMsg || undefined} />
    </div>
  )
}
