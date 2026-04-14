'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { getRandomFacts, type MultiplicationFact } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { generateWrongAnswers, shuffleAnswers } from '@/lib/utils/multiplicationDifficulty'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { speak } from '@/lib/sounds/speechUtils'
import { useInteractionCooldown } from '@/lib/hooks/useInteractionCooldown'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import { WRONG_ANSWER_MESSAGES, CORRECT_ANSWER_MESSAGES, getRandomMessage } from '@/lib/constants/encouragementMessages'

interface StoryProblemsProps {
  tableNumber: number
}

const TOTAL_ROUNDS = 5

// Story templates per table number
interface StoryTemplate {
  emoji: string
  unitEmoji: string
  singularSubject: string
  pluralSubject: string
  singularUnit: string
  pluralUnit: string
  verb: string
}

const STORY_TEMPLATES: Record<number, StoryTemplate> = {
  1: {
    emoji: '🐕',
    unitEmoji: '🦴',
    singularSubject: 'dog',
    pluralSubject: 'dogs',
    singularUnit: 'bone',
    pluralUnit: 'bones',
    verb: 'has',
  },
  2: {
    emoji: '👟',
    unitEmoji: '👟',
    singularSubject: 'pair of shoes',
    pluralSubject: 'pairs of shoes',
    singularUnit: 'shoe',
    pluralUnit: 'shoes',
    verb: 'means',
  },
  3: {
    emoji: '🛴',
    unitEmoji: '🔵',
    singularSubject: 'tricycle',
    pluralSubject: 'tricycles',
    singularUnit: 'wheel',
    pluralUnit: 'wheels',
    verb: 'has',
  },
  4: {
    emoji: '🚗',
    unitEmoji: '🔵',
    singularSubject: 'car',
    pluralSubject: 'cars',
    singularUnit: 'wheel',
    pluralUnit: 'wheels',
    verb: 'has',
  },
  5: {
    emoji: '🖐️',
    unitEmoji: '☝️',
    singularSubject: 'hand',
    pluralSubject: 'hands',
    singularUnit: 'finger',
    pluralUnit: 'fingers',
    verb: 'has',
  },
  6: {
    emoji: '🐛',
    unitEmoji: '🦵',
    singularSubject: 'bug',
    pluralSubject: 'bugs',
    singularUnit: 'leg',
    pluralUnit: 'legs',
    verb: 'has',
  },
  7: {
    emoji: '📅',
    unitEmoji: '📆',
    singularSubject: 'week',
    pluralSubject: 'weeks',
    singularUnit: 'day',
    pluralUnit: 'days',
    verb: 'has',
  },
  8: {
    emoji: '🐙',
    unitEmoji: '🦑',
    singularSubject: 'octopus',
    pluralSubject: 'octopuses',
    singularUnit: 'arm',
    pluralUnit: 'arms',
    verb: 'has',
  },
  9: {
    emoji: '🐱',
    unitEmoji: '💚',
    singularSubject: 'cat',
    pluralSubject: 'cats',
    singularUnit: 'life',
    pluralUnit: 'lives',
    verb: 'has',
  },
  10: {
    emoji: '🖍️',
    unitEmoji: '🖍️',
    singularSubject: 'pack of crayons',
    pluralSubject: 'packs of crayons',
    singularUnit: 'crayon',
    pluralUnit: 'crayons',
    verb: 'means',
  },
}

interface Round {
  fact: MultiplicationFact
  choices: number[]
  template: StoryTemplate
}

function generateRounds(tableNumber: number): Round[] {
  const facts = getRandomFacts(tableNumber, TOTAL_ROUNDS)
  const template = STORY_TEMPLATES[tableNumber] || STORY_TEMPLATES[1]

  return facts.map(fact => {
    const wrong = generateWrongAnswers(fact.product, 2, 'product')
    const choices = shuffleAnswers([fact.product, ...wrong])
    return { fact, choices, template }
  })
}

