/**
 * emojiOptions unit test — QC pass 2026-04-27 (PACA G2 fallback coverage).
 *
 * Asserts {@link getEmojiName} fallback contract for the three malformed-input
 * cases the TTS layer can hit when localStorage is stale, partially-written,
 * or seeded with a glyph that's no longer in EMOJI_NAMES (e.g., the kid's
 * older device chose 🦕 then the picker dropped that option):
 *   - undefined -> EMOJI_NAME_FALLBACK ('thing' / 'things')
 *   - null      -> EMOJI_NAME_FALLBACK
 *   - '🦕'      -> EMOJI_NAME_FALLBACK (unmapped glyph)
 *
 * The TTS layer relies on this contract: getTableEmojiName() never crashes
 * the speak() pipeline, even if storage is corrupt, because the worst case
 * is the kid hears "How many things?" instead of "How many balloons?" — a
 * graceful degradation, not a runtime error.
 *
 * Runner: same as speechUtils.test.ts — `tsx --test` via `npm run test:unit`.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { getEmojiName, EMOJI_NAME_FALLBACK } from '../emojiOptions'

test('getEmojiName(undefined) returns the fallback', () => {
  const name = getEmojiName(undefined)
  assert.deepEqual(name, EMOJI_NAME_FALLBACK)
  assert.equal(name.singular, 'thing')
  assert.equal(name.plural, 'things')
})

test('getEmojiName(null) returns the fallback', () => {
  const name = getEmojiName(null)
  assert.deepEqual(name, EMOJI_NAME_FALLBACK)
})

test('getEmojiName(unmapped glyph) returns the fallback', () => {
  // 🦕 is intentionally NOT in EMOJI_NAMES — it covers the "user picked an
  // emoji from an older build that has since been removed" case.
  const name = getEmojiName('🦕')
  assert.deepEqual(name, EMOJI_NAME_FALLBACK)
})
