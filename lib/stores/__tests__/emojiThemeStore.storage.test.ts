// Yokoten of red-team round 1 #2/#5/#15 onto the emoji picker store. Every test failed on 3401b57.
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { mem, storage } from './memStorage'
import { useEmojiThemeStore } from '../emojiThemeStore'

const KEY = 'mathquest-emoji-theme'
const st = () => useEmojiThemeStore.getState()
const save = (state: unknown, version = 1) => mem.set(KEY, JSON.stringify({ state, version }))

test('corrupt JSON still finishes hydration (no endless loader)', async () => {
  useEmojiThemeStore.setState({ _hasHydrated: false, customEmojis: {} })
  mem.set(KEY, 'not json')
  await useEmojiThemeStore.persist.rehydrate()
  assert.equal(st()._hasHydrated, true)
})

test('tampered picks are dropped on load; valid ones kept; getTableEmoji always a string', async () => {
  useEmojiThemeStore.setState({ customEmojis: {} })
  save({ customEmojis: { 2: '🐶', 3: 42, 4: '', 5: 'x'.repeat(500), 7: null, abc: '🐱', 99: '🐸' } })
  await useEmojiThemeStore.persist.rehydrate()
  assert.deepEqual(st().customEmojis, { 2: '🐶' })
  for (let t = 1; t <= 10; t++) assert.equal(typeof st().getTableEmoji(t), 'string')
})

test('an older or newer saved version keeps the picks', async () => {
  for (const version of [0, 2]) {
    useEmojiThemeStore.setState({ customEmojis: {} })
    save({ customEmojis: { 6: '🦄' } }, version)
    await useEmojiThemeStore.persist.rehydrate()
    assert.equal(st().getTableEmoji(6), '🦄', `version ${version}`)
  }
})

test('quota: a full storage never crashes the picker', () => {
  const real = storage.setItem
  storage.setItem = () => { throw new DOMException('QuotaExceededError', 'QuotaExceededError') }
  try {
    assert.doesNotThrow(() => st().setTableEmoji(8, '🚀'))
    assert.equal(st().getTableEmoji(8), '🚀')
    assert.doesNotThrow(() => st().resetTableEmoji(8))
  } finally {
    storage.setItem = real
  }
})
