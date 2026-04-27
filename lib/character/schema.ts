// Versioned schema for the persisted character store.
//
// Why this exists:
// Phase 3.3 lifts the persistence shape out of the Zustand store so we can
// reason about migrations explicitly. The pre-Phase-3 store used Zustand's
// `version: 1` field with no real migration body, which meant any future shape
// change risked silently dropping fields on an existing kid's saved character
// (Tina has been playing — losing her name + skin tone + hair would be a real
// regression).
//
// Strategy:
// - v1: original shape (everything optional from the rehydrate side)
// - v2: adds `schemaVersion` + `updatedAt` for forward-compat audit trails
// - `migrate()` is a chain: v1→v2 today, v2→v3 tomorrow, etc.
// - On unknown keys we WARN in dev, IGNORE in prod (per plan §3.3 "Never throw")

import type { CharacterState as StoreShape } from '@/lib/stores/characterStore'
import { PRIMARY_COLORS } from '@/lib/constants/characterItems'

// Phase 4.0: PRIMARY_COLORS now imported from `lib/constants/characterItems.ts`
// (the value-only constants module). Earlier we kept an inline snapshot here
// because schema.ts is imported by characterStore.ts during module init and a
// value-level back-import would have created a circular dep. By moving the
// palette into characterItems (which neither file pulls eagerly at top level
// for this value), we get a single source of truth.

export const CURRENT_SCHEMA_VERSION = 2 as const
export type SchemaVersion = 1 | 2

// The fields we actually persist (subset of CharacterState — actions and
// hydration flags are not persisted). Mirrors what Zustand's `partialize`
// would emit if we used one; we don't, so this matches the full state shape
// minus methods.
type PersistedFields = Pick<
  StoreShape,
  | 'hasCreatedCharacter'
  | 'characterName'
  | 'avatarStyle'
  | 'primaryColor'
  | 'bodyType'
  | 'skinTone'
  | 'hairStyle'
  | 'hairColor'
  | 'eyeShape'
  | 'eyeColor'
  | 'outfit'
  | 'accessories'
  | 'petBuddy'
  | 'effects'
  | 'animationState'
  | 'emotion'
>

export type CharacterStateV1 = Partial<PersistedFields>

export type CharacterStateV2 = Partial<PersistedFields> & {
  schemaVersion: 2
  updatedAt: number
}

export type AnyPersistedCharacter = CharacterStateV1 | CharacterStateV2

// Type guard — distinguishes v2 (has the marker) from v1 (legacy / no marker).
function isV2(state: AnyPersistedCharacter): state is CharacterStateV2 {
  return (
    typeof state === 'object' &&
    state !== null &&
    'schemaVersion' in state &&
    (state as CharacterStateV2).schemaVersion === 2
  )
}

// Minimal sanity guard before we trust unknown JSON from localStorage.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Migrate any persisted character state forward to the current schema version.
 * Safe to call on:
 *   - undefined / null (returns a minimal v2 shell with just the version markers)
 *   - v1 state (no schemaVersion field) — bumps to v2
 *   - v2 state — returns as-is (idempotent)
 *   - garbage (string, number, etc.) — returns the minimal v2 shell
 *
 * Never throws. In dev, logs a console.warn for unknown keys we drop.
 */
export function migrate(prev: unknown): CharacterStateV2 {
  // Defensive default — used when persisted state is missing or unparseable.
  // Carries no character fields so the store falls back to its `defaultCharacter`
  // values when these are merged in.
  const shell: CharacterStateV2 = {
    schemaVersion: 2,
    updatedAt: Date.now(),
  }

  if (!isPlainObject(prev)) {
    return shell
  }

  const state = prev as AnyPersistedCharacter

  // Already at current version — hand back unchanged but refresh updatedAt
  // so we always know when migrate() last touched the blob.
  if (isV2(state)) {
    return { ...state, updatedAt: Date.now() }
  }

  // v1 → v2: copy known keys, drop unknown ones (with a dev-mode warning).
  const knownKeys: Array<keyof PersistedFields> = [
    'hasCreatedCharacter',
    'characterName',
    'avatarStyle',
    'primaryColor',
    'bodyType',
    'skinTone',
    'hairStyle',
    'hairColor',
    'eyeShape',
    'eyeColor',
    'outfit',
    'accessories',
    'petBuddy',
    'effects',
    'animationState',
    'emotion',
  ]

  const migrated: CharacterStateV2 = { ...shell }
  const droppedKeys: string[] = []

  for (const key of Object.keys(state)) {
    if ((knownKeys as string[]).includes(key)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(migrated as any)[key] = (state as any)[key]
    } else if (key !== 'schemaVersion' && key !== 'updatedAt') {
      droppedKeys.push(key)
    }
  }

  // Repair: if primaryColor is missing or no longer in PRIMARY_COLORS (e.g. a
  // dropped legacy hex), fall back to the default. Same idea would apply to any
  // enum-like field if its allowed set ever shrinks.
  if (
    migrated.primaryColor &&
    !(PRIMARY_COLORS as readonly string[]).includes(migrated.primaryColor)
  ) {
    droppedKeys.push(`primaryColor (out of palette: ${migrated.primaryColor})`)
    delete migrated.primaryColor
  }

  if (process.env.NODE_ENV !== 'production' && droppedKeys.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[character/schema] v1→v2 migration dropped unknown keys:',
      droppedKeys
    )
  }

  return migrated
}
