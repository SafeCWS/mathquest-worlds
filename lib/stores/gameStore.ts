// Game session state store
import { create } from 'zustand'
import type { InteractionType, MathOperation } from '@/lib/constants/levels'

export interface MathProblem {
  id: number
  type: MathOperation
  num1: number
  num2: number
  answer: number
  options: number[] // For multiple choice
  interactionType: InteractionType
  countingObjects?: string[] // For counting problems
}

export interface GameState {
  // Current game session
  isPlaying: boolean
  currentWorldId: string | null
  currentLevelId: number | null
  currentModuleId: number | null

  // Problem state
  currentProblem: MathProblem | null
  problemIndex: number
  totalProblems: number
  problems: MathProblem[]

  // Score tracking
  correctAnswers: number
  incorrectAnswers: number
  currentStreak: number
  bestStreakInSession: number

  // Timing
  startTime: number | null
  timePerProblem: number[] // Track time per problem

  // Answer state
  selectedAnswer: number | null
  isAnswerSubmitted: boolean
  isCorrect: boolean | null

  // Sound settings
  soundEnabled: boolean
  musicEnabled: boolean

  // Actions
  startGame: (worldId: string, levelId: number, moduleId: number, problems: MathProblem[]) => void
  submitAnswer: (answer: number) => { correct: boolean; streakBonus: boolean }
  nextProblem: () => boolean // Returns true if more problems, false if done
  endGame: () => { stars: number; timeBonus: boolean }
  toggleSound: () => void
  toggleMusic: () => void
  resetGame: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  isPlaying: false,
  currentWorldId: null,
  currentLevelId: null,
  currentModuleId: null,
  currentProblem: null,
  problemIndex: 0,
  totalProblems: 0,
  problems: [],
  correctAnswers: 0,
  incorrectAnswers: 0,
  currentStreak: 0,
  bestStreakInSession: 0,
  startTime: null,
  timePerProblem: [],
  selectedAnswer: null,
  isAnswerSubmitted: false,
  isCorrect: null,
  soundEnabled: true,
  musicEnabled: true,

  startGame: (worldId, levelId, moduleId, problems) => {
    set({
      isPlaying: true,
      currentWorldId: worldId,
      currentLevelId: levelId,
      currentModuleId: moduleId,
      problems,
      currentProblem: problems[0] || null,
      problemIndex: 0,
      totalProblems: problems.length,
      correctAnswers: 0,
      incorrectAnswers: 0,
      currentStreak: 0,
      bestStreakInSession: 0,
      startTime: Date.now(),
      timePerProblem: [],
      selectedAnswer: null,
      isAnswerSubmitted: false,
      isCorrect: null
    })
  },

  submitAnswer: (answer) => {
    const state = get()
    const correct = answer === state.currentProblem?.answer
    const newStreak = correct ? state.currentStreak + 1 : 0
    const streakBonus = newStreak === 3 || newStreak === 5 || newStreak === 10

    set({
      selectedAnswer: answer,
      isAnswerSubmitted: true,
      isCorrect: correct,
      correctAnswers: correct ? state.correctAnswers + 1 : state.correctAnswers,
      incorrectAnswers: correct ? state.incorrectAnswers : state.incorrectAnswers + 1,
      currentStreak: newStreak,
      bestStreakInSession: Math.max(newStreak, state.bestStreakInSession)
    })

    return { correct, streakBonus }
  },

  nextProblem: () => {
    const state = get()
    const nextIndex = state.problemIndex + 1

    // Record time for this problem
    const now = Date.now()
    const problemTime = state.startTime
      ? now - state.startTime - state.timePerProblem.reduce((a, b) => a + b, 0)
      : 0

    if (nextIndex >= state.problems.length) {
      // No more problems
      set({
        timePerProblem: [...state.timePerProblem, problemTime]
      })
      return false
    }

    set({
      problemIndex: nextIndex,
      currentProblem: state.problems[nextIndex],
      selectedAnswer: null,
      isAnswerSubmitted: false,
      isCorrect: null,
      timePerProblem: [...state.timePerProblem, problemTime]
    })

    return true
  },

  endGame: () => {
    const state = get()
    const percentage = state.correctAnswers / state.totalProblems

    // Calculate stars
    let stars = 0
    if (percentage >= 1) stars = 3
    else if (percentage >= 0.8) stars = 2
    else if (percentage >= 0.6) stars = 1

    // Time bonus: average under 10 seconds per problem
    const totalTime = state.timePerProblem.reduce((a, b) => a + b, 0)
    const avgTime = totalTime / state.totalProblems
    const timeBonus = avgTime < 10000 && stars > 0

    set({ isPlaying: false })

    return { stars, timeBonus }
  },

  toggleSound: () => {
    set((state) => ({ soundEnabled: !state.soundEnabled }))
  },

  toggleMusic: () => {
    set((state) => ({ musicEnabled: !state.musicEnabled }))
  },

  resetGame: () => {
    set({
      isPlaying: false,
      currentWorldId: null,
      currentLevelId: null,
      currentModuleId: null,
      currentProblem: null,
      problemIndex: 0,
      totalProblems: 0,
      problems: [],
      correctAnswers: 0,
      incorrectAnswers: 0,
      currentStreak: 0,
      bestStreakInSession: 0,
      startTime: null,
      timePerProblem: [],
      selectedAnswer: null,
      isAnswerSubmitted: false,
      isCorrect: null
    })
  }
}))
