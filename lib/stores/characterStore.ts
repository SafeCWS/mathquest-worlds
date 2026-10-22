// Character customization state store
//
// Storage hardening (red-team round 2 M1, yokoten of 25ba930 / 5d0dcc1): hydration ALWAYS
// finishes — corrupt JSON, blocked or full storage (see safeStorage.ts) — because `/`,
// `/worlds`, `/wardrobe`, `/progress`, `/parent`, `/create-character` and `/preferences`
// all sit on their loader until `_hasHydrated`. A tampered field falls back to its default
// one by one (a bad avatarStyle or emotion would otherwise crash PresetAvatar), and a
// character made this session is never un-made by a stale saved copy.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  BODY_TYPES,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  EYE_SHAPES,
  EYE_COLORS,
  OUTFITS,
  ACCESSORIES,
  PETS,
  EFFECTS,
  PRIMARY_COLORS
} from '@/lib/constants/characterItems'
import { CURRENT_SCHEMA_VERSION, migrate } from '@/lib/character/schema'
import { safeJSONStorage } from './safeStorage'

// Avatar styles available for selection
export type AvatarStyle = 'explorer' | 'wizard' | 'astronaut' | 'pirate' | 'ninja' | 'fairy' | 'robot' | 'superhero' | 'unicorn' | 'scientist' | 'dragon' | 'mermaid'

// Re-export PRIMARY_COLORS so existing consumers (`app/wardrobe/page.tsx`,
// `app/create-character/page.tsx`) keep compiling without import-path churn.
// Source of truth is `lib/constants/characterItems.ts`. See Phase 4.0.
export { PRIMARY_COLORS }

export interface CharacterState {
  // Hydration tracking for SSR
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void

  // Character created flag
  hasCreatedCharacter: boolean
  characterName: string

  // Preset avatar style (NEW)
  avatarStyle: AvatarStyle
  primaryColor: string // Main accent color for avatar

  // Base character (kept for legacy/custom mode)
  bodyType: string
  skinTone: string

  // Appearance
  hairStyle: string
  hairColor: string
  eyeShape: string
  eyeColor: string

  // Outfit & accessories
  outfit: string
  accessories: string[]

  // Pet
  petBuddy: string

  // Effects
  effects: string[]

  // Animation/Emotion state
  animationState: 'idle' | 'happy' | 'dance' | 'wave' | 'jump'
  emotion: 'neutral' | 'happy' | 'excited' | 'thinking' | 'sad' | 'celebrating'

  // Actions
  setCharacterName: (name: string) => void
  setAvatarStyle: (style: AvatarStyle) => void
  setPrimaryColor: (color: string) => void
  setBodyType: (type: string) => void
  setSkinTone: (tone: string) => void
  setHairStyle: (style: string) => void
  setHairColor: (color: string) => void
  setEyeShape: (shape: string) => void
  setEyeColor: (color: string) => void
  setOutfit: (outfit: string) => void
  toggleAccessory: (accessory: string) => void
  setPetBuddy: (pet: string) => void
  toggleEffect: (effect: string) => void
  setAnimationState: (state: CharacterState['animationState']) => void
  setEmotion: (emotion: CharacterState['emotion']) => void
  randomizeCharacter: () => void
  /**
   * Randomize ALL 11 customization fields.
   *
   * Phase 3.1 fix — the legacy `randomizeCharacter` only touched 4 of 11 fields
   * (avatarStyle, primaryColor, skinTone, hairColor), which left things like
   * outfit, accessories, eye shape, and pet stuck on whatever the kid had
   * before. The "Surprise Me!" button is supposed to feel like a complete
   * re-roll, so this method covers everything.
   */
  randomizeAll: () => void
  saveCharacter: () => void
  resetCharacter: () => void
}

// Get random item from array
// Accept both mutable and `as const` arrays so we can pull from frozen
// constant tuples like PRIMARY_COLORS without copying them at every roll.
const randomItem = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// Avatar style options
const AVATAR_STYLES: AvatarStyle[] = ['explorer', 'wizard', 'astronaut', 'pirate', 'ninja', 'fairy', 'robot', 'superhero', 'unicorn', 'scientist', 'dragon', 'mermaid']

// Default character state
const defaultCharacter = {
  hasCreatedCharacter: false,
  characterName: '',
  avatarStyle: 'explorer' as AvatarStyle,
  primaryColor: PRIMARY_COLORS[0], // Blue
  bodyType: BODY_TYPES[1].id, // Regular body
  skinTone: SKIN_TONES[2],
  hairStyle: HAIR_STYLES[2].id, // Long straight
  hairColor: HAIR_COLORS[1].color, // Dark brown
  eyeShape: EYE_SHAPES[0].id, // Round
  eyeColor: EYE_COLORS[0], // Brown
  outfit: OUTFITS[0].id, // Casual tee
  accessories: [],
  petBuddy: PETS[1].id, // Parrot
  effects: [],
  animationState: 'idle' as const,
  emotion: 'happy' as const
}

