import { test } from 'node:test'
import assert from 'node:assert/strict'
import { allProblems } from '../twoDigitProblems'
import { column, MAX_OBJECTS, objectsAt, stageCounts, stagesFor } from '../blockLayout'

test('Level 3 Block Builder never draws more than 15 objects, at any stage, for any problem', () => {
  let checked = 0
  for (const p of allProblems(3)) {
    for (const stage of stagesFor(p)) {
      const n = objectsAt(p, stage)
      assert.ok(n <= MAX_OBJECTS, `${p.a}×${p.b} @ ${stage}: ${n} objects`)
      checked++
    }
  }
  assert.ok(checked > 100)
})

test('control: the old rods/cubes drawing for 78 × 8 is far over the limit (so the test above can fail)', () => {
  // old layout: 8 trucks × (7 rods + 8 cubes), then 57 rods / 54 cubes in the bins
  assert.ok(8 * (7 + 8) > MAX_OBJECTS)
  // and an uncapped column would also fail
  assert.equal(column('crate', 56, 99).icons, 56)
  assert.equal(column('crate', 56).icons, 1)
  assert.equal(column('crate', 56).badge, 56)
})

test('78 × 8 crate stages end at 6 big crates · 2 crates · 4 apples', () => {
  const p = { a: 78, b: 8 }
  assert.deepEqual(stagesFor(p), ['truck', 'unloaded', 'onesDone', 'tensDone'])
  assert.deepEqual(stageCounts(p, 'unloaded'), { hundreds: 0, tens: 56, ones: 64 })
  assert.deepEqual(stageCounts(p, 'onesDone'), { hundreds: 0, tens: 62, ones: 4 })
  assert.deepEqual(stageCounts(p, 'tensDone'), { hundreds: 6, tens: 2, ones: 4 })
})

test('42 × 3 skips the apple trade (6 apples) but fills a big crate (12 crates)', () => {
  const p = { a: 42, b: 3 }
  assert.deepEqual(stagesFor(p), ['truck', 'unloaded', 'tensDone'])
  assert.deepEqual(stageCounts(p, 'tensDone'), { hundreds: 1, tens: 2, ones: 6 })
})

test('every final stage reads back the product', () => {
  for (const p of allProblems(3)) {
    const st = stagesFor(p)
    const c = stageCounts(p, st[st.length - 1])
    assert.equal(c.hundreds * 100 + c.tens * 10 + c.ones, p.a * p.b, `${p.a}×${p.b}`)
  }
})
