// Daily Bonus state store with localStorage persistence
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DailyBonusState {
  // Tracking
  lastLoginDate: string | null
  consecutiveDays: number
  hasClaimedToday: boolean
  totalBonusStarsEarned: number

  // Actions
  checkDailyBonus: () => { isNewDay: boolean; bonusStars: number; consecutiveDays: number }
  claimDailyBonus: () => number
  isDailyBonusAvailable: () => boolean
  getConsecutiveDays: () => number
  resetDailyBonus: () => void
}

const getDateString = () => new Date().toISOString().split('T')[0]

const getYesterdayString = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

// Bonus stars increase with consecutive days (max 5 stars)
const calculateBonusStars = (consecutiveDays: number): number => {
  return Math.min(1 + Math.floor(consecutiveDays / 3), 5)
}

export const useDailyBonusStore = create<DailyBonusState>()(
  persist(
    (set, get) => ({
      lastLoginDate: null,
      consecutiveDays: 0,
      hasClaimedToday: false,
      totalBonusStarsEarned: 0,

      checkDailyBonus: () => {
        const today = getDateString()
        const yesterday = getYesterdayString()
        const { lastLoginDate, consecutiveDays } = get()

        // Same day - no new bonus
        if (lastLoginDate === today) {
          return {
            isNewDay: false,
            bonusStars: 0,
            consecutiveDays
          }
        }

        // Calculate new consecutive days
        let newConsecutiveDays = 1
        if (lastLoginDate === yesterday) {
          // Played yesterday - continue streak
          newConsecutiveDays = consecutiveDays + 1
        }
        // If missed more than 1 day, streak resets to 1

        const bonusStars = calculateBonusStars(newConsecutiveDays)

        return {
          isNewDay: true,
          bonusStars,
          consecutiveDays: newConsecutiveDays
        }
      },

      claimDailyBonus: () => {
        const today = getDateString()
        const { lastLoginDate, consecutiveDays, hasClaimedToday } = get()

        // Already claimed today
        if (hasClaimedToday && lastLoginDate === today) {
          return 0
        }

        const yesterday = getYesterdayString()
        let newConsecutiveDays = 1

        if (lastLoginDate === yesterday) {
          newConsecutiveDays = consecutiveDays + 1
        }

        const bonusStars = calculateBonusStars(newConsecutiveDays)

        set({
          lastLoginDate: today,
          consecutiveDays: newConsecutiveDays,
          hasClaimedToday: true,
          totalBonusStarsEarned: get().totalBonusStarsEarned + bonusStars
        })

        return bonusStars
      },

      isDailyBonusAvailable: () => {
        const today = getDateString()
        const { lastLoginDate, hasClaimedToday } = get()

        // New day = bonus available
        if (lastLoginDate !== today) {
          return true
        }

        // Same day but not claimed yet
        return !hasClaimedToday
      },

      getConsecutiveDays: () => {
        const today = getDateString()
        const yesterday = getYesterdayString()
        const { lastLoginDate, consecutiveDays } = get()

        if (lastLoginDate === today) {
          return consecutiveDays
        }
        if (lastLoginDate === yesterday) {
          return consecutiveDays + 1
        }
        return 1 // Starting fresh
      },

      resetDailyBonus: () => {
        set({
          lastLoginDate: null,
          consecutiveDays: 0,
          hasClaimedToday: false,
          totalBonusStarsEarned: 0
        })
      }
    }),
    {
      name: 'mathquest-daily-bonus',
      version: 1
    }
  )
)
