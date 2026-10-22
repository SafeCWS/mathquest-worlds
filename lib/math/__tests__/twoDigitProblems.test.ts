import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  allProblems, columnSteps, estimateChoices, levelOf, LEVEL_EXAMPLES, nextProblem,
  sameProblem, splitTensOnes, type BigLevel, type BigProblem,
} from '../twoDigitProblems'

function seeded(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32 }
}

test('spec examples land in their stated level', () => {
  for (const lvl of [1, 2, 3] as BigLevel[]) {
    for (const p of LEVEL_EXAMPLES[lvl]) assert.equal(levelOf(p), lvl, `${p.a}×${p.b}`)
  }
})

test('L1 never carries; L2 carries in ones only; L3 product >= 100', () => {
  for (const p of allProblems(1)) {
    const s = columnSteps(p)
    assert.equal(s.carry, 0); assert.ok(s.tensProduct < 10); assert.ok(s.product < 100)
  }
  for (const p of allProblems(2)) {
    const s = columnSteps(p)
    assert.ok(s.carry > 0); assert.ok(s.tensSum < 10); assert.ok(s.product < 100)
  }
  for (const p of allProblems(3)) assert.ok(p.a * p.b >= 100 && p.a >= 40 && p.b >= 3)
})

test('levels are disjoint and non-empty', () => {
  const key = (p: BigProblem) => `${p.a}x${p.b}`
  const sets = ([1, 2, 3] as BigLevel[]).map((l) => new Set(allProblems(l).map(key)))
  for (const s of sets) assert.ok(s.size > 5)
  for (const k of sets[0]) { assert.ok(!sets[1].has(k)); assert.ok(!sets[2].has(k)) }
  for (const k of sets[1]) assert.ok(!sets[2].has(k))
})

test('78 × 8 column steps: 64 → write 4 carry 6; 56 + 6 = 62; 624', () => {
  assert.deepEqual(columnSteps({ a: 78, b: 8 }), {
    onesDigit: 8, tensDigit: 7, onesProduct: 64, onesWrite: 4, carry: 6, tensProduct: 56, tensSum: 62, product: 624,
  })
})

test('nextProblem never repeats back-to-back (2,000 draws per level)', () => {
  for (const lvl of [1, 2, 3] as BigLevel[]) {
    const rng = seeded(lvl * 97)
    let prev: BigProblem | null = null
    for (let i = 0; i < 2000; i++) {
      const p = nextProblem(lvl, prev, i, rng)
      assert.ok(!sameProblem(p, prev), `repeat at ${i}: ${p.a}×${p.b}`)
      assert.equal(levelOf(p), lvl)
      prev = p
    }
  }
})

test('nextProblem serves spec examples first', () => {
  assert.deepEqual(nextProblem(1, null, 0), { a: 21, b: 3 })
  assert.deepEqual(nextProblem(1, { a: 21, b: 3 }, 1), { a: 32, b: 2 })
})

test('control: rng that always picks index 0 still avoids prev', () => {
  const first = allProblems(3)[0]
  const p = nextProblem(3, first, 99, () => 0)
  assert.ok(!sameProblem(p, first))
})

test('split + estimate for 42 × 3', () => {
  assert.deepEqual(splitTensOnes(42), [40, 2])
  const e = estimateChoices({ a: 42, b: 3 }, seeded(1))
  assert.equal(e.correct, 120)
  assert.deepEqual([...e.choices].sort((x, y) => x - y), [12, 120, 1200])
})

import { difficultyScore, nextProblemAdaptive } from '../twoDigitProblems'

