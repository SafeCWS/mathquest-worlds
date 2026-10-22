// Safari "Block All Cookies" from the first line: the times-table grid and the emoji picker
// must still hydrate and work. Both failed on 3401b57 (stuck on the loader).
import './blockedStorageShim'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { useMultiplicationStore } from '../multiplicationStore'
import { useEmojiThemeStore } from '../emojiThemeStore'

test('multiplication store hydrates and records stars with storage blocked', async () => {
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(useMultiplicationStore.getState()._hasHydrated, true)
  useMultiplicationStore.getState().recordModeScore(1, 'match', 3)
  await useMultiplicationStore.persist.rehydrate()
  assert.equal(useMultiplicationStore.getState().tables[1].totalStars, 3)
  assert.deepEqual(useMultiplicationStore.getState().unlockedTables, [1, 2])
})

test('emoji store hydrates and keeps a pick with storage blocked', async () => {
  assert.equal(useEmojiThemeStore.getState()._hasHydrated, true)
  useEmojiThemeStore.getState().setTableEmoji(4, '🐢')
  await useEmojiThemeStore.persist.rehydrate()
  assert.equal(useEmojiThemeStore.getState().getTableEmoji(4), '🐢')
})
