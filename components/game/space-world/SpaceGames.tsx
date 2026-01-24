'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'

interface SpaceGameProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
  emoji?: string
}

// ============================================
// ASTEROID BLAST - Shoot the right asteroid!
// ============================================
export function AsteroidBlastGame({ question, correctAnswer, options, onCorrect, onWrong }: SpaceGameProps) {
  const [blasted, setBlasted] = useState<number | null>(null)

  const handleBlast = (answer: number) => {
    setBlasted(answer)
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setTimeout(onCorrect, 1000)
    } else {
      sounds.playGentleError()
      setTimeout(() => {
        setBlasted(null)
        onWrong()
      }, 800)
    }
  }

  return (
    <div className="bg-gradient-to-b from-indigo-900 via-purple-900 to-black rounded-3xl p-6 min-h-[400px] relative overflow-hidden">
      {/* Stars background */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

      {/* Spaceship */}
      <motion.div
        className="text-6xl text-center mb-4"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span role="img" aria-label="rocket">&#x1F680;</span>
      </motion.div>

      {/* Question */}
      <motion.div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-6 text-center">
        <p className="text-2xl font-bold text-white">{question}</p>
        <p className="text-lg text-cyan-300 font-bold">Blast the right asteroid!</p>
      </motion.div>

      {/* Asteroids */}
      <div className="flex justify-center gap-6 flex-wrap">
        {options.map((opt, i) => (
          <motion.button
            key={opt}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold game-interactive ${
              blasted === opt
                ? opt === correctAnswer
                  ? 'bg-green-500'
                  : 'bg-red-500'
                : 'bg-gradient-to-br from-gray-500 to-gray-700'
            }`}
            onClick={() => handleBlast(opt)}
            disabled={blasted !== null}
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: blasted === opt && opt === correctAnswer ? [1, 1.5, 0] : 1,
              rotate: 0,
              x: [0, 5, -5, 0]
            }}
            transition={{
              delay: i * 0.1,
              x: { duration: 3 + i, repeat: Infinity }
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-white">{opt}</span>
            <span className="absolute -top-2 -right-2 text-2xl" role="img" aria-label="comet">&#x2604;&#xFE0F;</span>
          </motion.button>
        ))}
      </div>

      {/* Explosion effect */}
      <AnimatePresence>
        {blasted === correctAnswer && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="text-8xl"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 2, 0], rotate: [0, 180, 360] }}
              transition={{ duration: 0.8 }}
              role="img"
              aria-label="explosion"
            >
              &#x1F4A5;
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// PLANET HOP - Jump to planets in order!
// ============================================
export function PlanetHopGame({ question, correctAnswer, options, onCorrect, onWrong }: SpaceGameProps) {
  const [currentPlanet, setCurrentPlanet] = useState(0)
  const [astronaut, setAstronaut] = useState(0)
  const sortedOptions = [...options].sort((a, b) => a - b)

  const handleHop = (planetIndex: number) => {
    const expectedValue = sortedOptions[currentPlanet]
    const clickedValue = sortedOptions[planetIndex]

    if (clickedValue === expectedValue && planetIndex === currentPlanet) {
      sounds.playPop()
      setAstronaut(planetIndex)
      const next = currentPlanet + 1
      setCurrentPlanet(next)

      if (next >= sortedOptions.length) {
        sounds.playCorrect()
        sounds.playCelebration()
        setTimeout(onCorrect, 800)
      }
    } else {
      sounds.playGentleError()
      onWrong()
    }
  }

  const planets = ['\u{1FA90}', '\u{1F30D}', '\u{1F319}', '\u2B50']

  return (
    <div className="bg-gradient-to-b from-slate-900 via-indigo-900 to-purple-900 rounded-3xl p-6 min-h-[400px] relative">
      {/* Instruction */}
      <motion.div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-6 text-center">
        <p className="text-xl font-bold text-white">Hop to planets in order!</p>
        <p className="text-lg text-yellow-300">1 - 2 - 3 Smallest to biggest!</p>
      </motion.div>

      {/* Planets */}
      <div className="flex justify-center gap-4 items-end flex-wrap">
        {sortedOptions.map((value, index) => (
          <motion.button
            key={index}
            className={`relative flex flex-col items-center game-interactive ${
              index < currentPlanet ? 'opacity-50' : ''
            }`}
            onClick={() => handleHop(index)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Astronaut */}
            {astronaut === index && (
              <motion.span
                className="text-4xl absolute -top-12"
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                role="img"
                aria-label="astronaut"
              >
                &#x1F468;&#x200D;&#x1F680;
              </motion.span>
            )}

            {/* Planet */}
            <motion.span
              className="text-6xl"
              animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: index * 0.3 }}
            >
              {planets[index % planets.length]}
            </motion.span>

            {/* Number label */}
            <div className={`mt-2 px-4 py-2 rounded-xl text-xl font-bold ${
              index < currentPlanet
                ? 'bg-green-500 text-white'
                : 'bg-white/20 text-white'
            }`}>
              {value}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Progress */}
      <div className="mt-8 text-center text-white">
        <p className="text-lg">Planets visited: {currentPlanet} / {sortedOptions.length}</p>
      </div>
    </div>
  )
}

// ============================================
// ALIEN FEEDING - Feed the hungry alien!
// ============================================
export function AlienFeedingGame({ question, correctAnswer, options, onCorrect, onWrong }: SpaceGameProps) {
  const [fed, setFed] = useState(false)
  const [selectedFood, setSelectedFood] = useState<number | null>(null)

  const spaceFood = ['\u{1F355}', '\u{1F32E}', '\u{1F354}', '\u{1F369}']
  const foodDisplay = Array(correctAnswer).fill(0).map((_, i) => spaceFood[i % spaceFood.length])

  const handleFeed = (answer: number) => {
    setSelectedFood(answer)
    if (answer === correctAnswer) {
      sounds.playCorrect()
      setFed(true)
      setTimeout(onCorrect, 1200)
    } else {
      sounds.playGentleError()
      setTimeout(() => setSelectedFood(null), 500)
      onWrong()
    }
  }

  return (
    <div className="bg-gradient-to-b from-green-900 via-teal-900 to-slate-900 rounded-3xl p-6 min-h-[400px]">
      {/* Alien */}
      <div className="text-center mb-6">
        <motion.div
          className="text-8xl inline-block"
          animate={fed
            ? { scale: [1, 1.3, 1], rotate: [-10, 10, -10, 0] }
            : { y: [0, -5, 0] }
          }
          transition={{ duration: fed ? 0.5 : 2, repeat: fed ? 0 : Infinity }}
        >
          {fed ? '\u{1F973}' : '\u{1F47D}'}
        </motion.div>

        <motion.div
          className="mt-2 bg-white/10 backdrop-blur inline-block px-4 py-2 rounded-xl"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="text-xl text-green-300 font-bold">
            {fed ? 'Yummy! Thanks, Earthling!' : 'Hungry for space food!'}
          </span>
        </motion.div>
      </div>

      {/* Food display */}
      <div className="bg-white/10 rounded-2xl p-4 mb-6">
        <p className="text-center text-white text-lg mb-3">Count the space food!</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {foodDisplay.map((food, i) => (
            <motion.span
              key={i}
              className="text-4xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {food}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Answer options */}
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
        {options.map((opt, i) => (
          <motion.button
            key={opt}
            className={`p-4 rounded-2xl text-2xl font-bold shadow-lg game-interactive ${
              selectedFood === opt
                ? opt === correctAnswer
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
                : 'bg-white/90 text-gray-800 hover:bg-green-100'
            }`}
            onClick={() => handleFeed(opt)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            {opt} <span role="img" aria-label="ufo">&#x1F6F8;</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// STAR COLLECTOR - Collect the right number of stars!
// ============================================
export function StarCollectorGame({ question, correctAnswer, options, onCorrect, onWrong }: SpaceGameProps) {
  const [collected, setCollected] = useState<number[]>([])
  const totalStars = Math.min(correctAnswer + 4, 12)

  const handleCollect = (starId: number) => {
    if (collected.includes(starId)) {
      // Remove star
      sounds.playSelect()
      setCollected(prev => prev.filter(id => id !== starId))
    } else {
      // Add star
      sounds.playPop()
      const newCollected = [...collected, starId]
      setCollected(newCollected)

      // Check if correct
      if (newCollected.length === correctAnswer) {
        sounds.playCorrect()
        sounds.playCelebration()
        setTimeout(onCorrect, 800)
      }
    }
  }

  return (
    <div className="bg-gradient-to-b from-purple-900 via-indigo-900 to-black rounded-3xl p-6 min-h-[400px] relative overflow-hidden">
      {/* Instruction */}
      <motion.div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-6 text-center">
        <p className="text-2xl font-bold text-white">Collect {correctAnswer} stars!</p>
        <p className="text-lg text-yellow-300">Count: {collected.length} / {correctAnswer}</p>
      </motion.div>

      {/* Stars grid */}
      <div className="flex flex-wrap justify-center gap-4">
        {Array.from({ length: totalStars }).map((_, i) => (
          <motion.button
            key={i}
            className={`text-5xl game-interactive transition-all ${
              collected.includes(i) ? 'scale-125' : 'opacity-70 hover:opacity-100'
            }`}
            onClick={() => handleCollect(i)}
            animate={collected.includes(i)
              ? { rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }
              : { y: [0, -5, 0] }
            }
            transition={{
              duration: collected.includes(i) ? 0.5 : 2,
              repeat: collected.includes(i) ? 0 : Infinity,
              delay: i * 0.1
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            {collected.includes(i) ? '\u{1F31F}' : '\u2B50'}
          </motion.button>
        ))}
      </div>

      {/* Collection basket */}
      <motion.div
        className="mt-8 mx-auto w-48 h-16 bg-white/10 rounded-2xl flex items-center justify-center gap-1 flex-wrap"
        animate={{ scale: collected.length === correctAnswer ? [1, 1.1, 1] : 1 }}
      >
        {collected.map((id) => (
          <motion.span
            key={id}
            className="text-2xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            &#x1F31F;
          </motion.span>
        ))}
        {collected.length === 0 && (
          <span className="text-white/50">Your stars go here!</span>
        )}
      </motion.div>
    </div>
  )
}
