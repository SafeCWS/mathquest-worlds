// Red-team probe t2_throw "blocked": Safari "Block All Cookies" — localStorage throws on
// access from the very first line. The game must still load, hydrate and count gems.
import './blockedStorageShim'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { useHoardStore } from '../hoardStore'
import { useBigMultStore } from '../bigMultStore'
import { daysPlayedStreak, markPlayedToday } from '../daysPlayed'

test('stores hydrate with storage blocked (in-memory fallback, no endless loader)', async () => {
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(useHoardStore.getState()._hasHydrated, true)
  assert.equal(useBigMultStore.getState()._hasHydrated, true)
})

test('gems and progress still count with storage blocked, and survive a rehydrate', async () => {
  assert.equal(useHoardStore.getState().add(126), 126)
  useBigMultStore.getState().recordGameComplete(1)
  await useHoardStore.persist.rehydrate()
  await useBigMultStore.persist.rehydrate()
  assert.equal(useHoardStore.getState().gems, 126)
  assert.equal(useBigMultStore.getState().gamesDone[1], 1)
})

test('days-played never throws with storage blocked', () => {
  assert.doesNotThrow(() => markPlayedToday())
  assert.doesNotThrow(() => daysPlayedStreak())
})

test('sound + music modules load and save settings with storage blocked', async () => {
  const { sounds } = await import('../../sounds/webAudioSounds')
  const { music } = await import('../../sounds/musicSounds')
  assert.doesNotThrow(() => { sounds.volume = 0.3 })
  assert.doesNotThrow(() => { music.volume = 0.3 })
})
