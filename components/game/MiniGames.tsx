'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'

// ============================================
// BUBBLE POP GAME - Pop bubbles with correct answer!
// ============================================
interface BubblePopProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
  emoji: string
}

export function BubblePopGame({ question, correctAnswer, options, onCorrect, onWrong, emoji }: BubblePopProps) {
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; answer: number; popped: boolean }>>([])
  const [score, setScore] = useState(0)

  // Create floating bubbles
  useEffect(() => {
    const newBubbles = options.map((answer, i) => ({
      id: i,
      x: 15 + (i * 22) + Math.random() * 10,
      y: 60 + Math.random() * 20,
      answer,
      popped: false
    }))
    setBubbles(newBubbles)
  }, [options])

  const handlePop = (bubble: typeof bubbles[0]) => {
    if (bubble.popped) return

    setBubbles(prev => prev.map(b =>
      b.id === bubble.id ? { ...b, popped: true } : b
    ))

    if (bubble.answer === correctAnswer) {
      sounds.playCorrect()
      sounds.playMagicWand()
      setScore(prev => prev + 1)
      setTimeout(onCorrect, 800)
    } else {
      sounds.playGentleError()
      setTimeout(() => {
        setBubbles(prev => prev.map(b =>
          b.id === bubble.id ? { ...b, popped: false } : b
        ))
      }, 500)
      onWrong()
    }
  }

  return (
    <div className="relative h-[400px] bg-gradient-to-b from-sky-300 to-sky-500 rounded-3xl overflow-hidden">
      {/* INSTRUCTION BANNER */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 px-6 py-3 rounded-2xl shadow-xl z-10"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
      >
        <p className="text-2xl font-bold text-center">{question}</p>
        <p className="text-lg text-blue-600 text-center font-bold">
          👆 Tap the right bubble! 🫧
        </p>
      </motion.div>

      {/* Floating bubbles */}
      {bubbles.map((bubble) => (
        <motion.button
          key={bubble.id}
          className={`absolute w-20 h-20 rounded-full flex items-center justify-center
                      text-3xl font-bold shadow-lg cursor-pointer
                      ${bubble.popped ? 'opacity-0' : 'bg-gradient-to-br from-blue-200 to-purple-300'}`}
          style={{ left: `${bubble.x}%`, top: `${bubble.y}%` }}
          onClick={() => handlePop(bubble)}
          animate={bubble.popped ? { scale: 0, opacity: 0 } : {
            y: [0, -15, 0],
            x: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3 + bubble.id * 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
        >
          <span className="relative z-10">{bubble.answer}</span>
          {/* Bubble shine */}
          <div className="absolute top-2 left-3 w-4 h-4 bg-white/60 rounded-full" />
        </motion.button>
      ))}

      {/* Decorative emoji */}
      <motion.span
        className="absolute bottom-4 right-4 text-6xl"
        animate={{ rotate: [-10, 10, -10] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {emoji}
      </motion.span>
    </div>
  )
}

// ============================================
// FEED THE ANIMAL GAME - Drag food to hungry animal!
// ============================================
interface FeedAnimalProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
  worldId: string
}

const HUNGRY_ANIMALS = ['🐼', '🦁', '🐶', '🐱', '🐰', '🦊', '🐻', '🐨']
const FOOD_ITEMS = ['🍎', '🍌', '🥕', '🍇', '🍓', '🥬', '🌽', '🍕']

export function FeedAnimalGame({ question, correctAnswer, options, onCorrect, onWrong }: FeedAnimalProps) {
  const [animal] = useState(() => HUNGRY_ANIMALS[Math.floor(Math.random() * HUNGRY_ANIMALS.length)])
  const [food] = useState(() => FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)])
  const [fedCount, setFedCount] = useState(0)
  const [isHappy, setIsHappy] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

  // Create visual food items to show what the animal needs
  const foodDisplay = Array(correctAnswer).fill(food).join('')

  const handleFeed = (answer: number) => {
    setSelectedAnswer(answer)

    if (answer === correctAnswer) {
      sounds.playCorrect()
      sounds.playCoinCollect()
      setIsHappy(true)
      setTimeout(onCorrect, 1000)
    } else {
      sounds.playGentleError()
      setTimeout(() => setSelectedAnswer(null), 500)
      onWrong()
    }
  }

  return (
    <div className="relative bg-gradient-to-b from-green-200 to-green-400 rounded-3xl p-6 min-h-[400px]">
      {/* INSTRUCTION BANNER */}
      <motion.div
        className="bg-white/95 px-6 py-3 rounded-2xl shadow-xl mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <p className="text-2xl font-bold text-center">Count the treats! {foodDisplay}</p>
        <p className="text-lg text-green-600 text-center font-bold">
          🔢 Count and tap how many! 👆
        </p>
      </motion.div>

      {/* Hungry animal */}
      <motion.div
        className="flex justify-center mb-8"
        animate={isHappy ? {
          scale: [1, 1.2, 1],
          rotate: [-5, 5, -5, 0]
        } : {
          y: [0, -5, 0]
        }}
        transition={{ duration: isHappy ? 0.5 : 2, repeat: isHappy ? 0 : Infinity }}
      >
        <div className="relative">
          <span className="text-[120px]">{animal}</span>
          {isHappy && (
            <motion.div
              className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              😋 YUM!
            </motion.div>
          )}
          {!isHappy && (
            <motion.div
              className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white rounded-full px-3 py-1"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="text-sm font-bold">Hungry!</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Food options (answers) */}
      <div className="flex justify-center gap-4 flex-wrap">
        {options.map((answer, i) => (
          <motion.button
            key={i}
            className={`relative bg-white rounded-2xl p-4 shadow-lg min-w-[80px]
                       ${selectedAnswer === answer && answer === correctAnswer ? 'ring-4 ring-green-400' : ''}
                       ${selectedAnswer === answer && answer !== correctAnswer ? 'ring-4 ring-red-400' : ''}`}
            onClick={() => handleFeed(answer)}
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            disabled={isHappy}
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-1">{food}</span>
              <span className="text-2xl font-bold">{answer}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// MATCHING GAME - Match numbers to their pairs!
// ============================================
interface MatchingProps {
  pairs: Array<{ left: string; right: number }>
  onComplete: () => void
}

export function MatchingGame({ pairs, onComplete }: MatchingProps) {
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [selected, setSelected] = useState<{ type: 'left' | 'right'; index: number } | null>(null)
  const [wrongPair, setWrongPair] = useState<number | null>(null)

  const shuffledRight = useState(() =>
    [...pairs].sort(() => Math.random() - 0.5).map(p => p.right)
  )[0]

  const handleSelect = (type: 'left' | 'right', index: number, value: string | number) => {
    if (matched.has(index)) return

    if (!selected) {
      setSelected({ type, index })
      sounds.playSelect()
    } else if (selected.type !== type) {
      // Check if match
      const leftIdx = type === 'left' ? index : selected.index
      const rightIdx = type === 'right' ? index : selected.index

      const leftValue = pairs[leftIdx].left
      const rightValue = shuffledRight[rightIdx]
      const expectedRight = pairs[leftIdx].right

      if (rightValue === expectedRight) {
        // Correct match!
        sounds.playCorrect()
        setMatched(prev => new Set([...prev, leftIdx, rightIdx + 100])) // +100 to differentiate
        setSelected(null)

        if (matched.size + 2 >= pairs.length * 2) {
          setTimeout(onComplete, 500)
        }
      } else {
        // Wrong match
        sounds.playGentleError()
        setWrongPair(index)
        setTimeout(() => {
          setWrongPair(null)
          setSelected(null)
        }, 500)
      }
    } else {
      // Same side, change selection
      setSelected({ type, index })
      sounds.playSelect()
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-200 to-pink-200 rounded-3xl p-6">
      <h3 className="text-2xl font-bold text-center mb-6">Match the pairs! 🎯</h3>

      <div className="flex justify-around">
        {/* Left column */}
        <div className="space-y-3">
          {pairs.map((pair, i) => (
            <motion.button
              key={`left-${i}`}
              className={`w-24 h-16 rounded-xl text-xl font-bold shadow-lg
                         ${matched.has(i) ? 'bg-green-300 opacity-50' : 'bg-white'}
                         ${selected?.type === 'left' && selected.index === i ? 'ring-4 ring-yellow-400' : ''}`}
              onClick={() => handleSelect('left', i, pair.left)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={matched.has(i)}
            >
              {pair.left}
            </motion.button>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {shuffledRight.map((value, i) => (
            <motion.button
              key={`right-${i}`}
              className={`w-24 h-16 rounded-xl text-xl font-bold shadow-lg
                         ${matched.has(i + 100) ? 'bg-green-300 opacity-50' : 'bg-white'}
                         ${selected?.type === 'right' && selected.index === i ? 'ring-4 ring-yellow-400' : ''}
                         ${wrongPair === i ? 'ring-4 ring-red-400' : ''}`}
              onClick={() => handleSelect('right', i, value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={matched.has(i + 100)}
            >
              {value}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// RACE GAME - Race your character by answering!
// ============================================
interface RaceProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
  playerEmoji: string
}

export function RaceGame({ question, correctAnswer, options, onCorrect, onWrong, playerEmoji }: RaceProps) {
  const [playerPosition, setPlayerPosition] = useState(10)
  const [opponentPosition, setOpponentPosition] = useState(10)
  const [isRacing, setIsRacing] = useState(true)
  const [winner, setWinner] = useState<'player' | 'opponent' | null>(null)

  // Opponent moves slowly
  useEffect(() => {
    if (!isRacing) return
    const interval = setInterval(() => {
      setOpponentPosition(prev => {
        if (prev >= 85) {
          setIsRacing(false)
          setWinner('opponent')
          return prev
        }
        return prev + 2
      })
    }, 500)
    return () => clearInterval(interval)
  }, [isRacing])

  const handleAnswer = (answer: number) => {
    if (!isRacing) return

    if (answer === correctAnswer) {
      sounds.playCorrect()
      setPlayerPosition(prev => {
        const newPos = prev + 25
        if (newPos >= 85) {
          setIsRacing(false)
          setWinner('player')
          setTimeout(onCorrect, 800)
        }
        return Math.min(newPos, 90)
      })
      if (playerPosition < 85) {
        onCorrect()
      }
    } else {
      sounds.playGentleError()
      onWrong()
    }
  }

  return (
    <div className="bg-gradient-to-r from-orange-200 to-yellow-200 rounded-3xl p-6 min-h-[400px]">
      {/* INSTRUCTION BANNER */}
      <motion.div
        className="bg-white/95 px-6 py-3 rounded-2xl shadow-xl mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <p className="text-2xl font-bold text-center">{question}</p>
        <p className="text-lg text-orange-600 text-center font-bold">
          ⚡ Pick fast to win! 🏆
        </p>
      </motion.div>

      {/* Race track */}
      <div className="relative h-32 bg-gradient-to-r from-green-400 to-green-500 rounded-2xl mb-6 overflow-hidden">
        {/* Track lines */}
        <div className="absolute inset-0 flex flex-col justify-around py-4">
          <div className="h-1 bg-white/30" />
          <div className="h-1 bg-white/30" />
        </div>

        {/* Finish line */}
        <div className="absolute right-4 top-0 bottom-0 w-4 bg-gradient-to-b from-white via-black to-white via-[length:10px_10px] bg-repeat-y" />

        {/* Player */}
        <motion.div
          className="absolute top-4 text-5xl"
          style={{ left: `${playerPosition}%` }}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          {playerEmoji}
        </motion.div>

        {/* Opponent */}
        <motion.div
          className="absolute bottom-4 text-5xl"
          style={{ left: `${opponentPosition}%` }}
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
        >
          🐢
        </motion.div>
      </div>

      {/* Winner announcement */}
      <AnimatePresence>
        {winner && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <span className="text-6xl">{winner === 'player' ? '🏆' : '😅'}</span>
              <h3 className="text-3xl font-bold mt-4">
                {winner === 'player' ? 'YOU WON!' : 'Try Again!'}
              </h3>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer options */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((answer, i) => (
          <motion.button
            key={i}
            className="bg-white rounded-2xl p-4 text-3xl font-bold shadow-lg"
            onClick={() => handleAnswer(answer)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!isRacing}
          >
            {answer}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// PUZZLE GAME - Drag pieces to complete!
// ============================================
interface PuzzleProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
  image: string
}

export function PuzzleGame({ question, correctAnswer, options, onCorrect, onWrong, image }: PuzzleProps) {
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const handleSelect = (answer: number) => {
    setSelectedPiece(answer)

    if (answer === correctAnswer) {
      sounds.playCorrect()
      sounds.playLevelUp()
      setIsComplete(true)
      setTimeout(onCorrect, 1000)
    } else {
      sounds.playGentleError()
      setTimeout(() => setSelectedPiece(null), 500)
      onWrong()
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-200 to-cyan-200 rounded-3xl p-6">
      {/* INSTRUCTION BANNER */}
      <motion.div
        className="bg-white/95 px-6 py-3 rounded-2xl shadow-xl mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <p className="text-2xl font-bold text-center">{question}</p>
        <p className="text-lg text-cyan-600 text-center font-bold">
          🧩 Find the missing piece! 👆
        </p>
      </motion.div>

      {/* Puzzle area */}
      <div className="flex justify-center mb-6">
        <motion.div
          className="relative bg-white rounded-2xl p-8 shadow-xl"
          animate={isComplete ? { scale: [1, 1.1, 1] } : {}}
        >
          <span className="text-8xl">{image}</span>

          {/* Missing piece slot */}
          <motion.div
            className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-xl border-4 border-dashed
                       flex items-center justify-center text-2xl font-bold
                       ${isComplete ? 'bg-green-200 border-green-400' : 'bg-yellow-100 border-yellow-400'}`}
            animate={!isComplete ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {isComplete ? correctAnswer : '?'}
          </motion.div>
        </motion.div>
      </div>

      {/* Puzzle pieces (answers) */}
      <div className="flex justify-center gap-4 flex-wrap">
        {options.map((answer, i) => (
          <motion.button
            key={i}
            className={`w-16 h-16 rounded-xl text-2xl font-bold shadow-lg
                       ${selectedPiece === answer && answer === correctAnswer ? 'bg-green-300' : ''}
                       ${selectedPiece === answer && answer !== correctAnswer ? 'bg-red-300' : ''}
                       ${selectedPiece !== answer ? 'bg-white' : ''}`}
            onClick={() => handleSelect(answer)}
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            disabled={isComplete}
          >
            {answer}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// BOUNCING BALL CATCHER - Catch the bouncing answer!
// ============================================
interface BouncingBallProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
  emoji: string
}

export function BouncingBallGame({ question, correctAnswer, options, onCorrect, onWrong, emoji }: BouncingBallProps) {
  const [balls, setBalls] = useState<Array<{
    id: number
    answer: number
    x: number
    y: number
    vx: number
    vy: number
    caught: boolean
    color: string
  }>>([])

  const COLORS = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400']

  // Initialize bouncing balls
  useEffect(() => {
    const newBalls = options.map((answer, i) => ({
      id: i,
      answer,
      x: 20 + i * 18,
      y: 30 + Math.random() * 20,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      caught: false,
      color: COLORS[i % COLORS.length]
    }))
    setBalls(newBalls)
  }, [options])

  // Animate bouncing
  useEffect(() => {
    const interval = setInterval(() => {
      setBalls(prev => prev.map(ball => {
        if (ball.caught) return ball

        let newX = ball.x + ball.vx
        let newY = ball.y + ball.vy
        let newVx = ball.vx
        let newVy = ball.vy

        // Bounce off walls
        if (newX < 5 || newX > 75) newVx = -newVx * 0.95
        if (newY < 18 || newY > 70) newVy = -newVy * 0.95

        // Keep in bounds
        newX = Math.max(5, Math.min(75, newX))
        newY = Math.max(18, Math.min(70, newY))

        return { ...ball, x: newX, y: newY, vx: newVx, vy: newVy }
      }))
    }, 50)

    return () => clearInterval(interval)
  }, [])

  const handleCatch = (ball: typeof balls[0]) => {
    if (ball.caught) return

    setBalls(prev => prev.map(b =>
      b.id === ball.id ? { ...b, caught: true } : b
    ))

    if (ball.answer === correctAnswer) {
      sounds.playCorrect()
      sounds.playCoinCollect()
      setTimeout(onCorrect, 600)
    } else {
      sounds.playGentleError()
      setTimeout(() => {
        setBalls(prev => prev.map(b =>
          b.id === ball.id ? { ...b, caught: false } : b
        ))
      }, 400)
      onWrong()
    }
  }

  return (
    <div className="relative h-[400px] bg-gradient-to-b from-indigo-400 to-purple-600 rounded-3xl overflow-hidden">
      {/* INSTRUCTION BANNER */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 px-6 py-3 rounded-2xl shadow-xl z-10"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
      >
        <p className="text-2xl font-bold text-center">{question}</p>
        <p className="text-lg text-purple-600 text-center font-bold">
          👆 Catch the right ball! 🎾
        </p>
      </motion.div>

      {/* Bouncing balls */}
      {balls.map((ball) => (
        <motion.button
          key={ball.id}
          className={`absolute w-16 h-16 rounded-full flex items-center justify-center
                      text-2xl font-bold text-white shadow-xl cursor-pointer
                      ${ball.caught ? 'opacity-30 scale-50' : ball.color}`}
          style={{
            left: `${ball.x}%`,
            top: `${ball.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={() => handleCatch(ball)}
          animate={ball.caught ? {} : { scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          whileHover={{ scale: 1.3 }}
          whileTap={{ scale: 0.7 }}
        >
          {ball.answer}
        </motion.button>
      ))}

      {/* Decorative */}
      <motion.span
        className="absolute bottom-4 right-4 text-6xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      >
        {emoji}
      </motion.span>
    </div>
  )
}

// ============================================
// SHUFFLE & FIND - Cards shuffle, find the answer!
// ============================================
interface ShuffleProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
}

export function ShuffleGame({ question, correctAnswer, options, onCorrect, onWrong }: ShuffleProps) {
  const [cards, setCards] = useState<Array<{ id: number; answer: number; x: number; flipped: boolean }>>([])
  const [isShuffling, setIsShuffling] = useState(true)
  const [revealed, setRevealed] = useState(false)

  // Initialize cards
  useEffect(() => {
    const initialCards = options.map((answer, i) => ({
      id: i,
      answer,
      x: i * 22 + 12,
      flipped: false
    }))
    setCards(initialCards)

    // Show answers first
    setRevealed(true)

    // Start shuffling after 2 seconds
    const revealTimeout = setTimeout(() => {
      setRevealed(false)
      startShuffle()
    }, 2000)

    return () => clearTimeout(revealTimeout)
  }, [options])

  const startShuffle = () => {
    setIsShuffling(true)
    let shuffleCount = 0
    const maxShuffles = 8

    const shuffleInterval = setInterval(() => {
      setCards(prev => {
        const shuffled = [...prev]
        const i = Math.floor(Math.random() * shuffled.length)
        const j = Math.floor(Math.random() * shuffled.length)
        // Swap positions
        const tempX = shuffled[i].x
        shuffled[i] = { ...shuffled[i], x: shuffled[j].x }
        shuffled[j] = { ...shuffled[j], x: tempX }
        return shuffled
      })

      sounds.playWhoosh()
      shuffleCount++

      if (shuffleCount >= maxShuffles) {
        clearInterval(shuffleInterval)
        setIsShuffling(false)
      }
    }, 400)
  }

  const handleCardClick = (card: typeof cards[0]) => {
    if (isShuffling || card.flipped) return

    setCards(prev => prev.map(c =>
      c.id === card.id ? { ...c, flipped: true } : c
    ))

    if (card.answer === correctAnswer) {
      sounds.playCorrect()
      sounds.playMagicWand()
      setTimeout(onCorrect, 800)
    } else {
      sounds.playGentleError()
      setTimeout(() => {
        setCards(prev => prev.map(c =>
          c.id === card.id ? { ...c, flipped: false } : c
        ))
      }, 600)
      onWrong()
    }
  }

  return (
    <div className="bg-gradient-to-br from-amber-300 to-orange-400 rounded-3xl p-6 min-h-[400px]">
      {/* INSTRUCTION BANNER */}
      <motion.div
        className="bg-white/95 px-6 py-3 rounded-2xl shadow-xl mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <p className="text-2xl font-bold text-center">{question}</p>
        <p className="text-lg text-amber-600 text-center font-bold">
          {isShuffling ? '🔀 Watch carefully!' : revealed ? '👀 Remember where!' : '👆 Tap the right cup!'}
        </p>
      </motion.div>

      {/* Cards */}
      <div className="relative h-48 mb-6">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            className={`absolute w-20 h-28 rounded-xl shadow-xl cursor-pointer
                       flex items-center justify-center text-3xl font-bold
                       ${card.flipped || revealed ? 'bg-white' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}
            style={{ top: '50%', transform: 'translateY(-50%)' }}
            animate={{ left: `${card.x}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => handleCardClick(card)}
            whileHover={!isShuffling ? { scale: 1.1, y: -10 } : {}}
            whileTap={!isShuffling ? { scale: 0.95 } : {}}
            disabled={isShuffling}
          >
            {(card.flipped || revealed) ? card.answer : '❓'}
          </motion.button>
        ))}
      </div>

      <motion.div
        className="text-center text-white text-lg font-medium"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isShuffling ? 'Watch carefully!' : 'Click the right card!'}
      </motion.div>
    </div>
  )
}

// ============================================
// WHACK-A-MOLE - Hit the mole with correct answer!
// ============================================
interface WhackMoleProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
}

export function WhackMoleGame({ question, correctAnswer, options, onCorrect, onWrong }: WhackMoleProps) {
  const [holes, setHoles] = useState<Array<{ id: number; answer: number | null; isUp: boolean; whacked: boolean }>>([])
  const [gameWon, setGameWon] = useState(false)
  const [hammerPos, setHammerPos] = useState({ x: 50, y: 50 })
  const [showSplat, setShowSplat] = useState<number | null>(null)

  // Initialize holes
  useEffect(() => {
    const initialHoles = Array(6).fill(null).map((_, i) => ({
      id: i,
      answer: null,
      isUp: false,
      whacked: false
    }))
    setHoles(initialHoles)
  }, [])

  // Mole popup logic - faster and more engaging!
  useEffect(() => {
    if (gameWon) return

    const popInterval = setInterval(() => {
      setHoles(prev => {
        const newHoles = prev.map(h => ({ ...h, isUp: false, answer: null as number | null, whacked: false }))
        const numMoles = 2 + Math.floor(Math.random() * 2) // 2-3 moles
        const availableHoles = [...Array(6).keys()]
        const selectedOptions = [...options].sort(() => Math.random() - 0.5).slice(0, numMoles)

        for (let i = 0; i < numMoles && availableHoles.length > 0; i++) {
          const holeIdx = availableHoles.splice(Math.floor(Math.random() * availableHoles.length), 1)[0]
          const answerValue: number | null = selectedOptions[i] !== undefined ? selectedOptions[i] : null
          newHoles[holeIdx] = { ...newHoles[holeIdx], answer: answerValue, isUp: true }
        }
        return newHoles
      })
    }, 1000) // Faster for more excitement!

    return () => clearInterval(popInterval)
  }, [options, gameWon])

  const handleWhack = (hole: typeof holes[0]) => {
    if (!hole.isUp || hole.answer === null || gameWon) return

    // Visual whack effect
    setShowSplat(hole.id)
    setHoles(prev => prev.map(h => h.id === hole.id ? { ...h, whacked: true } : h))

    if (hole.answer === correctAnswer) {
      sounds.playCorrect()
      sounds.playBoing()
      setGameWon(true)
      setTimeout(onCorrect, 1200)
    } else {
      sounds.playGentleError()
      setTimeout(() => setShowSplat(null), 400)
      onWrong()
    }
  }

  return (
    <div className="relative bg-gradient-to-b from-green-300 via-green-400 to-green-600 rounded-3xl p-6 min-h-[420px] overflow-hidden">
      {/* Decorative clouds */}
      <motion.div
        className="absolute top-2 left-4 text-4xl opacity-80"
        animate={{ x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      >☁️</motion.div>
      <motion.div
        className="absolute top-6 right-8 text-3xl opacity-70"
        animate={{ x: [0, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      >☁️</motion.div>

      {/* Sun */}
      <motion.div
        className="absolute top-2 right-2 text-5xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >🌞</motion.div>

      {/* INSTRUCTION BANNER */}
      <motion.div
        className="bg-gradient-to-r from-yellow-200 to-orange-200 px-6 py-4 rounded-2xl shadow-xl mb-4 border-4 border-yellow-400"
        initial={{ scale: 0, rotate: -5 }}
        animate={{ scale: 1, rotate: 0 }}
      >
        <p className="text-2xl font-black text-center text-gray-800">{question}</p>
        <p className="text-xl text-green-700 text-center font-bold">
          👆 Whack the right number! 🔨
        </p>
      </motion.div>

      {/* Mole grid with better visuals */}
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-4">
        {holes.map((hole) => (
          <motion.button
            key={hole.id}
            className="relative h-28 rounded-b-full bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 border-4 border-amber-600 overflow-hidden shadow-lg"
            onClick={() => handleWhack(hole)}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
          >
            {/* Splat effect when whacked */}
            {showSplat === hole.id && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center z-20"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
              >
                <span className="text-5xl">💥</span>
              </motion.div>
            )}

            {/* Mole */}
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 flex flex-col items-center"
              animate={{ y: hole.isUp ? (hole.whacked ? 60 : 0) : 80 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <motion.div
                className="text-5xl"
                animate={hole.isUp && !hole.whacked ? { rotate: [-5, 5, -5] } : {}}
                transition={{ duration: 0.3, repeat: Infinity }}
              >
                {hole.whacked ? '😵' : '🐹'}
              </motion.div>
              {hole.answer !== null && !hole.whacked && (
                <motion.div
                  className="bg-yellow-300 border-4 border-yellow-500 rounded-xl px-4 py-2 text-2xl font-black text-gray-800 shadow-xl -mt-1"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {hole.answer}
                </motion.div>
              )}
            </motion.div>

            {/* Grass at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-green-600 to-green-500 rounded-b-full" />
          </motion.button>
        ))}
      </div>

      {/* Animated hammer */}
      <motion.div
        className="text-center text-6xl"
        animate={{ rotate: [-15, 15, -15], y: [0, -10, 0] }}
        transition={{ duration: 0.4, repeat: Infinity }}
      >
        🔨
      </motion.div>

      {/* Win celebration */}
      <AnimatePresence>
        {gameWon && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 rounded-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-gradient-to-br from-yellow-300 to-orange-400 rounded-3xl p-8 shadow-2xl border-4 border-yellow-500"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
            >
              <p className="text-4xl font-black text-center mb-2">🎯 GOT IT! 🎯</p>
              <p className="text-2xl font-bold text-center">⭐ You're a ROCKSTAR! ⭐</p>
            </motion.div>

            {/* Confetti */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-3xl"
                style={{ left: `${10 + Math.random() * 80}%`, top: '20%' }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: 300, opacity: 0, rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
                transition={{ duration: 1.5, delay: i * 0.08 }}
              >
                {['🌟', '⭐', '✨', '🎉', '🎊'][i % 5]}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// BALLOON POP ORDER - Pop balloons in ascending order!
// ============================================
interface BalloonOrderProps {
  numbers: number[]
  onComplete: () => void
  onWrong: () => void
}

export function BalloonOrderGame({ numbers, onComplete, onWrong }: BalloonOrderProps) {
  const [balloons, setBalloons] = useState<Array<{ id: number; number: number; x: number; y: number; popped: boolean }>>([])
  const [nextExpected, setNextExpected] = useState(0)
  const [wrongPop, setWrongPop] = useState<number | null>(null)

  useEffect(() => {
    const newBalloons = numbers.map((num, i) => ({
      id: i,
      number: num,
      x: 10 + (i % 4) * 22 + Math.random() * 8,
      y: 20 + Math.floor(i / 4) * 25 + Math.random() * 10,
      popped: false
    })).sort(() => Math.random() - 0.5)
    setBalloons(newBalloons)
  }, [numbers])

  const handlePop = (balloon: typeof balloons[0]) => {
    if (balloon.popped) return
    const sortedNumbers = [...numbers].sort((a, b) => a - b)

    if (balloon.number === sortedNumbers[nextExpected]) {
      sounds.playPop()
      sounds.playSuccessChime()
      setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, popped: true } : b))
      setNextExpected(prev => prev + 1)

      if (nextExpected + 1 >= numbers.length) {
        sounds.playCelebration()
        setTimeout(onComplete, 500)
      }
    } else {
      sounds.playGentleError()
      setWrongPop(balloon.id)
      setTimeout(() => setWrongPop(null), 500)
      onWrong()
    }
  }

  const sortedNumbers = [...numbers].sort((a, b) => a - b)

  return (
    <div className="relative bg-gradient-to-b from-sky-400 to-sky-200 rounded-3xl p-6 min-h-[400px] overflow-hidden">
      {/* INSTRUCTION BANNER with visual hint */}
      <motion.div className="bg-white/95 px-6 py-3 rounded-2xl shadow-xl mb-2 text-center" initial={{ y: -50 }} animate={{ y: 0 }}>
        <p className="text-2xl font-bold text-sky-700">1️⃣2️⃣3️⃣ Pop smallest to biggest!</p>
        <p className="text-lg text-purple-600 font-bold">
          Next: <span className="text-3xl font-bold">{sortedNumbers[nextExpected] ?? '✓'}</span>
        </p>
      </motion.div>

      {/* Visual hint showing the concept */}
      <motion.div
        className="bg-yellow-100 border-2 border-yellow-400 px-4 py-2 rounded-xl mb-2 text-center mx-auto max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-lg font-bold text-yellow-800">Small → Big: </span>
        <span className="text-xl font-black text-purple-700">{sortedNumbers.join(' → ')}</span>
      </motion.div>

      {balloons.map((balloon) => (
        <motion.button
          key={balloon.id}
          className={`absolute flex flex-col items-center cursor-pointer ${balloon.popped ? 'pointer-events-none' : ''}`}
          style={{ left: `${balloon.x}%`, top: `${balloon.y}%` }}
          onClick={() => handlePop(balloon)}
          animate={balloon.popped ? { scale: 0, opacity: 0, y: -100 } : { y: [0, -8, 0], x: [0, 3, -3, 0] }}
          transition={balloon.popped ? { duration: 0.3 } : { duration: 2 + balloon.id * 0.2, repeat: Infinity }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
        >
          <span className={`text-6xl ${wrongPop === balloon.id ? 'animate-shake' : ''}`}>🎈</span>
          <span className={`-mt-10 bg-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold shadow-lg ${wrongPop === balloon.id ? 'ring-4 ring-red-400' : ''}`}>
            {balloon.number}
          </span>
        </motion.button>
      ))}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {numbers.map((_, i) => (
          <motion.div key={i} className={`w-4 h-4 rounded-full ${i < nextExpected ? 'bg-green-400' : 'bg-white/50'}`} animate={i < nextExpected ? { scale: [1, 1.3, 1] } : {}} />
        ))}
      </div>
    </div>
  )
}

// ============================================
// MEMORY FLIP - Classic memory card game!
// ============================================
interface MemoryFlipProps {
  pairs: Array<{ emoji: string; value: number }>
  onComplete: () => void
}

export function MemoryFlipGame({ pairs, onComplete }: MemoryFlipProps) {
  const [cards, setCards] = useState<Array<{ id: number; content: string; type: 'emoji' | 'number'; pairId: number; flipped: boolean; matched: boolean }>>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [canFlip, setCanFlip] = useState(true)
  const [moves, setMoves] = useState(0)

  useEffect(() => {
    const allCards: typeof cards = []
    // Create MEANINGFUL pairs: show N emojis that match with number N
    // Example: 🍎🍎🍎 matches with 3 (count the apples!)
    // CRITICAL: Only use values 1-5 for visual counting to work properly!
    pairs.forEach((pair, i) => {
      // Cap the value at 5 for visual counting - this is the actual counting value
      const countableValue = Math.min(pair.value, 5)
      const visualEmojis = pair.emoji.repeat(countableValue)

      allCards.push({ id: i * 2, content: visualEmojis, type: 'emoji', pairId: i, flipped: false, matched: false })
      // IMPORTANT: The number must match what kids can COUNT, not the original value!
      allCards.push({ id: i * 2 + 1, content: String(countableValue), type: 'number', pairId: i, flipped: false, matched: false })
    })
    setCards(allCards.sort(() => Math.random() - 0.5))
  }, [pairs])

  const handleCardClick = (cardId: number) => {
    if (!canFlip) return
    const card = cards.find(c => c.id === cardId)
    if (!card || card.flipped || card.matched) return

    sounds.playSelect()
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, flipped: true } : c))
    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)

    if (newFlipped.length === 2) {
      setCanFlip(false)
      setMoves(prev => prev + 1)
      const [first, second] = newFlipped.map(id => cards.find(c => c.id === id)!)

      if (first.pairId === second.pairId) {
        sounds.playCorrect()
        setCards(prev => {
          const newCards = prev.map(c => c.pairId === first.pairId ? { ...c, matched: true } : c)
          // Check if ALL cards are now matched
          const allMatched = newCards.every(c => c.matched)
          if (allMatched) {
            sounds.playCelebration()
            setTimeout(onComplete, 500)
          }
          return newCards
        })
        setFlippedCards([])
        setCanFlip(true)
      } else {
        sounds.playGentleError()
        setTimeout(() => {
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c))
          setFlippedCards([])
          setCanFlip(true)
        }, 1000)
      }
    }
  }

  return (
    <div className="bg-gradient-to-br from-pink-300 to-purple-400 rounded-3xl p-6">
      {/* INSTRUCTION BANNER with visual example */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-white">🎴 Match the Cards! 🎴</h3>
        <div className="bg-white/90 rounded-xl p-2 mt-2 inline-block">
          <p className="text-lg text-purple-700 font-bold">
            Count the items! 🍎🍎🍎 = 3️⃣
          </p>
        </div>
        <p className="text-white font-bold mt-2">Moves: {moves}</p>
      </div>

      <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            className={`aspect-square rounded-xl shadow-lg cursor-pointer flex items-center justify-center
                       ${card.matched ? 'bg-green-300 opacity-60' : card.flipped ? 'bg-white' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}
            onClick={() => handleCardClick(card.id)}
            whileHover={!card.flipped && !card.matched ? { scale: 1.05 } : {}}
            whileTap={!card.flipped && !card.matched ? { scale: 0.95 } : {}}
          >
            {(card.flipped || card.matched) ? (
              <span className={card.type === 'emoji' ? 'text-xl leading-tight' : 'text-3xl font-bold'}>
                {card.content}
              </span>
            ) : (
              <span className="text-3xl text-white">❓</span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// FISHING GAME - Catch the fish with correct answer!
// ============================================
interface FishingProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
  emoji: string
}

const FISH_TYPES = ['🐟', '🐠', '🐡', '🦈', '🐬', '🐳', '🦑', '🐙']

export function FishingGame({ question, correctAnswer, options, onCorrect, onWrong }: FishingProps) {
  const [fish, setFish] = useState<Array<{ id: number; answer: number; x: number; y: number; caught: boolean; type: string }>>([])
  const [hookY, setHookY] = useState(15)
  const [isCatching, setIsCatching] = useState(false)

  useEffect(() => {
    const newFish = options.map((answer, i) => ({
      id: i,
      answer,
      x: 15 + i * 22,
      y: 50 + Math.random() * 30,
      caught: false,
      type: FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)]
    }))
    setFish(newFish)
  }, [options])

  // Fish swimming animation - SLOW for kids to catch easily!
  useEffect(() => {
    const swimInterval = setInterval(() => {
      setFish(prev => prev.map(f => ({
        ...f,
        // Much slower movement: 0.08 instead of 0.3 (almost 4x slower)
        x: f.caught ? f.x : ((f.x + 0.08) % 85) + 5,
        // Gentler bobbing motion
        y: f.caught ? f.y : 50 + Math.sin(Date.now() / 1500 + f.id) * 10
      })))
    }, 80) // Slower interval too
    return () => clearInterval(swimInterval)
  }, [])

  const handleCatch = (fishItem: typeof fish[0]) => {
    if (fishItem.caught || isCatching) return

    setIsCatching(true)
    setFish(prev => prev.map(f => f.id === fishItem.id ? { ...f, caught: true } : f))

    if (fishItem.answer === correctAnswer) {
      sounds.playCorrect()
      sounds.playCelebration()
      setTimeout(onCorrect, 800)
    } else {
      sounds.playGentleError()
      setTimeout(() => {
        setFish(prev => prev.map(f => f.id === fishItem.id ? { ...f, caught: false } : f))
        setIsCatching(false)
      }, 600)
      onWrong()
    }
  }

  return (
    <div className="relative h-[420px] rounded-3xl overflow-hidden">
      {/* Sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-400 to-blue-500" />

      {/* Water surface */}
      <div className="absolute top-[35%] left-0 right-0 bottom-0 bg-gradient-to-b from-blue-400 to-blue-700" />

      {/* INSTRUCTION BANNER */}
      <motion.div
        className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 px-5 py-2 rounded-2xl shadow-xl z-10"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
      >
        <p className="text-xl font-bold text-center">{question}</p>
        <p className="text-base text-blue-600 text-center font-bold">
          🎣 Catch the right fish! 👆
        </p>
      </motion.div>

      {/* Fishing rod */}
      <motion.div className="absolute top-8 left-[15%] z-20">
        <div className="text-4xl">🎣</div>
        <div className="absolute top-8 left-4 w-0.5 h-20 bg-gray-600" />
      </motion.div>

      {/* Boat */}
      <motion.div
        className="absolute top-[28%] left-[10%] text-5xl"
        animate={{ y: [0, -3, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🚤
      </motion.div>

      {/* Swimming fish - BIG and easy to tap! */}
      {fish.map((fishItem) => (
        <motion.button
          key={fishItem.id}
          className={`absolute cursor-pointer transition-transform ${fishItem.caught ? 'opacity-30' : ''}`}
          style={{ left: `${fishItem.x}%`, top: `${fishItem.y}%` }}
          onClick={() => handleCatch(fishItem)}
          animate={fishItem.caught ? { y: -100, opacity: 0 } : { scaleX: fishItem.x > 50 ? -1 : 1 }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="flex flex-col items-center">
            {/* Bigger fish emoji */}
            <span className="text-6xl">{fishItem.type}</span>
            {/* Much bigger, clearer number badge */}
            <span className="bg-yellow-300 border-4 border-yellow-500 rounded-xl px-4 py-2 text-2xl font-black text-gray-800 shadow-xl -mt-3">
              {fishItem.answer}
            </span>
          </div>
        </motion.button>
      ))}

      {/* Bubbles decoration */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`bubble-${i}`}
          className="absolute text-2xl opacity-60"
          style={{ left: `${10 + i * 12}%`, bottom: '5%' }}
          animate={{ y: [-20, -150], opacity: [0.6, 0] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        >
          🫧
        </motion.div>
      ))}
    </div>
  )
}

// ============================================
// ROCKET LAUNCH - Launch rocket with correct answer!
// ============================================
interface RocketLaunchProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
}

export function RocketLaunchGame({ question, correctAnswer, options, onCorrect, onWrong }: RocketLaunchProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [launched, setLaunched] = useState(false)
  const [wrongAnswer, setWrongAnswer] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

  const handleLaunch = (answer: number) => {
    if (launched || countdown !== null) return
    setSelectedAnswer(answer)

    if (answer === correctAnswer) {
      // Start countdown!
      setCountdown(3)
      sounds.playSelect()

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval)
            setLaunched(true)
            sounds.playCorrect()
            sounds.playCelebration()
            setTimeout(onCorrect, 1500)
            return null
          }
          sounds.playBoing()
          return prev - 1
        })
      }, 800)
    } else {
      setWrongAnswer(true)
      sounds.playGentleError()
      setTimeout(() => {
        setWrongAnswer(false)
        setSelectedAnswer(null)
      }, 800)
      onWrong()
    }
  }

  return (
    <div className="relative h-[420px] bg-gradient-to-b from-indigo-900 via-purple-900 to-black rounded-3xl overflow-hidden">
      {/* Stars background */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute text-white"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${8 + Math.random() * 12}px`
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        >
          ✦
        </motion.div>
      ))}

      {/* INSTRUCTION BANNER */}
      <motion.div
        className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 px-5 py-2 rounded-2xl shadow-xl z-10"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
      >
        <p className="text-xl font-bold text-center">{question}</p>
        <p className="text-base text-purple-600 text-center font-bold">
          🚀 Launch to the right planet! 👆
        </p>
      </motion.div>

      {/* Countdown display */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 text-8xl font-black text-yellow-400 z-20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            key={countdown}
          >
            {countdown}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rocket */}
      <motion.div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 text-8xl z-10"
        animate={launched ? { y: -600, scale: 0.5 } : wrongAnswer ? { x: [-10, 10, -10, 10, 0] } : { y: [0, -5, 0] }}
        transition={launched ? { duration: 1.5, ease: 'easeIn' } : { duration: 2, repeat: Infinity }}
      >
        🚀
        {/* Fire trail when launching */}
        {(countdown !== null || launched) && (
          <motion.div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-5xl"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 0.2, repeat: Infinity }}
          >
            🔥
          </motion.div>
        )}
      </motion.div>

      {/* Launch pad */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-4 bg-gray-600 rounded-full" />

      {/* Answer buttons */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
        {options.map((answer, i) => (
          <motion.button
            key={i}
            className={`bg-gradient-to-b from-purple-500 to-purple-700 text-white rounded-xl px-5 py-3 text-2xl font-bold shadow-lg border-2 border-purple-400
                       ${selectedAnswer === answer && answer === correctAnswer ? 'ring-4 ring-green-400' : ''}
                       ${selectedAnswer === answer && answer !== correctAnswer ? 'ring-4 ring-red-400 animate-shake' : ''}`}
            onClick={() => handleLaunch(answer)}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            disabled={launched || countdown !== null}
          >
            {answer}
          </motion.button>
        ))}
      </div>

      {/* Launch success message */}
      <AnimatePresence>
        {launched && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 rounded-3xl px-8 py-4 z-30"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, -5, 5, 0] }}
          >
            <p className="text-3xl font-black text-center">BLAST OFF! 🎉</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// TREASURE HUNT - Open chests to find the answer!
// ============================================
interface TreasureHuntProps {
  question: string
  correctAnswer: number
  options: number[]
  onCorrect: () => void
  onWrong: () => void
}

export function TreasureHuntGame({ question, correctAnswer, options, onCorrect, onWrong }: TreasureHuntProps) {
  const [chests, setChests] = useState<Array<{ id: number; answer: number; opened: boolean; isCorrect: boolean | null }>>([])
  const [found, setFound] = useState(false)

  useEffect(() => {
    const newChests = options.map((answer, i) => ({
      id: i,
      answer,
      opened: false,
      isCorrect: null as boolean | null
    }))
    setChests(newChests.sort(() => Math.random() - 0.5))
  }, [options])

  const handleOpenChest = (chest: typeof chests[0]) => {
    if (chest.opened || found) return

    const isCorrect = chest.answer === correctAnswer
    setChests(prev => prev.map(c =>
      c.id === chest.id ? { ...c, opened: true, isCorrect } : c
    ))

    if (isCorrect) {
      sounds.playCorrect()
      sounds.playCoinCollect()
      setFound(true)
      setTimeout(onCorrect, 1200)
    } else {
      sounds.playGentleError()
      setTimeout(() => {
        setChests(prev => prev.map(c =>
          c.id === chest.id ? { ...c, opened: false, isCorrect: null } : c
        ))
      }, 800)
      onWrong()
    }
  }

  return (
    <div className="relative h-[420px] bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 rounded-3xl overflow-hidden">
      {/* Sand dunes background */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-600 to-transparent" />

      {/* Palm trees */}
      <motion.div
        className="absolute bottom-20 left-4 text-6xl"
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        🌴
      </motion.div>
      <motion.div
        className="absolute bottom-24 right-6 text-5xl"
        animate={{ rotate: [3, -3, 3] }}
        transition={{ duration: 3.5, repeat: Infinity }}
      >
        🌴
      </motion.div>

      {/* INSTRUCTION BANNER */}
      <motion.div
        className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/95 px-5 py-2 rounded-2xl shadow-xl z-10"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
      >
        <p className="text-xl font-bold text-center">{question}</p>
        <p className="text-base text-amber-600 text-center font-bold">
          ⛏️ Dig up the treasure! 👆
        </p>
      </motion.div>

      {/* Pirate character */}
      <motion.div
        className="absolute top-20 left-1/2 -translate-x-1/2 text-7xl"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🏴‍☠️
      </motion.div>

      {/* Treasure chests */}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-6 px-4">
        {chests.map((chest, i) => (
          <motion.button
            key={chest.id}
            className="relative"
            onClick={() => handleOpenChest(chest)}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.15, type: 'spring' }}
            whileHover={!chest.opened ? { scale: 1.15, y: -10 } : {}}
            whileTap={!chest.opened ? { scale: 0.9 } : {}}
            disabled={found}
          >
            {/* Chest */}
            <motion.div
              className="text-6xl"
              animate={chest.opened && chest.isCorrect ? { rotate: [0, -10, 10, 0] } : {}}
            >
              {chest.opened ? (chest.isCorrect ? '👑' : '💨') : '📦'}
            </motion.div>

            {/* Answer badge */}
            <motion.div
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xl font-black shadow-lg
                         ${chest.opened && chest.isCorrect ? 'bg-yellow-400 border-4 border-yellow-500' : ''}
                         ${chest.opened && !chest.isCorrect ? 'bg-red-300 border-4 border-red-400' : ''}
                         ${!chest.opened ? 'bg-white border-4 border-amber-400' : ''}`}
              animate={chest.opened && chest.isCorrect ? { scale: [1, 1.3, 1] } : {}}
              transition={{ repeat: chest.isCorrect ? Infinity : 0, duration: 0.5 }}
            >
              {chest.answer}
            </motion.div>

            {/* Sparkles when correct */}
            {chest.opened && chest.isCorrect && (
              <>
                <motion.div
                  className="absolute -top-4 left-0 text-2xl"
                  animate={{ y: [-10, -30], opacity: [1, 0], rotate: -30 }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ✨
                </motion.div>
                <motion.div
                  className="absolute -top-4 right-0 text-2xl"
                  animate={{ y: [-10, -30], opacity: [1, 0], rotate: 30 }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                >
                  💎
                </motion.div>
              </>
            )}
          </motion.button>
        ))}
      </div>

      {/* Found treasure message */}
      <AnimatePresence>
        {found && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 rounded-3xl px-8 py-4 z-30 shadow-2xl"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
          >
            <p className="text-3xl font-black text-center">TREASURE FOUND! 💰</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coins decoration */}
      {found && [...Array(10)].map((_, i) => (
        <motion.div
          key={`coin-${i}`}
          className="absolute text-3xl"
          style={{ left: `${20 + Math.random() * 60}%`, top: '40%' }}
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: 200, opacity: 0, rotate: 360 }}
          transition={{ duration: 1 + Math.random(), delay: i * 0.1 }}
        >
          🪙
        </motion.div>
      ))}
    </div>
  )
}
