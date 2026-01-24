// Progress and rewards state store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ModuleProgress {
  levelId: number
  moduleId: number
  completed: boolean
  starsEarned: number
  bestScore: number
  attempts: number
}

export interface DiagnosticResult {
  completed: boolean
  correctAnswers: number
  totalQuestions: number
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
  completedAt: string | null
}

export interface ProgressState {
  // Hydration tracking for SSR
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void

  // Total stars
  totalStars: number

  // Current streak
  currentStreak: number
  longestStreak: number
  lastPlayDate: string | null

  // Module progress
  moduleProgress: Record<string, ModuleProgress>

  // Completed levels (level IDs)
  completedLevels: number[]

  // Daily stats
  questionsAnsweredToday: number
  correctAnswersToday: number

  // Adaptive diagnostic system
  diagnosticResult: DiagnosticResult | null
  skillLevel: 'beginner' | 'intermediate' | 'advanced'

  // Actions
  addStars: (amount: number) => void
  updateStreak: () => void
  resetDailyStreak: () => void
  recordModuleComplete: (
    levelId: number,
    moduleId: number,
    stars: number,
    score: number
  ) => void
  markLevelComplete: (levelId: number) => void
  incrementQuestionsToday: (correct: boolean) => void
  recordDiagnostic: (correctAnswers: number, totalQuestions: number) => void
  resetProgress: () => void
}

const getDateString = () => new Date().toISOString().split('T')[0]

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      totalStars: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayDate: null,
      moduleProgress: {},
      completedLevels: [],
      questionsAnsweredToday: 0,
      correctAnswersToday: 0,
      diagnosticResult: null,
      skillLevel: 'beginner',

      addStars: (amount) => {
        set((state) => ({ totalStars: state.totalStars + amount }))
      },

      updateStreak: () => {
        const today = getDateString()
        const { lastPlayDate, currentStreak, longestStreak } = get()

        if (lastPlayDate === today) {
          // Already played today, no change
          return
        }

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayString = yesterday.toISOString().split('T')[0]

        if (lastPlayDate === yesterdayString) {
          // Played yesterday, increment streak
          const newStreak = currentStreak + 1
          set({
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, longestStreak),
            lastPlayDate: today,
            questionsAnsweredToday: 0,
            correctAnswersToday: 0
          })
        } else {
          // Missed a day, reset streak
          set({
            currentStreak: 1,
            lastPlayDate: today,
            questionsAnsweredToday: 0,
            correctAnswersToday: 0
          })
        }
      },

      resetDailyStreak: () => {
        set({ currentStreak: 0 })
      },

      recordModuleComplete: (levelId, moduleId, stars, score) => {
        const key = `${levelId}-${moduleId}`
        const current = get().moduleProgress[key]

        set((state) => ({
          moduleProgress: {
            ...state.moduleProgress,
            [key]: {
              levelId,
              moduleId,
              completed: true,
              starsEarned: Math.max(stars, current?.starsEarned || 0),
              bestScore: Math.max(score, current?.bestScore || 0),
              attempts: (current?.attempts || 0) + 1
            }
          }
        }))

        // Add stars only if better than before
        if (!current || stars > current.starsEarned) {
          const diff = stars - (current?.starsEarned || 0)
          get().addStars(diff)
        }
      },

      markLevelComplete: (levelId) => {
        set((state) => {
          if (state.completedLevels.includes(levelId)) {
            return state
          }
          return { completedLevels: [...state.completedLevels, levelId] }
        })
      },

      incrementQuestionsToday: (correct) => {
        set((state) => ({
          questionsAnsweredToday: state.questionsAnsweredToday + 1,
          correctAnswersToday: correct
            ? state.correctAnswersToday + 1
            : state.correctAnswersToday
        }))
      },

      recordDiagnostic: (correctAnswers, totalQuestions) => {
        const percentage = correctAnswers / totalQuestions
        let skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'

        // Adaptive skill level based on diagnostic performance
        if (percentage >= 0.8) {
          skillLevel = 'advanced' // 8+ out of 10 correct -> harder problems
        } else if (percentage >= 0.5) {
          skillLevel = 'intermediate' // 5-7 out of 10 correct -> medium difficulty
        } else {
          skillLevel = 'beginner' // 0-4 out of 10 correct -> easier, visual counting
        }

        set({
          diagnosticResult: {
            completed: true,
            correctAnswers,
            totalQuestions,
            skillLevel,
            completedAt: new Date().toISOString()
          },
          skillLevel
        })
      },

      resetProgress: () => {
        set({
          totalStars: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastPlayDate: null,
          moduleProgress: {},
          completedLevels: [],
          questionsAnsweredToday: 0,
          correctAnswersToday: 0,
          diagnosticResult: null,
          skillLevel: 'beginner'
        })
      }
    }),
    {
      name: 'mathquest-progress',
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
