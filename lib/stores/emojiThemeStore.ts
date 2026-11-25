// Emoji Theme Store — persists child's chosen emoji per times table
// Follows the exact Zustand + persist pattern from multiplicationStore.ts
//
// Storage hardening (yokoten of the Big Multiplication red-team round 1): hydration ALWAYS
// finishes (corrupt JSON, blocked or full storage — see safeStorage.ts), and a tampered pick
// is dropped on load so getTableEmoji() always returns a short string.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_EMOJIS, getEmojiName } from '@/lib/constants/emojiOptions'
import { safeJSONStorage } from './safeStorage'

/** Longest ZWJ emoji sequences are ~11 UTF-16 units; anything longer is not a pick. */
const MAX_EMOJI_LENGTH = 16

/** Keep only picks for tables 1–10 whose value is a short non-empty string. */
export function sanitizeCustomEmojis(v: unknown): Record<number, string> {
  const src = v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {}
  const out: Record<number, string> = {}
  for (const key of Object.keys(src)) {
    const n = Number(key)
    const e = src[key]
    if (Number.isInteger(n) && n >= 1 && n <= 10 && typeof e === 'string' && e.length > 0 && e.length <= MAX_EMOJI_LENGTH) out[n] = e
  }
  return out
}

type PersistedEmojiTheme = { customEmojis: Record<number, string | null> }

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
      storage: safeJSONStorage<PersistedEmojiTheme>(),
      partialize: (s) => ({ customEmojis: s.customEmojis }),
      // Any other saved version (older OR newer): keep the (sanitised) picks.
      migrate: (persisted) => ({ customEmojis: sanitizeCustomEmojis((persisted as { customEmojis?: unknown } | null)?.customEmojis) }),
      // A saved pick wins over the in-memory default, as before; both sanitised.
      merge: (persisted, current) => ({
        ...current,
        customEmojis: {
          ...sanitizeCustomEmojis(current.customEmojis),
          ...sanitizeCustomEmojis((persisted as { customEmojis?: unknown } | null)?.customEmojis),
        },
      }),
      // Success AND error: a failed rehydrate must never leave the page on its loader.
      // `initial` (not useEmojiThemeStore): the first hydrate runs inside create().
      onRehydrateStorage: (initial) => () => {
        initial.setHasHydrated(true)
      },
    }
  )
)
