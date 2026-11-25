// Game preferences state store
//
// Storage hardening (red-team round 2 M1 yokoten): /preferences waits on `_hasHydrated`, so
// hydration ALWAYS finishes (corrupt JSON, blocked or full storage — see safeStorage.ts) and
// each tampered field falls back to its default on load.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeJSONStorage } from './safeStorage'

export type SoundPreference = 'on' | 'off' | 'music-only' | 'sfx-only'
export type AnimationPreference = 'full' | 'reduced' | 'minimal'

export type MathOperation = 'counting' | 'addition' | 'subtraction' | 'multiplication' | 'division'
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

const OPERATIONS: readonly MathOperation[] = ['counting', 'addition', 'subtraction', 'multiplication', 'division']
const GAME_STYLES: readonly GameStyle[] = ['tap', 'drag', 'mixed']
const SOUND_PREFS: readonly SoundPreference[] = ['on', 'off', 'music-only', 'sfx-only']
const ANIMATION_PREFS: readonly AnimationPreference[] = ['full', 'reduced', 'minimal']

type PersistedPreferences = typeof defaultPreferences

const oneOf = <T extends string>(allowed: readonly T[], v: unknown, fb: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fb
const bool = (v: unknown, fb: boolean): boolean => (typeof v === 'boolean' ? v : fb)
const volume = (v: unknown, fb: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : fb

/** Every persisted preference, each either valid or taken from `fb`. Never throws. */
export function sanitizePreferences(v: unknown, fb: PersistedPreferences): PersistedPreferences {
  const s = v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  const ops = Array.isArray(s.operations)
    ? [...new Set(s.operations.filter((o): o is MathOperation => (OPERATIONS as readonly unknown[]).includes(o)))]
    : null
  return {
    operations: ops && ops.length > 0 ? ops : fb.operations,
    gameStyle: oneOf(GAME_STYLES, s.gameStyle, fb.gameStyle),
    soundPreference: oneOf(SOUND_PREFS, s.soundPreference, fb.soundPreference),
    musicVolume: volume(s.musicVolume, fb.musicVolume),
    sfxVolume: volume(s.sfxVolume, fb.sfxVolume),
    animationPreference: oneOf(ANIMATION_PREFS, s.animationPreference, fb.animationPreference),
    showHints: bool(s.showHints, fb.showHints),
    showTimer: bool(s.showTimer, fb.showTimer),
    largeText: bool(s.largeText, fb.largeText),
    highContrast: bool(s.highContrast, fb.highContrast),
    reduceMotion: bool(s.reduceMotion, fb.reduceMotion),
  }
}

const PREF_KEYS = Object.keys(defaultPreferences) as (keyof PersistedPreferences)[]

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
      storage: safeJSONStorage<PersistedPreferences>(),
      partialize: (s) => {
        const out: Record<string, unknown> = {}
        for (const k of PREF_KEYS) out[k] = s[k]
        return out as PersistedPreferences
      },
      // Any other saved version (older OR newer): keep the (sanitised) preferences.
      migrate: (persisted) => sanitizePreferences(persisted, defaultPreferences),
      merge: (persisted, current) => ({
        ...current,
        ...sanitizePreferences(persisted, sanitizePreferences(current, defaultPreferences)),
      }),
      // Success AND error: a failed rehydrate must never leave the page on its loader.
      // `initial` (not useGamePreferencesStore): the first hydrate runs inside create().
      onRehydrateStorage: (initial) => () => {
        initial.setHasHydrated(true)
      }
    }
  )
)
