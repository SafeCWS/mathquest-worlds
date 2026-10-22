import { test } from 'node:test'
import assert from 'node:assert/strict'

import { mem } from './memStorage'
import { useHoardStore, HOARD_STORAGE_KEY, MAX_GEMS, sanitizeGems } from '../hoardStore'

const gems = () => useHoardStore.getState().gems
const add = (n: number) => useHoardStore.getState().add(n)

test('storage key is mathquest-dragon-hoard and add persists', () => {
  assert.equal(HOARD_STORAGE_KEY, 'mathquest-dragon-hoard')
  useHoardStore.setState({ gems: 0 })
  assert.equal(add(126), 126)
  assert.equal(add(6), 132)
  assert.equal(JSON.parse(mem.get(HOARD_STORAGE_KEY)!).state.gems, 132)
})

test('add of negative / zero / NaN / Infinity / non-number is ignored — gems never decrease', () => {
  useHoardStore.setState({ gems: 50 })
  for (const bad of [-1, -1000, 0, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0.4, '5' as unknown as number, undefined as unknown as number]) {
    const before = gems()
    add(bad)
    assert.equal(gems(), before, `add(${String(bad)})`)
  }
  assert.equal(gems(), 50)
  add(2.9)
  assert.equal(gems(), 52, 'fractions floor')
})

test('capped at MAX_GEMS', () => {
  useHoardStore.setState({ gems: MAX_GEMS - 1 })
  add(10)
  assert.equal(gems(), MAX_GEMS)
})

test('rehydrate: tampered values sanitised, never lowers in-memory total, sets _hasHydrated', async () => {
  assert.equal(sanitizeGems(-5), 0); assert.equal(sanitizeGems('99'), 0); assert.equal(sanitizeGems(1e12), MAX_GEMS)
  assert.equal(sanitizeGems(12.7), 12)

  useHoardStore.setState({ gems: 0 })
  mem.set(HOARD_STORAGE_KEY, JSON.stringify({ state: { gems: 300 }, version: 1 }))
  await useHoardStore.persist.rehydrate()
  assert.equal(gems(), 300)
  assert.equal(useHoardStore.getState()._hasHydrated, true)

  mem.set(HOARD_STORAGE_KEY, JSON.stringify({ state: { gems: -40 }, version: 1 }))
  await useHoardStore.persist.rehydrate()
  assert.equal(gems(), 300, 'a tampered lower value never lowers the hoard')

  mem.set(HOARD_STORAGE_KEY, JSON.stringify({ state: { gems: 'lots' }, version: 1 }))
  await useHoardStore.persist.rehydrate()
  assert.equal(gems(), 300)
})