test('adaptive: easier < harder on average, same level, no back-to-back repeat', () => {
  for (const lvl of [1, 2, 3] as BigLevel[]) {
    const rng = seeded(lvl + 5)
    let prev: BigProblem | null = null
    let easy = 0, hard = 0
    for (let i = 0; i < 300; i++) {
      const e = nextProblemAdaptive(lvl, prev, 99, 'easier', rng); assert.ok(!sameProblem(e, prev)); assert.equal(levelOf(e), lvl); prev = e; easy += difficultyScore(e)
      const h = nextProblemAdaptive(lvl, prev, 99, 'harder', rng); assert.ok(!sameProblem(h, prev)); assert.equal(levelOf(h), lvl); prev = h; hard += difficultyScore(h)
    }
    assert.ok(easy < hard, `level ${lvl}: easier band must score below harder band`)
  }
  // 78×8 sits in the L3 harder band, 42×3 in the easier band
  assert.ok(difficultyScore({ a: 78, b: 8 }) > difficultyScore({ a: 42, b: 3 }))
})

// ───────────── Shuffle deck (operator 2026-10-22: stuck on 23×2 / 32×3) ─────────────
import { deckPool, drawProblem, emptyDeck, type DeckState, type Difficulty } from '../twoDigitProblems'

function drawMany(level: BigLevel, n: number, rng: () => number, mix: Difficulty[] = ['same']) {
  let state: DeckState = emptyDeck()
  const out: BigProblem[] = []
  for (let i = 0; i < n; i++) {
    const r = drawProblem(state, level, mix[i % mix.length], rng)
    state = r.state
    out.push(r.problem)
  }
  return out
}
const key = (p: BigProblem) => `${p.a}x${p.b}`

test('deck: one full deal covers the whole level pool with no duplicates', () => {
  for (const lvl of [1, 2, 3] as BigLevel[]) {
    const pool = deckPool(lvl)
    const dealt = drawMany(lvl, pool.length, seeded(lvl * 7))
    assert.equal(new Set(dealt.map(key)).size, pool.length, `level ${lvl}`)
  }
})

test('deck: no problem returns within the recent window, even across reshuffles and adaptive picks', () => {
  for (const lvl of [1, 2, 3] as BigLevel[]) {
    const win = Math.min(12, Math.floor(deckPool(lvl).length / 2))
    const dealt = drawMany(lvl, 600, seeded(lvl * 13), ['same', 'harder', 'same', 'easier', 'harder']).map(key)
    for (let i = 0; i < dealt.length; i++) {
      const prior = dealt.slice(Math.max(0, i - win), i)
      assert.ok(!prior.includes(dealt[i]), `level ${lvl}: ${dealt[i]} repeated within ${win} at draw ${i}`)
    }
  }
})

test('deck: never gets stuck alternating two problems (the 23×2 / 32×3 report)', () => {
  const dealt = drawMany(1, 40, seeded(99), ['harder']).map(key)
  assert.ok(new Set(dealt.slice(0, 10)).size >= 8, `first 10 harder draws: ${dealt.slice(0, 10).join(' ')}`)
})

test('deck: two visits start differently (no fixed opening order)', () => {
  const firsts = new Set([1, 2, 3, 4, 5, 6].map((s) => key(drawMany(1, 1, seeded(s * 1000 + 1))[0])))
  assert.ok(firsts.size >= 4, `openings: ${[...firsts].join(' ')}`)
})

test('deck: round tens are never dealt (no ones column to practise)', () => {
  for (const lvl of [1, 2, 3] as BigLevel[]) {
    assert.ok(drawMany(lvl, 200, seeded(lvl)).every((p) => p.a % 10 !== 0), `level ${lvl}`)
  }
})

test('control: the OLD adaptive picker repeats inside the window — the recent-window check can fail', () => {
  const rng = seeded(99)
  let prev: BigProblem | null = null
  const dealt: string[] = []
  for (let i = 0; i < 40; i++) { prev = nextProblemAdaptive(1, prev, i, 'harder', rng); dealt.push(key(prev)) }
  const win = Math.min(12, Math.floor(deckPool(1).length / 2))
  const repeats = dealt.filter((k, i) => dealt.slice(Math.max(0, i - win), i).includes(k)).length
  assert.ok(repeats > 0, 'old picker should repeat within the window')
})