// --- Persisted shape + load-time sanitising -------------------------------------------

const ANIMATION_STATES: readonly CharacterState['animationState'][] = ['idle', 'happy', 'dance', 'wave', 'jump']
const EMOTIONS: readonly CharacterState['emotion'][] = ['neutral', 'happy', 'excited', 'thinking', 'sad', 'celebrating']
const MAX_ACCESSORIES = 3 // same caps as toggleAccessory / toggleEffect
const MAX_EFFECTS = 2
const MAX_NAME_LENGTH = 40 // the input allows 20; generous so no real name is cut
const MAX_ID_LENGTH = 64

type PersistedCharacter = Pick<CharacterState, keyof typeof defaultCharacter>

const PERSISTED_KEYS = Object.keys(defaultCharacter) as (keyof PersistedCharacter)[]

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v)
const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_ID_LENGTH
const oneOf = <T extends string>(allowed: readonly T[], v: unknown, fb: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fb
const idList = (v: unknown, cap: number, fb: string[]): string[] =>
  Array.isArray(v) ? [...new Set(v.filter(isId))].slice(0, cap) : fb

/**
 * Every persisted field, each either valid or taken from `fb`. Never throws.
 * Exported for tests. Item ids are type/length-checked only (not against today's catalog),
 * so a saved id from an older catalog is kept exactly as the original merge kept it.
 */
export function sanitizeCharacter(v: unknown, fb: PersistedCharacter): PersistedCharacter {
  const s = isRecord(v) ? v : {}
  const id = (k: 'bodyType' | 'skinTone' | 'hairStyle' | 'hairColor' | 'eyeShape' | 'eyeColor' | 'outfit' | 'petBuddy') =>
    isId(s[k]) ? (s[k] as string) : fb[k]
  return {
    hasCreatedCharacter: typeof s.hasCreatedCharacter === 'boolean' ? s.hasCreatedCharacter : fb.hasCreatedCharacter,
    characterName: typeof s.characterName === 'string' ? s.characterName.slice(0, MAX_NAME_LENGTH) : fb.characterName,
    avatarStyle: oneOf(AVATAR_STYLES, s.avatarStyle, fb.avatarStyle),
    primaryColor: oneOf(PRIMARY_COLORS as readonly string[], s.primaryColor, fb.primaryColor),
    bodyType: id('bodyType'),
    skinTone: id('skinTone'),
    hairStyle: id('hairStyle'),
    hairColor: id('hairColor'),
    eyeShape: id('eyeShape'),
    eyeColor: id('eyeColor'),
    outfit: id('outfit'),
    accessories: idList(s.accessories, MAX_ACCESSORIES, fb.accessories),
    petBuddy: id('petBuddy'),
    effects: idList(s.effects, MAX_EFFECTS, fb.effects),
    animationState: oneOf(ANIMATION_STATES, s.animationState, fb.animationState),
    emotion: oneOf(EMOTIONS, s.emotion, fb.emotion),
  } as PersistedCharacter
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      ...defaultCharacter,
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      setCharacterName: (name) => set({ characterName: name }),

      setAvatarStyle: (style) => set({ avatarStyle: style }),

      setPrimaryColor: (color) => set({ primaryColor: color }),

      setBodyType: (type) => set({ bodyType: type }),

      setSkinTone: (tone) => set({ skinTone: tone }),

      setHairStyle: (style) => set({ hairStyle: style }),

      setHairColor: (color) => set({ hairColor: color }),

      setEyeShape: (shape) => set({ eyeShape: shape }),

      setEyeColor: (color) => set({ eyeColor: color }),

      setOutfit: (outfit) => set({ outfit }),

      toggleAccessory: (accessory) => {
        const current = get().accessories
        if (current.includes(accessory)) {
          set({ accessories: current.filter((a) => a !== accessory) })
        } else {
          // Allow up to 3 accessories
          if (current.length < 3) {
            set({ accessories: [...current, accessory] })
          }
        }
      },

      setPetBuddy: (pet) => set({ petBuddy: pet }),

      toggleEffect: (effect) => {
        const current = get().effects
        if (current.includes(effect)) {
          set({ effects: current.filter((e) => e !== effect) })
        } else {
          // Allow up to 2 effects
          if (current.length < 2) {
            set({ effects: [...current, effect] })
          }
        }
      },

      setAnimationState: (state) => set({ animationState: state }),

      setEmotion: (emotion) => set({ emotion }),

      // Single source-of-truth random function. Both legacy `randomizeCharacter`
      // and the Phase-3 `randomizeAll` call this — keeps behaviour identical
      // and lets us delete the legacy alias once nothing imports it.
      randomizeAll: () => {
        const freeHairColors = HAIR_COLORS.filter((h) => h.unlockType === 'free')
        const freeAccessories = ACCESSORIES.filter((a) => a.unlockType === 'free')
        const freeEffects = EFFECTS.filter((e) => e.unlockType === 'free')

        // Pick 0–2 accessories at random (the toggleAccessory cap is 3, but a
        // re-roll that always maxes out feels noisy; 0–2 keeps it readable).
        const accessoryCount = Math.floor(Math.random() * 3)
        const shuffledAcc = [...freeAccessories].sort(() => Math.random() - 0.5)
        const pickedAccessories = shuffledAcc
          .slice(0, accessoryCount)
          .map((a) => a.id)
          .filter((id) => id !== 'acc-none')

        // Pick 0–1 free effect (kids' free tier is mostly 'none'; we keep the
        // option to roll into it so re-rolls clear effects sometimes).
        const pickedEffect = randomItem(freeEffects)
        const effects =
          pickedEffect.id === 'effect-none' ? [] : [pickedEffect.id]

        set({
          avatarStyle: randomItem(AVATAR_STYLES),
          primaryColor: randomItem(PRIMARY_COLORS),
          skinTone: randomItem(SKIN_TONES),
          hairStyle: randomItem(HAIR_STYLES).id,
          hairColor: randomItem(freeHairColors).color,
          eyeShape: randomItem(EYE_SHAPES).id,
          eyeColor: randomItem(EYE_COLORS),
          outfit: randomItem(OUTFITS).id,
          accessories: pickedAccessories,
          petBuddy: randomItem(PETS).id,
          effects,
        })
      },

      // Legacy entry point — kept as an alias so older imports keep compiling.
      // Delegates to randomizeAll so behaviour is unified.
      randomizeCharacter: () => {
        get().randomizeAll()
      },

      saveCharacter: () => {
        set({ hasCreatedCharacter: true })
      },

      resetCharacter: () => {
        set(defaultCharacter)
      }
    }),
    {
      name: 'mathquest-character',
      version: CURRENT_SCHEMA_VERSION,
      // migrate() handles v1→v2 (and any future Vn→Vn+1) shape changes for the
      // persisted blob. Zustand calls this BEFORE merging into the live store,
      // so any keys we drop here never make it into state.
      //
      // Why migrate() lives in lib/character/schema.ts and not inline:
      // keeps the type definitions (CharacterStateV1, V2) co-located with the
      // migration logic, and makes the migration testable in isolation.
      //
      // Phase 4.0 decision on schemaVersion bookkeeping:
      // We strip `schemaVersion` and `updatedAt` from the merged blob and rely
      // on Zustand's own `version: CURRENT_SCHEMA_VERSION` config (above) to
      // decide whether `migrate()` runs on next rehydrate. This keeps
      // CharacterState clean of bookkeeping fields the app never reads.
      // The schema markers DO live inside migrate()'s return value (used by
      // tests and the v1→v2 type guard in schema.ts), they just don't reach
      // live state.
      migrate: (persistedState, _version) => {
        const migrated = migrate(persistedState)
        const { schemaVersion: _sv, updatedAt: _ts, ...rest } = migrated
        return rest as PersistedCharacter // merge() sanitises every field
      },
      // Never throws (corrupt JSON / blocked / full storage → null or swallowed).
      storage: safeJSONStorage<PersistedCharacter>(),
      // Only the character fields — never `_hasHydrated`, never a key that could shadow an
      // action. Same keys as before, so an existing save reads back unchanged.
      partialize: (s) => {
        const out: Record<string, unknown> = {}
        for (const k of PERSISTED_KEYS) out[k] = s[k]
        return out as PersistedCharacter
      },
      // Unknown keys are dropped; each bad field falls back to the live value. A character
      // made this session (storage blocked, or another tab's stale copy) is never un-made.
      merge: (persisted, current) => {
        const live = sanitizeCharacter(current, defaultCharacter as PersistedCharacter)
        const saved = sanitizeCharacter(persisted, live)
        return { ...current, ...(live.hasCreatedCharacter && !saved.hasCreatedCharacter ? live : saved) }
      },
      // Success AND error: a failed rehydrate must never leave the page on its loader.
      // `initial` (not useCharacterStore): the first hydrate runs inside create().
      onRehydrateStorage: (initial) => () => {
        initial.setHasHydrated(true)
      },
    }
  )
)
