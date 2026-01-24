// Daily Challenge State Store
import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  DailyChallenge,
  generateDailyChallenge,
  getTodaysChallengeId,
  isNewChallenge
} from "@/lib/dailyChallenges"

export interface DailyChallengeProgress {
  questionsAnswered: number
  correctAnswers: number
  currentStreak: number
  bestStreak: number
  modulesCompleted: number
  startedAt: number | null
}

export interface DailyChallengeState {
  // Current challenge
  currentChallenge: DailyChallenge | null
  lastChallengeId: string | null
  lastRefreshDate: string | null

  // Completion status
  isCompleted: boolean
  completedAt: number | null
  progress: DailyChallengeProgress

  // Celebration state
  showCelebration: boolean

  // Actions
  refreshChallenge: (skillLevel: 'beginner' | 'intermediate' | 'advanced') => void
  recordProgress: (correct: boolean) => void
  recordModuleComplete: (worldId: string, levelId: number, moduleId: number) => void
  checkCompletion: () => boolean
  markComplete: () => void
  showCompleteCelebration: () => void
  hideCelebration: () => void
  resetDailyProgress: () => void
}

const getDateString = () => new Date().toISOString().split('T')[0]

const initialProgress: DailyChallengeProgress = {
  questionsAnswered: 0,
  correctAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  modulesCompleted: 0,
  startedAt: null
}

export const useDailyChallengeStore = create<DailyChallengeState>()(
  persist(
    (set, get) => ({
      currentChallenge: null,
      lastChallengeId: null,
      lastRefreshDate: null,
      isCompleted: false,
      completedAt: null,
      progress: initialProgress,
      showCelebration: false,

      refreshChallenge: (skillLevel) => {
        const today = getDateString()
        const { lastRefreshDate, lastChallengeId } = get()

        if (lastRefreshDate !== today || isNewChallenge(lastChallengeId)) {
          const challenge = generateDailyChallenge(new Date(), skillLevel)
          set({
            currentChallenge: challenge,
            lastChallengeId: challenge.id,
            lastRefreshDate: today,
            isCompleted: false,
            completedAt: null,
            progress: initialProgress,
            showCelebration: false
          })
        }
      },

      recordProgress: (correct) => {
        const { progress, isCompleted } = get()
        if (isCompleted) return

        const newStreak = correct ? progress.currentStreak + 1 : 0
        set({
          progress: {
            ...progress,
            questionsAnswered: progress.questionsAnswered + 1,
            correctAnswers: correct ? progress.correctAnswers + 1 : progress.correctAnswers,
            currentStreak: newStreak,
            bestStreak: Math.max(newStreak, progress.bestStreak),
            startedAt: progress.startedAt || Date.now()
          }
        })

        get().checkCompletion()
      },

      recordModuleComplete: (worldId, levelId, moduleId) => {
        const { currentChallenge, progress, isCompleted } = get()
        if (isCompleted) return

        if (currentChallenge?.type === 'worldExplorer') {
          if (
            currentChallenge.worldId === worldId &&
            currentChallenge.levelId === levelId &&
            currentChallenge.moduleId === moduleId
          ) {
            set({
              progress: {
                ...progress,
                modulesCompleted: progress.modulesCompleted + 1
              }
            })
            get().checkCompletion()
          }
        }
      },

      checkCompletion: () => {
        const { currentChallenge, progress, isCompleted } = get()
        if (!currentChallenge || isCompleted) return false

        let completed = false

        switch (currentChallenge.type) {
          case 'speedRound':
            completed = progress.questionsAnswered >= currentChallenge.targetValue
            break
          case 'perfectScore':
            completed = progress.correctAnswers >= currentChallenge.targetValue
            break
          case 'worldExplorer':
            completed = progress.modulesCompleted >= currentChallenge.targetValue
            break
          case 'streakBuilder':
            completed = progress.bestStreak >= currentChallenge.targetValue
            break
        }

        if (completed) {
          get().markComplete()
        }

        return completed
      },

      markComplete: () => {
        set({
          isCompleted: true,
          completedAt: Date.now()
        })
      },

      showCompleteCelebration: () => {
        set({ showCelebration: true })
      },

      hideCelebration: () => {
        set({ showCelebration: false })
      },

      resetDailyProgress: () => {
        set({
          currentChallenge: null,
          lastChallengeId: null,
          lastRefreshDate: null,
          isCompleted: false,
          completedAt: null,
          progress: initialProgress,
          showCelebration: false
        })
      }
    }),
    {
      name: 'mathquest-daily-challenge',
      version: 1
    }
  )
)
