'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter, useParams } from 'next/navigation'
import { useCharacterStore } from '@/lib/stores/characterStore'
import { useProgressStore } from '@/lib/stores/progressStore'
import { useWorldStore } from '@/lib/stores/worldStore'
import { useGameStore } from '@/lib/stores/gameStore'
import { PresetAvatar } from '@/components/character-creator/PresetAvatars'
import {
  BubblePopGame,
  FeedAnimalGame,
  RaceGame,
  PuzzleGame,
  BouncingBallGame,
  ShuffleGame,
  WhackMoleGame,
  BalloonOrderGame,
  MemoryFlipGame,
  FishingGame,
  RocketLaunchGame,
  TreasureHuntGame
} from '@/components/game/MiniGames'
import {
  CatTreatsGame,
  YarnBallGame,
  CatNapGame,
  CatTowerGame,
  KittyDanceGame
} from '@/components/game/cat-world/CatGames'
import {
  AsteroidBlastGame,
  PlanetHopGame,
  AlienFeedingGame,
  StarCollectorGame
} from '@/components/game/space-world/SpaceGames'
import {
  BubbleCountGame,
  FishSchoolGame,
  TreasureChestGame,
  SeashellSortGame
} from '@/components/game/ocean-world/OceanGames'
import {
  BasketCountingGame,
  NumberLineDragGame,
  SortingDragGame,
  MatchDragGame
} from '@/components/game/DragDropGames'
import { getLevelById, getModuleById, getRandomMessage, GameType } from '@/lib/constants/levels'
import { getWorldGameType } from '@/lib/utils/worldGameTypes'
import { generateProblems } from '@/lib/math/problemGenerator'
import { generateShuffledSequence, ShuffledQuestion, shuffledQuestionToMathProblem } from '@/lib/logic/gameShuffle'
import { getWorldById, World } from '@/lib/constants/worlds'
import { music } from '@/lib/sounds/musicSounds'
import { AnimatedBackground } from '@/components/game/AnimatedBackground'
import { CelebrationOverlay, CelebrationData, useCelebration } from '@/components/game/CelebrationOverlay'
import { useUnlocksStore } from '@/lib/stores/unlocksStore'

// New Architecture Imports
import { calculateFlowState } from '@/lib/logic/adaptiveSystem'
import { DragPhysicsMode } from '@/components/game/modes/DragPhysicsMode'
import { SequenceMode } from '@/components/game/modes/SequenceMode'
import { GameProblem, GameAsset, AttemptMetric, InteractionType } from '@/lib/types/gameEngine'

// Story guide characters
const GUIDE_CHARACTERS = [
  { emoji: '🦉', name: 'Professor Owl', greeting: "Let's learn together!" },
  { emoji: '🦊', name: 'Clever Fox', greeting: "Ready for fun?" },
  { emoji: '🐼', name: 'Panda Pal', greeting: "You can do it!" },
  { emoji: '🦋', name: 'Butterfly', greeting: "Let's fly through this!" },
]

