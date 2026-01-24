'use client'

/**
 * ENHANCED GAME EXAMPLE
 *
 * This component demonstrates all the new sound, animation, and visual enhancements
 * for the MathQuest Worlds game. Use this as a reference for implementing
 * enhanced gameplay across all game modes.
 *
 * NEW FEATURES DEMONSTRATED:
 * 1. Enhanced sound effects (combos, milestones, tap variations)
 * 2. Animated answer buttons with particle effects
 * 3. Number count animations
 * 4. Combo meter and streak tracking
 * 5. Floating text feedback
 * 6. Enhanced celebrations
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { AnimatedAnswer, AnimatedNumber, AnimatedProblem } from './AnimatedAnswer'
import { AnimatedButton, WorldButton } from './AnimatedButton'
import {
  ConfettiBurst,
  StarBurst,
  FloatingText,
  RippleEffect,
  ComboMeter,
  AchievementPopup
} from './ParticleEffects'
import { useGameEffects } from '@/lib/hooks/useGameEffects'

interface EnhancedGameExampleProps {
  worldId: string
  worldColors: {
    primary: string
    secondary: string
  }
}

export function EnhancedGameExample({ worldId, worldColors }: EnhancedGameExampleProps) {
  // Game state
  const [problem, setProblem] = useState({ question: '3 + 2', answer: 5 })
  const [answers, setAnswers] = useState([3, 5, 7, 4])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [problemCount, setProblemCount] = useState(0)

  // Effects and animations
  const {
    effects,
    combo,
    playCorrectAnswer,
    playWrongAnswer,
    playTap,
    resetCombo,
    playProblemComplete,
    playWorldAmbient
  } = useGameEffects()

  const [showAchievement, setShowAchievement] = useState(false)
  const [achievementData, setAchievementData] = useState({ title: '', emoji: '' })

  // Play ambient sounds periodically
  useEffect(() => {
    const ambientInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        playWorldAmbient(worldId)
      }
    }, 8000)

    return () => clearInterval(ambientInterval)
  }, [worldId, playWorldAmbient])

  // Generate new problem
  const generateNewProblem = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    const correctAnswer = num1 + num2

    // Generate wrong answers
    const wrongAnswers: number[] = []
    while (wrongAnswers.length < 3) {
      const wrong = Math.floor(Math.random() * 20) + 1
      if (wrong !== correctAnswer && !wrongAnswers.includes(wrong)) {
        wrongAnswers.push(wrong)
      }
    }

    // Shuffle answers
    const allAnswers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)

    setProblem({ question: `${num1} + ${num2}`, answer: correctAnswer })
    setAnswers(allAnswers)
    setSelectedAnswer(null)
    setIsCorrect(null)
    resetCombo()

    // Play number reveal sound
    sounds.playNumberReveal()
  }

  // Handle answer selection
  const handleAnswerSelect = (answer: number, event: React.MouseEvent) => {
    if (selectedAnswer !== null) return

    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    setSelectedAnswer(answer)
    const correct = answer === problem.answer
    setIsCorrect(correct)

    if (correct) {
      // Correct answer!
      playCorrectAnswer(x, y)
      setScore((prev) => prev + 10)

      // Move to next problem after delay
      setTimeout(() => {
        const newCount = problemCount + 1
        setProblemCount(newCount)
        playProblemComplete(newCount)

        // Show achievement at milestones
        if (newCount === 5) {
          setAchievementData({ title: '5 Problems!', emoji: '🎉' })
          setShowAchievement(true)
        } else if (newCount === 10) {
          setAchievementData({ title: '10 Problems!', emoji: '🏆' })
          setShowAchievement(true)
        }

        generateNewProblem()
      }, 1500)
    } else {
      // Wrong answer
      playWrongAnswer(x, y)

      // Allow retry after delay
      setTimeout(() => {
        setSelectedAnswer(null)
        setIsCorrect(null)
        sounds.playTryAgain()
      }, 1000)
    }
  }

  // Initialize first problem
  useEffect(() => {
    generateNewProblem()
    sounds.playWelcomeBack()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Combo meter */}
      {combo > 0 && (
        <ComboMeter current={combo} max={10} position={{ x: 20, y: 20 }} />
      )}

      {/* Score display with animation */}
      <motion.div
        className="fixed top-20 right-20 bg-white/90 rounded-2xl px-6 py-3 shadow-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <div className="text-sm text-gray-600">Score</div>
        <div className="text-3xl font-bold text-gray-800">
          <AnimatedNumber value={score} />
        </div>
      </motion.div>

      {/* Problem counter */}
      <motion.div
        className="fixed top-20 left-20 bg-white/90 rounded-2xl px-6 py-3 shadow-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <div className="text-sm text-gray-600">Problems</div>
        <div className="text-3xl font-bold text-gray-800">
          <AnimatedNumber value={problemCount} />
        </div>
      </motion.div>

      {/* Main game area */}
      <AnimatedProblem>
        <div className="bg-white/95 rounded-3xl p-8 shadow-2xl max-w-md w-full">
          {/* Problem display */}
          <motion.div
            className="text-6xl font-bold text-center mb-8 text-gray-800"
            animate={{
              scale: selectedAnswer === null ? [1, 1.05, 1] : 1
            }}
            transition={{
              duration: 2,
              repeat: selectedAnswer === null ? Infinity : 0
            }}
          >
            {problem.question} = ?
          </motion.div>

          {/* Answer options */}
          <div className="grid grid-cols-2 gap-4">
            {answers.map((answer, index) => (
              <motion.div
                key={`${answer}-${index}`}
                initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  delay: index * 0.1,
                  type: 'spring',
                  damping: 12
                }}
              >
                <AnimatedAnswer
                  answer={answer}
                  isCorrect={answer === problem.answer}
                  isSelected={selectedAnswer === answer}
                  onClick={(e) => handleAnswerSelect(answer, e as any)}
                  disabled={selectedAnswer !== null}
                  worldColors={worldColors}
                  size="large"
                />
              </motion.div>
            ))}
          </div>

          {/* Encouragement message */}
          <AnimatePresence>
            {selectedAnswer === null && combo >= 3 && (
              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <motion.div
                  className="text-2xl font-bold"
                  style={{ color: worldColors.primary }}
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, -5, 5, 0]
                  }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  🔥 {combo} in a row! Keep going! 🔥
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AnimatedProblem>

      {/* Skip button */}
      <div className="mt-8">
        <AnimatedButton
          variant="secondary"
          emoji="⏭️"
          onClick={generateNewProblem}
          disabled={selectedAnswer !== null}
        >
          Skip Problem
        </AnimatedButton>
      </div>

      {/* Render all active effects */}
      {effects.map((effect) => {
        switch (effect.type) {
          case 'confetti':
            return <ConfettiBurst key={effect.id} x={effect.x} y={effect.y} />
          case 'starBurst':
            return <StarBurst key={effect.id} x={effect.x} y={effect.y} />
          case 'floatingText':
            return (
              <FloatingText
                key={effect.id}
                x={effect.x}
                y={effect.y}
                text={effect.data.text}
                emoji={effect.data.emoji}
                color={effect.data.color}
              />
            )
          case 'ripple':
            return (
              <RippleEffect
                key={effect.id}
                x={effect.x}
                y={effect.y}
                color={effect.data?.color}
              />
            )
          case 'achievement':
            return null // Handled separately
          default:
            return null
        }
      })}

      {/* Achievement popup */}
      <AnimatePresence>
        {showAchievement && (
          <AchievementPopup
            title={achievementData.title}
            emoji={achievementData.emoji}
            onDismiss={() => setShowAchievement(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Export usage guide
export const USAGE_GUIDE = `
# How to Use Enhanced Game Features

## 1. Sound Effects

Import the sounds manager:
\`\`\`typescript
import { sounds } from '@/lib/sounds/webAudioSounds'
\`\`\`

New sounds available:
- sounds.playCombo3() // 3 correct streak
- sounds.playCombo5() // 5 correct streak
- sounds.playCombo10() // 10 correct streak
- sounds.playTapRandom() // Randomized tap sounds
- sounds.playNumberReveal() // When problem appears
- sounds.playCountUp() / playCountDown() // For number animations
- sounds.playMilestone10() // 10 problems milestone
- sounds.playMilestone25() // 25 problems milestone
- sounds.playMilestone50() // 50 problems milestone
- sounds.playAlmostThere() // Encouragement near completion
- sounds.playTryAgain() // Gentle retry prompt
- sounds.playEncouragement() // General encouragement

## 2. Animated Components

### AnimatedAnswer
\`\`\`tsx
<AnimatedAnswer
  answer={5}
  isCorrect={true}
  isSelected={true}
  onClick={() => {}}
  worldColors={{ primary: '#2D5016', secondary: '#8BC34A' }}
  size="large"
/>
\`\`\`

### AnimatedNumber (count-up effect)
\`\`\`tsx
<AnimatedNumber value={score} duration={500} />
\`\`\`

### AnimatedProblem (entrance animation)
\`\`\`tsx
<AnimatedProblem delay={0.2}>
  {/* Problem content */}
</AnimatedProblem>
\`\`\`

## 3. Particle Effects

\`\`\`tsx
import { ConfettiBurst, StarBurst, FloatingText } from './ParticleEffects'

<ConfettiBurst x={100} y={200} count={20} />
<StarBurst x={100} y={200} count={8} />
<FloatingText text="+10" x={100} y={200} emoji="✨" />
\`\`\`

## 4. Game Effects Hook

\`\`\`tsx
const {
  effects,
  combo,
  playCorrectAnswer,
  playWrongAnswer,
  playTap,
  resetCombo,
  playProblemComplete,
  playLevelComplete
} = useGameEffects()

// On correct answer
playCorrectAnswer(clickX, clickY)

// On wrong answer
playWrongAnswer(clickX, clickY)
\`\`\`

## 5. Enhanced Buttons

\`\`\`tsx
<AnimatedButton
  variant="success"
  size="large"
  emoji="🎉"
  onClick={() => {}}
>
  Start Game!
</AnimatedButton>

<WorldButton
  worldColors={{ primary: '#2D5016', secondary: '#8BC34A' }}
  emoji="🌴"
  onClick={() => {}}
>
  Jungle World
</WorldButton>
\`\`\`

## 6. CSS Animations

New classes available in globals.css:
- .pop-in - Pop entrance animation
- .slide-up-in - Slide from bottom
- .wobble - Gentle wobble
- .pulse-glow - Pulsing glow effect
- .number-flip - Number flip transition
- .scale-bounce - Scale bounce for correct answers
- .wiggle - Wiggle on hover
- .heartbeat - Heartbeat pulse
- .shimmer - Shimmer shine effect
- .elastic-bounce - Elastic bounce
- .ripple - Ripple tap effect
- .stagger-fade-in - Staggered entrance (with .stagger-1 through .stagger-5)

Use them directly:
\`\`\`tsx
<div className="pop-in pulse-glow">
  Content
</div>
\`\`\`
`
