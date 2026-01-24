// Game preferences state store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SoundPreference = 'on' | 'off' | 'music-only' | 'sfx-only'
export type AnimationPreference = 'full' | 'reduced' | 'minimal'

export type MathOperation = 'counting' | 'addition' | 'subtraction'
export type GameStyle = 'tap' | 'drag' | 'mixed'

export interface GamePreferencesState {
  // Hydration tracking for SSR
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void

  // Math learning preferences
  operations: MathOperation[]
  gameStyle: GameStyle

  // Sound settings
  soundPreference: SoundPreference
  musicVolume: number // 0-100
  sfxVolume: number // 0-100

  // Animation settings (for performance/accessibility)
  animationPreference: AnimationPreference

  // Display settings
  showHints: boolean
  showTimer: boolean
  largeText: boolean

  // Accessibility
  highContrast: boolean
  reduceMotion: boolean

  // Actions
  setOperations: (ops: MathOperation[]) => void
  setGameStyle: (style: GameStyle) => void
  setSoundPreference: (pref: SoundPreference) => void
  setMusicVolume: (volume: number) => void
  setSfxVolume: (volume: number) => void
  setAnimationPreference: (pref: AnimationPreference) => void
  setShowHints: (show: boolean) => void
  setShowTimer: (show: boolean) => void
  setLargeText: (large: boolean) => void
  setHighContrast: (high: boolean) => void
  setReduceMotion: (reduce: boolean) => void
  resetPreferences: () => void
}

const defaultPreferences = {
  operations: ['counting', 'addition'] as MathOperation[],
  gameStyle: 'mixed' as GameStyle,
  soundPreference: 'on' as SoundPreference,
  musicVolume: 70,
  sfxVolume: 80,
  animationPreference: 'full' as AnimationPreference,
  showHints: true,
  showTimer: false,
  largeText: false,
  highContrast: false,
  reduceMotion: false
}

export const useGamePreferencesStore = create<GamePreferencesState>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      ...defaultPreferences,

      setOperations: (ops) => set({ operations: ops }),

      setGameStyle: (style) => set({ gameStyle: style }),

      setSoundPreference: (pref) => set({ soundPreference: pref }),

      setMusicVolume: (volume) =>
        set({ musicVolume: Math.max(0, Math.min(100, volume)) }),

      setSfxVolume: (volume) =>
        set({ sfxVolume: Math.max(0, Math.min(100, volume)) }),

      setAnimationPreference: (pref) => set({ animationPreference: pref }),

      setShowHints: (show) => set({ showHints: show }),

      setShowTimer: (show) => set({ showTimer: show }),

      setLargeText: (large) => set({ largeText: large }),

      setHighContrast: (high) => set({ highContrast: high }),

      setReduceMotion: (reduce) => {
        // Also update animation preference when reduce motion is toggled
        set({
          reduceMotion: reduce,
          animationPreference: reduce ? 'minimal' : 'full'
        })
      },

      resetPreferences: () => set(defaultPreferences)
    }),
    {
      name: 'mathquest-preferences',
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
