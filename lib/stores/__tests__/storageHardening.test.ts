// Red-team round 1 probes (t1_storage, t2_throw quota, t6_tabs) as unit tests.
// Each one failed on f9d2b1f: endless loader on corrupt JSON, crash on a full disk,
// a hoard / progress that could go DOWN across tabs or a version change.
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { mem, storage, storageEvent } from './memStorage'
import { useHoardStore, HOARD_STORAGE_KEY } from '../hoardStore'
import { useBigMultStore, BIG_MULT_STORAGE_KEY } from '../bigMultStore'
import { markPlayedToday } from '../daysPlayed'

const hoard = () => useHoardStore.getState()
const big = () => useBigMultStore.getState()
const save = (key: string, state: unknown, version = 1) => mem.set(key, JSON.stringify({ state, version }))

test('t1: corrupted hoard JSON still finishes hydration (no endless loader)', async () => {
  useHoardStore.setState({ _hasHydrated: false, gems: 7 })
  mem.set(HOARD_STORAGE_KEY, '{"state":{"gems":5')
  await useHoardStore.persist.rehydrate()
  assert.equal(hoard()._hasHydrated, true)
  assert.equal(hoard().gems, 7)
})

test('t1: corrupted progress JSON still finishes hydration (no endless loader)', async () => {
  useBigMultStore.setState({ _hasHydrated: false })
  mem.set(BIG_MULT_STORAGE_KEY, 'not json')
  await useBigMultStore.persist.rehydrate()
  assert.equal(big()._hasHydrated, true)
})

test('t1: null / malformed progress shapes hydrate to non-negative integers', async () => {
  for (const raw of [
    'null',
    JSON.stringify({ state: null, version: 1 }),
    JSON.stringify({ state: { gamesDone: null }, version: 1 }),
    JSON.stringify({ state: { gamesDone: { 1: 'abc', 2: '2', 3: Number.NaN } }, version: 1 }),
    JSON.stringify({ state: { gamesDone: { 1: -4, 2: 1.9, 3: [] } }, version: 1 }),
  ]) {
    useBigMultStore.setState({ _hasHydrated: false, gamesDone: { 1: 0, 2: 0, 3: 0 } })
    mem.set(BIG_MULT_STORAGE_KEY, raw)
    await useBigMultStore.persist.rehydrate()
    assert.equal(big()._hasHydrated, true, raw)
    for (const lvl of [1, 2, 3] as const) {
      const v = big().gamesDone[lvl]
      assert.ok(Number.isInteger(v) && v >= 0, `${raw} → level ${lvl} = ${String(v)}`)
    }
  }
  // 1.9 floors to 1; strings never count
  assert.deepEqual(big().gamesDone, { 1: 0, 2: 1, 3: 0 })
})

test('t1: an older or newer saved version keeps the gems (migrate, never lower)', async () => {
  for (const version of [0, 2]) {
    useHoardStore.setState({ gems: 0 })
    save(HOARD_STORAGE_KEY, { gems: 30 }, version)
    await useHoardStore.persist.rehydrate()
    assert.equal(hoard().gems, 30, `version ${version}`)
  }
})

test('t1: an older saved version keeps level progress (max per level)', async () => {
  useBigMultStore.setState({ gamesDone: { 1: 0, 2: 2, 3: 0 } })
  save(BIG_MULT_STORAGE_KEY, { gamesDone: { 1: 3, 2: 1, 3: 0 }, mode: 'blocks' }, 0)
  await useBigMultStore.persist.rehydrate()
  assert.deepEqual(big().gamesDone, { 1: 3, 2: 2, 3: 0 })
})

test('progress never goes down on rehydrate', async () => {
  useBigMultStore.setState({ gamesDone: { 1: 3, 2: 0, 3: 0 } })
  save(BIG_MULT_STORAGE_KEY, { gamesDone: { 1: 1, 2: 0, 3: 0 } })
  await useBigMultStore.persist.rehydrate()
  assert.equal(big().gamesDone[1], 3)
})

test('t6: two tabs — add() builds on the higher of memory and what the other tab saved', () => {
  useHoardStore.setState({ gems: 30 })
  save(HOARD_STORAGE_KEY, { gems: 40 }) // tab B finished problems meanwhile
  assert.equal(hoard().add(1), 41)
  assert.equal(JSON.parse(mem.get(HOARD_STORAGE_KEY)!).state.gems, 41)
})

test('t6: two tabs — a storage event pulls the other tab\'s higher hoard, never a lower one', async () => {
  useHoardStore.setState({ gems: 30 })
  save(HOARD_STORAGE_KEY, { gems: 45 })
  storageEvent(HOARD_STORAGE_KEY)
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(hoard().gems, 45)
  save(HOARD_STORAGE_KEY, { gems: 2 })
  storageEvent(HOARD_STORAGE_KEY)
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(hoard().gems, 45)
})

test('t6: two tabs — finishing a game builds on the other tab\'s progress', async () => {
  useBigMultStore.setState({ gamesDone: { 1: 1, 2: 0, 3: 0 } })
  save(BIG_MULT_STORAGE_KEY, { gamesDone: { 1: 2, 2: 0, 3: 0 } })
  big().recordGameComplete(1)
  assert.equal(big().gamesDone[1], 3)
  assert.equal(big().isUnlocked(2), true)

  save(BIG_MULT_STORAGE_KEY, { gamesDone: { 1: 3, 2: 2, 3: 0 } })
  storageEvent(BIG_MULT_STORAGE_KEY)
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(big().gamesDone[2], 2)
})

test('t2 quota: a full storage never crashes a finished problem', () => {
  const real = storage.setItem
  storage.setItem = () => { throw new DOMException('QuotaExceededError', 'QuotaExceededError') }
  try {
    useHoardStore.setState({ gems: 10 })
    assert.doesNotThrow(() => hoard().add(6))
    assert.equal(hoard().gems, 16)
    assert.doesNotThrow(() => big().recordGameComplete(3))
    assert.doesNotThrow(() => markPlayedToday())
  } finally {
    storage.setItem = real
  }
})
