// Progress and rewards state store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LEVELS } from '@/lib/constants/levels'

// Phase 4.1 — level gate tuning constants.
//
// `GAMES_TO_UNLOCK` is the user's "force them to play 3-4 games" requirement.
// We picked 3 for V1 because:
//   - 3 pips read as a familiar Toca Boca / DuoLingo trio at-a-glance
//   - bumping to 4 later is a one-line change, no schema migration
//   - 3 successes at 70% threshold = 18 correct answers across the level
//     (3 modules × 3 questions each, 70% pass = 6+ correct per round × 3)
//
// `PASS_THRESHOLD` defines what "successful" means for a single round. 70%
// is generous on purpose — Tina at age 6-10 is still calibrating, and the
// prime directive is forgiveness. Anything ≥ 70% counts toward the pip;
// anything below just doesn't fill one (it never decrements).
export const GAMES_TO_UNLOCK = 3 as const
export const PASS_THRESHOLD = 0.7 as const

export interface ModuleProgress {
  levelId: number
  moduleId: number
  completed: boolean
  starsEarned: number
  bestScore: number
  attempts: number
}

// Phase 4.1 — per-level gate tracking.
//
// Separate from ModuleProgress (which tracks individual mini-games) because
// the gate runs at a coarser grain: "did the kid play THIS level (any
// module) to a successful round 3 times?". Modules and levels can share an
// id namespace, but the gate is conceptually about LEVEL mastery.
//
// `gamesCompleted` is monotonic — only increments on a passing round, never
// decrements. Capped at GAMES_TO_UNLOCK so we don't run unbounded.
export interface LevelGateProgress {
  levelId: number
  gamesCompleted: number  // 0..GAMES_TO_UNLOCK
  bestScorePct: number    // best round so far (0..1)
  lastPlayedAt: number    // epoch ms — used for "Continue where you left off"
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

  // Phase 4.1 — Level gate ("play 3 games to unlock the next level"). Keyed
  // by levelId. Levels not in this map default to {gamesCompleted: 0}.
  levelGateProgress: Record<number, LevelGateProgress>

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

  // Phase 4.1 level-gate API.
  //
  // recordGameComplete: called once per finished round. If scorePct >=
  // PASS_THRESHOLD it advances the level's pip count (capped at
  // GAMES_TO_UNLOCK). Returns the levelId that just unlocked, if any —
  // callers use this to fire celebration UI. Wrong rounds (below threshold)
  // simply don't advance, never punish.
  recordGameComplete: (levelId: number, scorePct: number) => { unlocked: number | null }
  // isLevelGateUnlocked: returns true for the first level (always playable)
  // or when the previous level has hit its pip cap. Independent of the
  // existing star-based isLevelUnlocked() — which we keep so the world map
  // still shows the encouraging "⭐ X to unlock" affordance.
  isLevelGateUnlocked: (levelId: number) => boolean
  // pipsForLevel: 0..GAMES_TO_UNLOCK count for the pip counter UI.
  pipsForLevel: (levelId: number) => number
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
      levelGateProgress: {},
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

      // -------------------------------------------------------------------
      // Phase 4.1 — Level gate methods
      // -------------------------------------------------------------------

      recordGameComplete: (levelId, scorePct) => {
        // Clamp scorePct into [0, 1] defensively. The caller should already
        // be passing a fraction, but a stray "8" or "-0.5" should never
        // corrupt the store — it should just register as 0 or 1.
        const clamped = Math.max(0, Math.min(1, scorePct))
        const isPass = clamped >= PASS_THRESHOLD

        const prev = get().levelGateProgress[levelId]
        const prevGames = prev?.gamesCompleted ?? 0
        const prevBest = prev?.bestScorePct ?? 0

        // The gate's only state mutation: increment pip count on a pass,
        // but never beyond the cap. Wrong rounds still update lastPlayedAt
        // and bestScorePct (we want to remember "kid was here") but DO NOT
        // fill a pip — that's the forgiveness rule from §4.3.
        const nextGames = isPass
          ? Math.min(prevGames + 1, GAMES_TO_UNLOCK)
          : prevGames

        set((state) => ({
          levelGateProgress: {
            ...state.levelGateProgress,
            [levelId]: {
              levelId,
              gamesCompleted: nextGames,
              bestScorePct: Math.max(prevBest, clamped),
              lastPlayedAt: Date.now(),
            },
          },
        }))

        // Did this round push us across the unlock line? We only fire the
        // unlock callback ONCE — when nextGames hits the cap AND prevGames
        // didn't. Subsequent passes on the same level update lastPlayedAt
        // but don't re-unlock. Returns the NEXT level's id (which is what
        // celebration UI should congratulate the kid on).
        const justUnlockedThisLevel =
          isPass && nextGames === GAMES_TO_UNLOCK && prevGames < GAMES_TO_UNLOCK
        if (!justUnlockedThisLevel) {
          return { unlocked: null }
        }

        // Compute the next level id from LEVELS. We use linear progression
        // (level 1 → 2 → 3 → ...) and DON'T jump worlds. If the kid is on
        // the highest level, no unlock fires (graceful end-of-content).
        const idx = LEVELS.findIndex((l) => l.id === levelId)
        const nextLevel = idx >= 0 ? LEVELS[idx + 1] : undefined
        return { unlocked: nextLevel?.id ?? null }
      },

      isLevelGateUnlocked: (levelId) => {
        // First level in LEVELS is always playable — kid needs an entry
        // point. After that, gate opens when the immediately-prior level
        // hit its pip cap.
        const idx = LEVELS.findIndex((l) => l.id === levelId)
        if (idx <= 0) return true  // first level, or unknown id (fail-open)

        const prevLevel = LEVELS[idx - 1]
        const prevProgress = get().levelGateProgress[prevLevel.id]
        return (prevProgress?.gamesCompleted ?? 0) >= GAMES_TO_UNLOCK
      },

      pipsForLevel: (levelId) => {
        // Defensive cap — even if persisted state somehow exceeds the limit
        // (e.g. we lowered GAMES_TO_UNLOCK in a future config tweak), the
        // UI only renders up to GAMES_TO_UNLOCK pips.
        const games = get().levelGateProgress[levelId]?.gamesCompleted ?? 0
        return Math.min(games, GAMES_TO_UNLOCK)
      },

      resetProgress: () => {
        set({
          totalStars: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastPlayDate: null,
          moduleProgress: {},
          completedLevels: [],
          levelGateProgress: {},
          questionsAnsweredToday: 0,
          correctAnswersToday: 0,
          diagnosticResult: null,
          skillLevel: 'beginner'
        })
      }
    }),
    {
      name: 'mathquest-progress',
      // Bumped to v2 with Phase 4.1: adds `levelGateProgress` field. We
      // don't need a migration body — Zustand merges the persisted blob
      // over the initializer, so any pre-v2 saves just inherit the empty
      // {} default for the new field. Legacy `version: 1` saves auto-bump.
      version: 2,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
