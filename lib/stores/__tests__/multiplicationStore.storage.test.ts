// Yokoten of red-team round 1 #2/#5/#6/#15 onto the times-table store (the /multiplication grid).
// Every test here failed on 3401b57.
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { mem, storage } from './memStorage'
import { useMultiplicationStore } from '../multiplicationStore'

const KEY = 'mathquest-multiplication'
const st = () => useMultiplicationStore.getState()
const save = (state: unknown, version = 1) => mem.set(KEY, JSON.stringify({ state, version }))
const fresh = () => useMultiplicationStore.setState({ _hasHydrated: false, tables: {}, unlockedTables: [1], speedChallengeUnlocked: false, speedHighScore: 0 })

test('corrupt JSON still finishes hydration (no endless loader)', async () => {
  fresh()
  mem.set(KEY, '{"state":{"tables":')
  await useMultiplicationStore.persist.rehydrate()
  assert.equal(st()._hasHydrated, true)
  assert.deepEqual(st().unlockedTables, [1])
})

test('tampered shapes are sanitised on load and every action still works', async () => {
  fresh()
  save({
    tables: { 2: { explored: 'yes', modeScores: { match: { attempts: -3, bestStars: 99 }, dice: 'x' }, totalStars: 'lots' }, abc: {}, 99: { explored: true } },
    unlockedTables: [1, 'x', 2, 55, -1],
    speedChallengeUnlocked: 'true',
    speedHighScore: Number.NaN,
  })
  await useMultiplicationStore.persist.rehydrate()
  assert.equal(st()._hasHydrated, true)
  assert.deepEqual(Object.keys(st().tables), ['2'])
  const t2 = st().tables[2]
  assert.equal(t2.explored, false)
  assert.deepEqual(t2.modeScores.match, { attempts: 0, bestStars: 3 })
  assert.deepEqual(t2.modeScores.dice, { attempts: 0, bestStars: 0 })
  assert.equal(t2.totalStars, 3)
  assert.equal(t2.mastered, false)
  // junk unlocks dropped; table 3 unlocks honestly because table 2 now has 3 (clamped) stars
  assert.deepEqual(st().unlockedTables, [1, 2, 3])
  assert.equal(st().speedChallengeUnlocked, false)
  assert.equal(st().speedHighScore, 0)
  assert.equal(typeof st().getTotalStars(), 'number')
  assert.doesNotThrow(() => st().recordModeScore(2, 'bubble', 2)) // mode missing from the save
  assert.equal(st().tables[2].totalStars, 5)
})

test('an older or newer saved version keeps progress (migrate, never lower)', async () => {
  for (const version of [0, 2]) {
    fresh()
    save({ tables: { 1: { explored: true, modeScores: { match: { attempts: 4, bestStars: 3 } } } }, unlockedTables: [1, 2], speedHighScore: 12 }, version)
    await useMultiplicationStore.persist.rehydrate()
    assert.equal(st().tables[1]?.modeScores.match.bestStars, 3, `version ${version}`)
    assert.equal(st().tables[1].explored, true)
    assert.deepEqual(st().unlockedTables, [1, 2])
    assert.equal(st().speedHighScore, 12)
  }
})

test('a rehydrate never lowers stars earned in memory', async () => {
  fresh()
  st().recordModeScore(1, 'match', 3)
  save({ tables: { 1: { explored: false, modeScores: { match: { attempts: 1, bestStars: 1 } } } }, unlockedTables: [1] })
  await useMultiplicationStore.persist.rehydrate()
  assert.equal(st().tables[1].modeScores.match.bestStars, 3)
  assert.equal(st().tables[1].totalStars, 3)
  assert.deepEqual(st().unlockedTables, [1, 2])
})

test('quota: a full storage never crashes a finished game', () => {
  fresh()
  const real = storage.setItem
  storage.setItem = () => { throw new DOMException('QuotaExceededError', 'QuotaExceededError') }
  try {
    assert.doesNotThrow(() => st().recordModeScore(3, 'dice', 2))
    assert.doesNotThrow(() => st().markExplored(3))
    assert.equal(st().tables[3].totalStars, 2)
  } finally {
    storage.setItem = real
  }
})
