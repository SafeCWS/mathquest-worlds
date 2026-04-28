// Emoji Theme Store — persists child's chosen emoji per times table
// Follows the exact Zustand + persist pattern from multiplicationStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_EMOJIS, getEmojiName } from '@/lib/constants/emojiOptions'

export interface EmojiThemeState {
  // Hydration tracking for SSR (same pattern as multiplicationStore)
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void

  // User-selected emojis per table (null = use default)
  customEmojis: Record<number, string | null>

  // Actions
  setTableEmoji: (table: number, emoji: string) => void
  resetTableEmoji: (table: number) => void
  getTableEmoji: (table: number) => string
  /**
   * Return the spoken singular/plural name for the table's chosen emoji.
   * Used by TTS so audio matches the visual ("balloons" not "things").
   * Falls back to `'thing'/'things'` if the glyph isn't in EMOJI_NAMES.
   */
  getTableEmojiName: (table: number) => { singular: string; plural: string }
  resetAllEmojis: () => void
}

export const useEmojiThemeStore = create<EmojiThemeState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      customEmojis: {},

      setTableEmoji: (table: number, emoji: string) => {
        set((state) => ({
          customEmojis: {
            ...state.customEmojis,
            [table]: emoji,
          },
        }))
      },

      resetTableEmoji: (table: number) => {
        set((state) => {
          const updated = { ...state.customEmojis }
          delete updated[table]
          return { customEmojis: updated }
        })
      },

      getTableEmoji: (table: number) => {
        const custom = get().customEmojis[table]
        return custom ?? DEFAULT_EMOJIS[table] ?? '⭐'
      },

      getTableEmojiName: (table: number) => {
        const glyph = get().getTableEmoji(table)
        return getEmojiName(glyph)
      },

      resetAllEmojis: () => {
        set({ customEmojis: {} })
      },
    }),
    {
      name: 'mathquest-emoji-theme',
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
