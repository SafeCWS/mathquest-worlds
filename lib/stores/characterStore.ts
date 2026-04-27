// Character customization state store
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
  EFFECTS
} from '@/lib/constants/characterItems'
import { CURRENT_SCHEMA_VERSION, migrate } from '@/lib/character/schema'

// Avatar styles available for selection
export type AvatarStyle = 'explorer' | 'wizard' | 'astronaut' | 'pirate' | 'ninja' | 'fairy' | 'robot' | 'superhero' | 'unicorn' | 'scientist' | 'dragon' | 'mermaid'

// Available primary colors for avatar customization
export const PRIMARY_COLORS = [
  '#4A90D9', // Blue
  '#E53E7E', // Pink
  '#38A169', // Green
  '#DD6B20', // Orange
  '#805AD5', // Purple
  '#D69E2E', // Gold
  '#E53E3E', // Red
  '#319795', // Teal
]

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
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

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
      migrate: (persistedState, _version) => {
        const migrated = migrate(persistedState)
        // Strip our schema markers — the rest of the app reads via
        // CharacterState which doesn't know about schemaVersion / updatedAt.
        // (Zustand will merge whatever we return here over `defaultCharacter`.)
        const { schemaVersion: _sv, updatedAt: _ts, ...rest } = migrated
        return rest as Partial<CharacterState>
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
