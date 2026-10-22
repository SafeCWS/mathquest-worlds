import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildColumn, buildSplit, isWrongStep, oopsCandidates, oopsFor, replayOops, stepHolds, type Oops } from '../dragonOops'
import { deckPool, levelOf, type BigLevel, type BigProblem } from '../twoDigitProblems'

function seeded(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32 }
}

const LEVELS: BigLevel[] = [1, 2, 3]

/** Every candidate slip for every problem, plus a few seeded draws each. */
function* everyOops(): Generator<{ level: BigLevel; oops: Oops }> {
  for (const level of LEVELS) {
    for (const p of deckPool(level)) {
      for (let seed = 1; seed <= 8; seed++) yield { level, oops: oopsFor(p, seeded(seed * 31 + p.a * 10 + p.b)) }
    }
  }
}

test('correct chains hold everywhere and end on a × b', () => {
  for (const level of LEVELS) {
    for (const p of deckPool(level)) {
      const s = buildSplit(p)
      assert.ok(s.every(stepHolds)); assert.equal(s[s.length - 1].value, p.a * p.b)
      const c = buildColumn(p)
      assert.ok(c.every(stepHolds)); assert.equal(c[c.length - 1].value, p.a * p.b)
    }
  }
})

test('42 × 3 split chain reads right', () => {
  assert.deepEqual(buildSplit({ a: 42, b: 3 }).map((s) => s.text), ['42 = 40 + 2', '40 × 3 = 120', '2 × 3 = 6', '120 + 6 = 126'])
  assert.deepEqual(buildColumn({ a: 78, b: 8 }).map((s) => s.text),
    ['8 × 8 = 64', '64: write 4, carry 6', '7 × 8 = 56', '56 + 6 = 62', 'Answer: 624'])
})

test('exactly ONE wrong step, flagged, and it is the only step that does not hold', () => {
  let n = 0
  for (const { oops } of everyOops()) {
    n++
    const broken = oops.steps.map((s, i) => (stepHolds(s) ? -1 : i)).filter((i) => i >= 0)
    assert.deepEqual(broken, [oops.wrongIndex], `${oops.problem.a}×${oops.problem.b} ${oops.kind}`)
    assert.deepEqual(oops.steps.map((s, i) => (s.wrong ? i : -1)).filter((i) => i >= 0), [oops.wrongIndex])
    assert.ok(isWrongStep(oops, oops.wrongIndex))
    assert.ok(!isWrongStep(oops, oops.wrongIndex + 1))
  }
  assert.ok(n > 500)
})

test('later steps follow from the wrong one; the final answer is off', () => {
  for (const { oops } of everyOops()) {
    const last = oops.steps[oops.steps.length - 1]
    assert.notEqual(last.value, oops.problem.a * oops.problem.b, `${oops.problem.a}×${oops.problem.b} ${oops.kind}`)
    // steps before the slip match the correct chain exactly
    const right = oops.method === 'split' ? buildSplit(oops.problem) : buildColumn(oops.problem)
    for (let i = 0; i < oops.wrongIndex; i++) assert.equal(oops.steps[i].text, right[i].text)
    assert.notEqual(oops.steps[oops.wrongIndex].value, oops.fix)
    assert.ok(oops.steps.every((s) => s.value >= 0 && Number.isInteger(s.value)))
  }
})

test('fixing the wrong step makes every step hold and ends on the right answer', () => {
  for (const { oops } of everyOops()) {
    const fixed = replayOops(oops, oops.fix)
    assert.ok(fixed.every(stepHolds), `${oops.problem.a}×${oops.problem.b} ${oops.kind}`)
    assert.equal(fixed[fixed.length - 1].value, oops.problem.a * oops.problem.b)
    assert.ok(fixed.every((s) => !s.wrong))
    // a different wrong fix keeps the chain broken (control)
    const still = replayOops(oops, oops.fix + 1)
    assert.ok(!still.every(stepHolds))
  }
})

test('L1: the wrong step is never the final step alone; L1 never uses the column method', () => {
  for (const { level, oops } of everyOops()) {
    if (level !== 1) continue
    assert.ok(oops.wrongIndex < oops.steps.length - 1, `${oops.problem.a}×${oops.problem.b} ${oops.kind}`)
    assert.equal(oops.method, 'split')
  }
  for (const p of deckPool(1)) for (const c of oopsCandidates(p)) assert.ok(c.index < 3)
})

test('forgot-carry column oops appears for carrying problems; methods and kinds vary', () => {
  const kinds = new Set<string>()
  const methods = new Set<string>()
  for (const { level, oops } of everyOops()) {
    kinds.add(oops.kind); methods.add(oops.method)
    if (oops.method === 'column') {
      assert.equal(oops.kind, 'forgotCarry')
      assert.ok(level !== 1)
    }
  }
  assert.deepEqual([...methods].sort(), ['column', 'split'])
  for (const k of ['tensAsOnes', 'droppedZero', 'addedInstead', 'forgotOnesPart', 'forgotCarry']) assert.ok(kinds.has(k), k)
  const p: BigProblem = { a: 78, b: 8 }
  assert.equal(levelOf(p), 3)
  const c = oopsCandidates(p).find((x) => x.kind === 'forgotCarry')!
  assert.deepEqual(replayOops({ ...oopsFor(p, () => 0), method: 'column', wrongIndex: c.index, fix: 62 }, c.value).map((s) => s.text),
    ['8 × 8 = 64', '64: write 4, carry 6', '7 × 8 = 56', '56 + 6 = 56', 'Answer: 564'])
})

test('rejects round tens and bad shapes', () => {
  assert.throws(() => oopsFor({ a: 40, b: 3 }), RangeError)
  assert.throws(() => oopsFor({ a: 42, b: 1 }), RangeError)
})