export default function GamePage() {
  const router = useRouter()
  const params = useParams()
  const worldId = params.worldId as string
  const levelId = parseInt(params.level as string)
  const moduleId = parseInt(params.module as string)

  const [mounted, setMounted] = useState(false)
  const [world, setWorld] = useState<World | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [showComplete, setShowComplete] = useState(false)
  const [guide] = useState(() => GUIDE_CHARACTERS[Math.floor(Math.random() * GUIDE_CHARACTERS.length)])
  const [showIntro, setShowIntro] = useState(true)

  // Shuffled questions for Toca Boca-style variety!
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([])

  // Adaptive System State
  const [attemptHistory, setAttemptHistory] = useState<AttemptMetric[]>([])
  const [flowState, setFlowState] = useState<{ nextInteraction: InteractionType; visualAidDensity: number }>({
    nextInteraction: 'tap', // Default start
    visualAidDensity: 1.0
  })

  const { characterName, avatarStyle, skinTone, hairColor, primaryColor } = useCharacterStore()
  const { totalStars, recordModuleComplete, incrementQuestionsToday, addStars, skillLevel, completedLevels } = useProgressStore()
  const { recordLevelComplete, worldProgress } = useWorldStore()
  const {
    checkAndUnlockStarAchievements,
    checkAndUnlockStreakAchievements,
    checkAndUnlockLevelAchievements,
    checkAndUnlockWorldAchievements
  } = useUnlocksStore()

  // Celebration system
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const {
    currentProblem,
    problemIndex,
    totalProblems,
    correctAnswers,
    currentStreak,
    isAnswerSubmitted,
    isCorrect,
    startGame,
    submitAnswer,
    nextProblem,
    endGame,
    resetGame,
    startTime
  } = useGameStore()

  const level = getLevelById(levelId)
  const gameModule = getModuleById(levelId, moduleId)

  // Initialize game - FIXED: Single useEffect with proper initialization order
  useEffect(() => {
    console.log('[GamePage] Initializing...', { worldId, levelId, moduleId })

    const foundWorld = getWorldById(worldId)
    console.log('[GamePage] Found world:', foundWorld?.name || 'NOT FOUND')
    console.log('[GamePage] Level:', level?.name || 'NOT FOUND')
    console.log('[GamePage] Module:', gameModule?.name || 'NOT FOUND')

    if (foundWorld && level && gameModule) {
      // 1. Set world state
      setWorld(foundWorld)

      // 2. Generate shuffled sequence for Toca Boca-style variety!
      const shuffled = generateShuffledSequence(worldId, gameModule.questionsCount || 7)
      setShuffledQuestions(shuffled)
      console.log('[GamePage] Generated shuffled sequence:', shuffled.length, 'Game types:', shuffled.map(q => q.gameType).join(', '))

      // 3. Convert to MathProblem format for the game store
      const problems = shuffled.map((sq, index) => shuffledQuestionToMathProblem(sq, index))
      console.log('[GamePage] Converted problems:', problems.length, 'First problem:', problems[0])

      // 4. Start game (this sets currentProblem in the store)
      startGame(worldId, levelId, moduleId, problems)
      console.log('[GamePage] Game started')

      // 4. Set mounted LAST - after all state is ready
      setMounted(true)
      console.log('[GamePage] Mounted set to true')
    } else {
      console.warn('[GamePage] Game init failed:', { worldId, levelId, moduleId, foundWorld, level, gameModule })
      router.push('/worlds')
    }

    // NOTE: Don't reset game in cleanup - causes issues with React Strict Mode
    // The game will be reset when navigating away or starting a new game
    return () => {
      console.log('[GamePage] Cleanup called (not resetting to avoid Strict Mode issues)')
    }
  }, [worldId, levelId, moduleId, router, startGame, level, gameModule])

  // Build question string
  const getQuestionText = useCallback(() => {
    if (!currentProblem) return ''
    const { type, num1, num2 } = currentProblem
    switch (type) {
      case 'counting':
        return `Count: How many ${currentProblem.countingObjects?.[0] || '⭐'}?`
      case 'addition':
        return `${num1} + ${num2} = ?`
      case 'subtraction':
        return `${num1} - ${num2} = ?`
      case 'multiplication':
        return `${num1} × ${num2} = ?`
      default:
        return 'Solve this!'
    }
  }, [currentProblem])

  // Adapt MathProblem to GameProblem for new modes
  const adaptedProblem = useMemo<GameProblem | null>(() => {
    if (!currentProblem) return null
    
    const assets: GameAsset[] = []
    const emoji = currentProblem.countingObjects?.[0] || '⭐'
    let correctSequence: string[] | undefined

    if (flowState.nextInteraction === 'sequence') {
      // Create sequence assets (e.g., 1, 2, 3 or 2, +, 2, =, 4)
      if (currentProblem.type === 'counting') {
        for (let i = 1; i <= currentProblem.answer; i++) {
          assets.push({ id: `seq-${i}`, type: 'text', content: String(i) })
        }
      } else {
         // Equation sequence
         assets.push({ id: 'p1', type: 'text', content: String(currentProblem.num1) })
         assets.push({ id: 'op', type: 'text', content: currentProblem.type === 'addition' ? '+' : '-' }) // Simplification
         assets.push({ id: 'p2', type: 'text', content: String(currentProblem.num2) })
         assets.push({ id: 'eq', type: 'text', content: '=' })
         assets.push({ id: 'ans', type: 'text', content: String(currentProblem.answer) })
      }
      correctSequence = assets.map(a => a.id)
      // Shuffle for puzzle
      // assets.sort(() => Math.random() - 0.5) // Reorder component handles shuffling visually or we pass shuffled
    } else {
      // Physics/Drag assets
      const count = currentProblem.answer
      for (let i = 0; i < count; i++) {
         assets.push({ 
            id: `obj-${i}`, 
            type: 'text', 
            content: emoji, 
            value: 1 
         })
      }
    }

    return {
      id: String(currentProblem.id),
      type: flowState.nextInteraction,
      prompt: getQuestionText(),
      assets,
      correctSequence,
      correctValue: currentProblem.answer,
      difficultyWeight: flowState.visualAidDensity,
      tolerance: 50
    }
  }, [currentProblem, flowState, getQuestionText])

  // Handle correct answer
  const handleCorrect = useCallback((timestamp: number = Date.now()) => {
    const timeTaken = timestamp - (startTime || timestamp)
    
    // Update Adaptive System
    if (currentProblem) {
      const metric: AttemptMetric = {
        problemId: String(currentProblem.id),
        timeTakenMs: timeTaken,
        attemptsCount: 1, // Simplified
        didGiveUp: false,
        interactionPattern: 'direct',
        timestamp
      }
      
      const newHistory = [...attemptHistory, metric]
      setAttemptHistory(newHistory)
      
      // Calculate next state
      const nextFlow = calculateFlowState(newHistory, currentStreak + 1)
      setFlowState(nextFlow)
    }

    const { correct, streakBonus } = submitAnswer(currentProblem?.answer || 0)
    incrementQuestionsToday(correct)

    music.playCorrectMelody()

    if (streakBonus && currentStreak >= 3) {
      music.playStreakMelody()
      setFeedbackMessage(getRandomMessage(currentStreak >= 5 ? 'streak5' : 'streak3'))
    } else {
      setFeedbackMessage(getRandomMessage('correct'))
    }
    setShowFeedback(true)

    setTimeout(() => {
      setShowFeedback(false)
      const hasMore = nextProblem()
      if (!hasMore) {
        // Game complete!
        const { stars, timeBonus } = endGame()
        const totalStarsEarned = timeBonus ? stars + 1 : stars
        const previousStars = totalStars

        recordModuleComplete(levelId, moduleId, totalStarsEarned, correctAnswers + 1)
        addStars(totalStarsEarned)
        recordLevelComplete(worldId, levelId, totalStarsEarned)

        music.playLevelCompleteMelody()

        // Check for achievements after recording progress
        const newTotalStars = previousStars + totalStarsEarned

        // Check star achievements (15, 40, 70, 100)
        const starAchievements = checkAndUnlockStarAchievements(newTotalStars, previousStars)

        // Check level completion achievements (first time completing all 3 modules of a level)
        const isFirstLevelComplete = moduleId === 3 && !completedLevels.includes(levelId)
        const levelAchievements = checkAndUnlockLevelAchievements(levelId, isFirstLevelComplete)

        // Check world completion
        const currentWorldProgress = worldProgress[worldId]
        const isWorldComplete = currentWorldProgress?.fullyCompleted || false
        const worldAchievements = checkAndUnlockWorldAchievements(worldId, isWorldComplete)

        // Show celebration for any achievement unlocked (priority: world > level > stars)
        if (worldAchievements.length > 0) {
          const achievement = worldAchievements[0]
          showCelebration({
            type: 'world_complete',
            title: achievement.itemName,
            subtitle: 'You conquered this world!',
            emoji: achievement.emoji || '🏆',
            stars: 3
          })
        } else if (levelAchievements.length > 0) {
          const achievement = levelAchievements[0]
          showCelebration({
            type: 'level_complete',
            title: achievement.itemName,
            subtitle: 'Level mastered!',
            emoji: achievement.emoji || '🏆',
            stars: 3
          })
        } else if (starAchievements.length > 0) {
          const achievement = starAchievements[0]
          showCelebration({
            type: 'star_milestone',
            title: achievement.itemName,
            subtitle: `You earned ${newTotalStars} stars!`,
            emoji: achievement.emoji || '⭐',
            stars: 3
          })
        } else {
          // ALWAYS show a big celebration for kids! Even without achievements
          const starsEarned = Math.ceil((correctAnswers / totalProblems) * 3)

          // Motivational messages with variety!
          const motivationalTitles = [
            '🎉 Amazing Job! 🎉',
            '🌟 You\'re a ROCKSTAR! 🌟',
            '🚀 INCREDIBLE! 🚀',
            '⭐ SUPERSTAR! ⭐',
            '🎊 WOW! You Did It! 🎊',
            '💪 CHAMPION! 💪'
          ]

          const motivationalSubtitles = [
            `You got ${correctAnswers}/${totalProblems} correct!`,
            `${correctAnswers}/${totalProblems} - You're on fire! 🔥`,
            `${correctAnswers}/${totalProblems} - Keep being awesome! ✨`,
            `${correctAnswers}/${totalProblems} - Math genius alert! 🧠`
          ]

          // Special message when completing a module to move to next
          const isLastModule = moduleId === 3
          const nextModuleMsg = isLastModule
            ? '🎯 Level Complete! New adventure awaits! 🗺️'
            : `✨ Moving to Module ${moduleId + 1}! You're unstoppable! 🚀`

          const randomTitle = motivationalTitles[Math.floor(Math.random() * motivationalTitles.length)]
          const randomSubtitle = starsEarned === 3
            ? nextModuleMsg
            : motivationalSubtitles[Math.floor(Math.random() * motivationalSubtitles.length)]

          showCelebration({
            type: 'level_complete',
            title: randomTitle,
            subtitle: randomSubtitle,
            emoji: starsEarned === 3 ? '🏆' : starsEarned === 2 ? '🌟' : '⭐',
            stars: starsEarned
          })
        }
      }
    }, 1200)
  }, [submitAnswer, currentProblem, incrementQuestionsToday, currentStreak, nextProblem, endGame, recordModuleComplete, addStars, recordLevelComplete, levelId, moduleId, worldId, correctAnswers, startTime, attemptHistory, totalStars, completedLevels, worldProgress, checkAndUnlockStarAchievements, checkAndUnlockLevelAchievements, checkAndUnlockWorldAchievements, showCelebration])

  // Handle wrong answer
  const handleWrong = useCallback((timestamp: number = Date.now()) => {
    const timeTaken = timestamp - (startTime || timestamp)
    
    if (currentProblem) {
      const metric: AttemptMetric = {
        problemId: String(currentProblem.id),
        timeTakenMs: timeTaken,
        attemptsCount: 1,
        didGiveUp: true, // Treated as struggle
        interactionPattern: 'hesitant',
        timestamp
      }
      const newHistory = [...attemptHistory, metric]
      setAttemptHistory(newHistory)
      // Recalculate - likely triggers scaffolding
      setFlowState(calculateFlowState(newHistory, 0))
    }

    music.playWrongMelody()
    setFeedbackMessage(getRandomMessage('tryAgain'))
    setShowFeedback(true)
    setTimeout(() => setShowFeedback(false), 1000)
  }, [attemptHistory, currentProblem, startTime])

  // Start game after intro
  const handleStartGame = () => {
    console.log('[handleStartGame] Button clicked! Setting showIntro to false...')
    try {
      setShowIntro(false)
      console.log('[handleStartGame] showIntro set to false')
      music.resume()
      console.log('[handleStartGame] music.resume() called')
    } catch (error) {
      console.error('[handleStartGame] Error:', error)
    }
  }

  // Debug logging for render condition
  if (!mounted || !world || !currentProblem || !level || !gameModule) {
    console.log('[GamePage] Render blocked:', { mounted, world: !!world, currentProblem: !!currentProblem, level: !!level, gameModule: !!gameModule })
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
        <motion.div
          className="text-8xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {world?.emoji || '🎮'}
        </motion.div>
      </div>
    )
  }
  console.log('[GamePage] Rendering game UI with problem:', currentProblem?.id)

  // Render the appropriate mini-game based on gameModule.gameType AND Adaptive Flow
  const renderGameContent = () => {
    console.log('[renderGameContent] Called with:', {
      showIntro,
      gameType: gameModule?.gameType,
      currentProblem: !!currentProblem,
      flowState: flowState.nextInteraction
    })

    // Safety check: ensure we have problem data
    if (!currentProblem) {
      console.log('[renderGameContent] No currentProblem!')
      return (
        <div className="text-center text-white text-2xl">
          Loading problem...
        </div>
      )
    }

    // Safety check: ensure options exist (fallback to generated options)
    const safeOptions = currentProblem.options && currentProblem.options.length > 0
      ? currentProblem.options
      : [currentProblem.answer, currentProblem.answer + 1, currentProblem.answer + 2, Math.max(0, currentProblem.answer - 1)]
          .sort(() => Math.random() - 0.5)

    // 1. Check Adaptive Overrides - ONLY for non-standard interaction types
    // 'tap' and 'choice' use the standard mini-games defined by gameModule.gameType
    if (adaptedProblem && flowState.nextInteraction !== 'tap') {
      if (flowState.nextInteraction === 'drag-target' || flowState.nextInteraction === 'physics-feed') {
        return (
          <DragPhysicsMode
            problem={adaptedProblem}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        )
      }
      if (flowState.nextInteraction === 'sequence') {
        return (
          <SequenceMode
            problem={adaptedProblem}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        )
      }
    }

    // 2. Standard mini-games based on SHUFFLED question's gameType for VARIETY!
    // Get the current shuffled question's game type for Toca Boca-style variety
    const currentShuffledQ = shuffledQuestions[problemIndex]
    const baseGameType = currentShuffledQ?.gameType || gameModule?.gameType || 'standard'
    // For certain worlds (like Lovely Cat), can still apply world-specific themed overrides
    const gameType: GameType = getWorldGameType(worldId, baseGameType)
    const question = getQuestionText()
    // Use shuffled question's emoji for variety, fallback to counting objects or world emoji
    const emoji = currentShuffledQ?.emoji || currentProblem.countingObjects?.[0] || world?.emoji || '⭐'

    switch (gameType) {
      case 'bubblePop':
        return (
          <BubblePopGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
            emoji={emoji}
          />
        )

      case 'feedAnimal':
        return (
          <FeedAnimalGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
            worldId={worldId}
          />
        )

      case 'race':
        return (
          <RaceGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
            playerEmoji={avatarStyle === 'fairy' ? '🧚' : avatarStyle === 'wizard' ? '🧙' : '🏃'}
          />
        )

      case 'puzzle':
        return (
          <PuzzleGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
            image={emoji}
          />
        )

      case 'bouncingBall':
        return (
          <BouncingBallGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
            emoji={emoji}
          />
        )

      case 'shuffle':
        return (
          <ShuffleGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'whackMole':
        return (
          <WhackMoleGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'balloonOrder':
        return (
          <BalloonOrderGame
            numbers={safeOptions}
            onComplete={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'memoryFlip':
        // CRITICAL: Memory Match only works with countable numbers (1-5)
        // Generate 4 unique values specifically for visual counting
        const memoryValues = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 4)
        const memoryEmojis = ['🍎', '🌟', '🎈', '🐱', '🌻', '🦋'].sort(() => Math.random() - 0.5)
        return (
          <MemoryFlipGame
            pairs={memoryValues.map((value, i) => ({
              emoji: memoryEmojis[i],
              value: value
            }))}
            onComplete={() => handleCorrect()}
          />
        )

      case 'fishing':
        return (
          <FishingGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
            emoji={currentProblem.countingObjects?.[0] || '🐟'}
          />
        )

      case 'rocketLaunch':
        return (
          <RocketLaunchGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'treasureHunt':
        return (
          <TreasureHuntGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      // Lovely Cat World Games!
      case 'catTreats':
        return (
          <CatTreatsGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'yarnBall':
        return (
          <YarnBallGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'catNap':
        return (
          <CatNapGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'catTower':
        return (
          <CatTowerGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'kittyDance':
        return (
          <KittyDanceGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      // Space Galaxy World Games!
      case 'asteroidBlast':
        return (
          <AsteroidBlastGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'planetHop':
        return (
          <PlanetHopGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'alienFeeding':
        return (
          <AlienFeedingGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'starCollector':
        return (
          <StarCollectorGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      // Ocean Kingdom World Games!
      case 'bubbleCount':
        return (
          <BubbleCountGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'fishSchool':
        return (
          <FishSchoolGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'treasureChest':
        return (
          <TreasureChestGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      case 'seashellSort':
        return (
          <SeashellSortGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
          />
        )

      // Enhanced Toca Boca-style drag games
      case 'basketCounting':
        return (
          <BasketCountingGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
            emoji={emoji}
          />
        )

      case 'numberLineDrag':
        return (
          <NumberLineDragGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
            emoji={emoji}
          />
        )

      case 'sortingDrag':
        return (
          <SortingDragGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
            emoji={emoji}
          />
        )

      case 'matchDrag':
        return (
          <MatchDragGame
            question={question}
            correctAnswer={currentProblem.answer}
            options={safeOptions}
            onCorrect={() => handleCorrect()}
            onWrong={() => handleWrong()}
            emoji={emoji}
          />
        )

      default:
        // Standard game with answer buttons
        return (
          <div className="text-center">
            <motion.div
              className="bg-white/95 rounded-3xl p-8 shadow-2xl mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <h2 className="text-3xl font-bold mb-4">{question}</h2>

              {/* Visual representation */}
              {currentProblem.countingObjects && currentProblem.countingObjects.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {currentProblem.countingObjects.map((obj, i) => (
                    <motion.span
                      key={i}
                      className="text-3xl"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {obj}
                    </motion.span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Answer options */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {safeOptions.map((option, i) => (
                <motion.button
                  key={`${currentProblem.id}-${option}-${i}`}
                  className={`p-6 text-3xl font-bold rounded-2xl shadow-lg bg-white
                             hover:bg-yellow-100 active:bg-yellow-200`}
                  onClick={() => {
                    if (option === currentProblem.answer) {
                      handleCorrect()
                    } else {
                      handleWrong()
                    }
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </div>
        )
    }
  }

  return (
    <main
      className={`min-h-screen flex flex-col p-4 relative overflow-hidden`}
      style={{ background: world.colors.background }}
    >
      <AnimatedBackground worldId={worldId} colors={world.colors} />

      {/* Intro screen with guide */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center"
              initial={{ scale: 0, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: -100 }}
            >
              {/* Guide character */}
              <motion.span
                className="text-8xl block mb-4"
                animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {guide.emoji}
              </motion.span>

              <h2 className="text-2xl font-bold mb-2">{guide.name}</h2>
              <p className="text-lg text-gray-600 mb-4">{guide.greeting}</p>

              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 mb-6">
                <h3 className="text-xl font-bold text-purple-700">{gameModule.name}</h3>
                <p className="text-gray-600">{gameModule.questionsCount} fun challenges!</p>
              </div>

              <motion.button
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-400
                           text-white text-2xl font-bold rounded-2xl shadow-xl"
                onClick={handleStartGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ boxShadow: ['0 0 20px rgba(255,200,0,0.4)', '0 0 40px rgba(255,200,0,0.6)', '0 0 20px rgba(255,200,0,0.4)'] }}
                transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
              >
                Let&apos;s Play! 🎮
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-4 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          onClick={() => router.push(`/worlds/${worldId}`)}
          className="text-3xl bg-white/90 p-2 rounded-full shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ←
        </motion.button>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="bg-white/90 rounded-full px-4 py-2 shadow-lg font-bold">
            {problemIndex + 1} / {totalProblems}
          </div>
          {currentStreak >= 3 && (
            <motion.div
              className="bg-orange-400 rounded-full px-4 py-2 shadow-lg text-white font-bold"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              🔥 {currentStreak}
            </motion.div>
          )}
        </div>

        {/* Stars earned */}
        <div className="bg-white/90 rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
          <span>⭐</span>
          <span className="font-bold">{correctAnswers}</span>
        </div>
      </motion.div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {!showIntro && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProblem.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-2xl"
            >
              {renderGameContent()}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Your avatar at bottom */}
      <motion.div
        className="flex justify-center mt-4 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={showFeedback && isCorrect ? { y: [0, -20, 0], scale: [1, 1.2, 1] } : { y: [0, -3, 0] }}
          transition={{ duration: showFeedback ? 0.5 : 2, repeat: showFeedback ? 0 : Infinity }}
        >
          <PresetAvatar
            style={avatarStyle}
            emotion={showFeedback && isCorrect ? 'celebrating' : 'happy'}
            skinTone={skinTone}
            hairColor={hairColor}
            primaryColor={primaryColor}
            size={80}
            animate={true}
          />
        </motion.div>
      </motion.div>

      {/* Feedback overlay */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`text-4xl md:text-6xl font-bold p-8 rounded-3xl
                ${isCorrect ? 'bg-green-400/95 text-white' : 'bg-yellow-400/95 text-gray-800'}`}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
            >
              {feedbackMessage}
            </motion.div>

            {/* Confetti */}
            {isCorrect && (
              <>
                {[...Array(15)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-4xl"
                    style={{ left: `${(i * 13) % 80 + 10}%`, top: '30%' }}
                    initial={{ y: 0, opacity: 1, scale: 0 }}
                    animate={{ y: 200, opacity: 0, scale: 1, rotate: 720 }}
                    transition={{ duration: 1.2, delay: i * 0.05 }}
                  >
                    {['⭐', '✨', '🌟', '💫', '🎉'][i % 5]}
                  </motion.span>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level complete */}
      <AnimatePresence>
        {showComplete && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
            >
              {/* Stars */}
              <div className="flex justify-center gap-4 mb-4">
                {[...Array(3)].map((_, i) => {
                  const earned = i < Math.ceil((correctAnswers / totalProblems) * 3)
                  return (
                    <motion.span
                      key={i}
                      className={`text-6xl ${earned ? '' : 'opacity-30'}`}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3 + i * 0.2 }}
                    >
                      ⭐
                    </motion.span>
                  )
                })}
              </div>

              <motion.h2
                className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {getRandomMessage('levelComplete')}
              </motion.h2>

              <p className="text-xl text-gray-600 mb-6">
                {correctAnswers} / {totalProblems} correct!
              </p>

              <div className="flex gap-4 justify-center">
                <motion.button
                  className="px-6 py-3 bg-gray-200 rounded-2xl font-bold text-lg"
                  onClick={() => router.push(`/worlds/${worldId}`)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Back
                </motion.button>
                {moduleId < 3 && (
                  <motion.button
                    className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-2xl font-bold text-lg"
                    onClick={() => router.push(`/worlds/${worldId}/${levelId}/${moduleId + 1}`)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next! →
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Celebration confetti */}
            {[...Array(30)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-4xl"
                style={{ left: `${(i * 7) % 100}%`, top: '-10%' }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: '110vh', rotate: 720, opacity: 0 }}
                transition={{ duration: 2 + (i % 3) * 0.5, delay: i * 0.05 }}
              >
                {['⭐', '🌟', '✨', '🎉', '🎊', '💫'][i % 6]}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Celebration Overlay */}
      <CelebrationOverlay
        celebration={celebration}
        onDismiss={() => {
          dismissCelebration()
          setShowComplete(true)
        }}
        autoDismissMs={4000}
      />
    </main>
  )
}