function buildStoryText(fact: MultiplicationFact, template: StoryTemplate): string {
  const subjectCount = fact.b
  const unitsPerSubject = fact.a
  const subjectWord = subjectCount === 1 ? template.singularSubject : template.pluralSubject
  const unitWord = unitsPerSubject === 1 ? template.singularUnit : template.pluralUnit

  return `${subjectCount} ${subjectWord} ${template.verb} ${unitsPerSubject} ${unitWord} each. How many ${template.pluralUnit} in total?`
}

function buildSpeechText(fact: MultiplicationFact, template: StoryTemplate): string {
  const subjectCount = fact.b
  const unitsPerSubject = fact.a
  const subjectWord = subjectCount === 1 ? template.singularSubject : template.pluralSubject
  const unitWord = unitsPerSubject === 1 ? template.singularUnit : template.pluralUnit

  return `${subjectCount} ${subjectWord} ${template.verb} ${unitsPerSubject} ${unitWord} each. How many ${template.pluralUnit} in total?`
}

export default function StoryProblems({ tableNumber }: StoryProblemsProps) {
  const [rounds, setRounds] = useState<Round[]>(() => generateRounds(tableNumber))
  const [currentRound, setCurrentRound] = useState(0)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<'question' | 'feedback' | 'counting' | 'complete'>('question')
  const [feedbackCorrect, setFeedbackCorrect] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showCountAnimation, setShowCountAnimation] = useState(false)
  const [animatedCount, setAnimatedCount] = useState(0)
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const { isLocked, triggerCooldown } = useInteractionCooldown()
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout)
  }, [])

  const round = rounds[currentRound]
  const storyText = useMemo(
    () => buildStoryText(round.fact, round.template),
    [round]
  )

  // Speak the story on each new round
  useEffect(() => {
    if (phase === 'question') {
      const t = setTimeout(() => {
        speak(buildSpeechText(round.fact, round.template))
      }, 600)
      return () => clearTimeout(t)
    }
  }, [currentRound, phase, round])

  // Animate the count-up after correct answer
  useEffect(() => {
    if (!showCountAnimation) return

    const target = round.fact.product
    let current = 0
    const step = round.fact.a // count by the table number

    const interval = setInterval(() => {
      current += step
      if (current > target) current = target
      setAnimatedCount(current)
      sounds.playCountUp()

      if (current >= target) {
        clearInterval(interval)
      }
    }, 300)

    return () => clearInterval(interval)
  }, [showCountAnimation, round.fact.product, round.fact.a])

  const handleAnswer = useCallback((answer: number) => {
    if (isLocked || phase !== 'question') return
    triggerCooldown()
    setSelectedAnswer(answer)

    const isCorrect = answer === round.fact.product

    if (isCorrect) {
      sounds.playCorrect()
      const msg = getRandomMessage(CORRECT_ANSWER_MESSAGES)
      setFeedbackMessage(msg)
      setFeedbackCorrect(true)
      setScore(s => s + 1)
      setPhase('counting')

      // Start count animation
      setShowCountAnimation(true)
      setAnimatedCount(0)

      // After count animation, move to next
      const countDuration = round.fact.b * 300 + 800
      const t = setTimeout(() => {
        setShowCountAnimation(false)
        advanceRound(true)
      }, countDuration)
      timeoutsRef.current.push(t)
    } else {
      sounds.playGentleError()
      const correctAnswer = round.fact.product
      setFeedbackMessage(`Not quite! ${round.fact.b} groups of ${round.fact.a} = ${correctAnswer}`)
      setFeedbackCorrect(false)
      setPhase('feedback')

      const t = setTimeout(() => {
        advanceRound(false)
      }, 2500)
      timeoutsRef.current.push(t)
    }
  }, [isLocked, phase, round, triggerCooldown]) // eslint-disable-line react-hooks/exhaustive-deps

  const advanceRound = useCallback((wasCorrect: boolean) => {
    const nextRound = currentRound + 1
    if (nextRound >= TOTAL_ROUNDS) {
      const finalScore = wasCorrect ? score + 1 : score
      // Adjust score if this function is called for correct
      // score was already updated in state for correct answers
      const displayScore = wasCorrect ? score : score // score state already updated for correct
      const stars = finalScore >= 5 ? 3 : finalScore >= 3 ? 2 : 1
      setPhase('complete')
      recordModeScore(tableNumber, 'story', stars)
      showCelebration({
        type: 'level_complete',
        title: 'Story Master!',
        subtitle: `${finalScore}/${TOTAL_ROUNDS} correct - ${stars} star${stars !== 1 ? 's' : ''}!`,
        emoji: '📖',
        stars,
      })
    } else {
      setCurrentRound(nextRound)
      setPhase('question')
      setSelectedAnswer(null)
      setFeedbackMessage(null)
      setShowCountAnimation(false)
      setAnimatedCount(0)
    }
  }, [currentRound, score, tableNumber, recordModeScore, showCelebration])

  const handlePlayAgain = useCallback(() => {
    setRounds(generateRounds(tableNumber))
    setCurrentRound(0)
    setScore(0)
    setPhase('question')
    setFeedbackCorrect(false)
    setFeedbackMessage(null)
    setSelectedAnswer(null)
    setShowCountAnimation(false)
    setAnimatedCount(0)
  }, [tableNumber])

  // Build emoji groups for visual scene
  const emojiGroups = useMemo(() => {
    const groups: string[][] = []
    const groupCount = round.fact.b
    const itemsPerGroup = round.fact.a

    // Cap visual display for large products
    const maxVisualGroups = Math.min(groupCount, 6)
    const maxItemsPerGroup = Math.min(itemsPerGroup, 8)

    for (let g = 0; g < maxVisualGroups; g++) {
      const row: string[] = []
      for (let i = 0; i < maxItemsPerGroup; i++) {
        row.push(round.template.unitEmoji)
      }
      groups.push(row)
    }
    return groups
  }, [round])

  const isTruncated = round.fact.b > 6 || round.fact.a > 8

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-300 via-orange-300 to-rose-400 p-4 pb-24">
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Back button - fixed top-left */}
      <div className="fixed top-4 left-4 z-50">
        <Link href={`/multiplication/${tableNumber}`}>
          <motion.button
            className="px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 font-bold rounded-full shadow-lg min-h-[48px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center gap-1">
              <span>&#11013;&#65039;</span> Back
            </span>
          </motion.button>
        </Link>
      </div>

      {/* Header */}
      <motion.div
        className="text-center mb-3 pt-14"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">
          Story Problems
        </h1>
        <p className="text-white/80 text-sm">
          Round {Math.min(currentRound + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS} | Score: {score}
        </p>
      </motion.div>

      {phase !== 'complete' && (
        <motion.div
          key={`round-${currentRound}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Story card */}
          <div className="max-w-md mx-auto bg-white/20 backdrop-blur-md rounded-2xl p-4 mb-4">
            {/* Big emoji scene header */}
            <div className="text-center mb-2">
              <motion.span
                className="text-5xl inline-block"
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {round.template.emoji}
              </motion.span>
            </div>

            {/* Story text */}
            <motion.p
              className="text-center text-white font-bold text-lg mb-3 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {storyText}
            </motion.p>

            {/* Speaker button */}
            <div className="flex justify-center mb-3">
              <motion.button
                className="px-3 py-1.5 bg-white/20 rounded-full text-sm text-white/70 min-h-[36px] flex items-center gap-1"
                whileTap={{ scale: 0.95 }}
                onClick={() => speak(buildSpeechText(round.fact, round.template))}
              >
                <span role="img" aria-hidden="true">&#128266;</span>
                <span>Read aloud</span>
              </motion.button>
            </div>

            {/* Visual emoji scene */}
            <div className="flex flex-col items-center gap-1.5">
              {emojiGroups.map((group, groupIdx) => (
                <motion.div
                  key={`group-${groupIdx}`}
                  className="flex items-center gap-0.5 bg-white/15 rounded-xl px-3 py-1.5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + groupIdx * 0.1 }}
                >
                  {/* Group subject emoji */}
                  <span className="text-xl mr-1.5">{round.template.emoji}</span>
                  {/* Items in this group */}
                  {group.map((emoji, itemIdx) => (
                    <motion.span
                      key={`item-${groupIdx}-${itemIdx}`}
                      className="text-lg"
                      initial={{ scale: 0 }}
                      animate={showCountAnimation ? {
                        scale: [1, 1.3, 1],
                        transition: { delay: (groupIdx * round.fact.a + itemIdx) * 0.15 }
                      } : { scale: 1 }}
                      transition={{ delay: 0.2 + groupIdx * 0.05 + itemIdx * 0.03, type: 'spring' }}
                    >
                      {emoji}
                    </motion.span>
                  ))}
                </motion.div>
              ))}
              {isTruncated && (
                <span className="text-white/60 text-sm">
                  ...and more!
                </span>
              )}
            </div>

            {/* Count animation overlay */}
            <AnimatePresence>
              {showCountAnimation && (
                <motion.div
                  className="text-center mt-3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-3xl font-extrabold text-white bg-green-500/60 backdrop-blur-sm px-6 py-2 rounded-full">
                    = {animatedCount}
                    {animatedCount === round.fact.product && '!'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Equation hint */}
          <div className="text-center mb-3">
            <span className="text-sm text-white/60 font-semibold bg-black/10 px-3 py-1 rounded-full">
              {round.fact.a} x {round.fact.b} = ?
            </span>
          </div>

          {/* Feedback message */}
          <AnimatePresence>
            {feedbackMessage && (
              <motion.div
                className="text-center mb-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span className={`text-base font-bold bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full ${
                  feedbackCorrect ? 'text-green-100' : 'text-amber-100'
                }`}>
                  {feedbackMessage}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Answer choices */}
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            {round.choices.map((choice, idx) => {
              const isSelected = selectedAnswer === choice
              const showCorrect = phase !== 'question' && choice === round.fact.product
              const showWrong = phase === 'feedback' && isSelected && choice !== round.fact.product

              return (
                <motion.button
                  key={`${currentRound}-choice-${idx}`}
                  className={`rounded-2xl py-4 text-2xl font-bold shadow-lg min-h-[56px]
                             border-3 transition-colors
                             ${showCorrect
                               ? 'bg-green-400 border-green-500 text-white'
                               : showWrong
                                 ? 'bg-amber-400 border-amber-500 text-white'
                                 : 'bg-white/90 border-white/50 text-gray-800'
                             }`}
                  whileTap={phase === 'question' ? { scale: 0.92 } : {}}
                  animate={
                    showWrong
                      ? { x: [0, -3, 3, -3, 0] }
                      : showCorrect
                        ? { scale: [1, 1.1, 1] }
                        : {}
                  }
                  transition={{ duration: 0.4 }}
                  onClick={() => handleAnswer(choice)}
                  disabled={phase !== 'question'}
                >
                  {choice}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Complete screen */}
      {phase === 'complete' && !celebration && (
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-2xl font-extrabold text-white mb-4">
            Score: {score}/{TOTAL_ROUNDS}
          </p>
          <motion.button
            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600
                       text-white font-bold text-lg rounded-full shadow-xl
                       border-4 border-white/30 min-h-[56px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayAgain}
          >
            Play Again!
          </motion.button>
        </motion.div>
      )}

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mt-5">
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <motion.div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < currentRound ? 'bg-white' : i === currentRound ? 'bg-yellow-300' : 'bg-white/30'
            }`}
            animate={i === currentRound && phase !== 'complete' ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  )
}
