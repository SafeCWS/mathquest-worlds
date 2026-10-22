import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  FLIP_STAGES, flipSplitMisconception, flipSplitSteps, isFlipCorrect,
  type FlipInput, type FlipMisconceptionKind, type FlipStage,
} from '../flipSplit'
import { deckPool, type BigLevel, type BigProblem } from '../twoDigitProblems'

const LEVELS: BigLevel[] = [1, 2, 3]
const every = (): BigProblem[] => LEVELS.flatMap((l) => deckPool(l))

function correctInput(stage: FlipStage, p: BigProblem): FlipInput {
  const tv = Math.floor(p.a / 10) * 10
  switch (stage) {
    case 'predict': case 'confirm': case 'flip': return 'same'
    case 'chooseSide': return p.a
    case 'split': return [tv, p.a % 10]
    case 'tensPart': return tv * p.b
    case 'onesPart': return (p.a % 10) * p.b
    case 'add': return p.a * p.b
  }
}

test('steps: one per stage in order, 42 × 3 reads right', () => {
  const s = flipSplitSteps({ a: 42, b: 3 })
  assert.deepEqual(s.map((x) => x.stage), FLIP_STAGES)
  assert.deepEqual(s.map((x) => x.text), [
    '3 × 42. If we flip it to 42 × 3, will the answer change?',
    'Flip! 3 × 42 turns into 42 × 3. Same rectangle, same gems.',
    'Which number is easier to split? Tap 42.',
    'Split 42 into 40 and 2.',
    '40 × 3 = ?',
    '2 × 3 = ?',
    '120 + 6 = ?',
    '42 × 3 = 126, and 3 × 42 = 126. Same!',
  ])
  assert.equal(s[4].speak, '40 times 3 is ?')
  assert.deepEqual(s[0].choices, ['Same', 'Different'])
  assert.deepEqual(s[2].choices, [42, 3])
})

test('steps carry the right values for every problem in every level; speech has no symbols', () => {
  for (const p of every()) {
    const s = flipSplitSteps(p)
    const v = Object.fromEntries(s.map((x) => [x.stage, x.value]))
    assert.equal(v.chooseSide, p.a)
    assert.equal(v.split, Math.floor(p.a / 10) * 10)
    assert.equal(v.tensPart, Math.floor(p.a / 10) * 10 * p.b)
    assert.equal(v.onesPart, (p.a % 10) * p.b)
    assert.equal(v.add, p.a * p.b); assert.equal(v.confirm, p.a * p.b)
    for (const x of s) assert.ok(!/[×+=|]/.test(x.speak), x.speak)
  }
})

test('CONTROL: a correct input returns null at every stage for every problem in every level', () => {
  let n = 0
  for (const p of every()) {
    for (const stage of FLIP_STAGES) {
      const input = correctInput(stage, p)
      assert.ok(isFlipCorrect(stage, input, p), `${stage} ${p.a}×${p.b}`)
      assert.equal(flipSplitMisconception(stage, input, p), null, `${stage} ${p.a}×${p.b}`)
      n++
    }
    // split in the other order and the confirm-by-number are also correct
    assert.equal(flipSplitMisconception('split', [p.a % 10, Math.floor(p.a / 10) * 10], p), null)
    assert.equal(flipSplitMisconception('confirm', p.a * p.b, p), null)
  }
  assert.ok(n > 500)
})

const kindOf = (stage: FlipStage, input: FlipInput, p: BigProblem): FlipMisconceptionKind | undefined =>
  flipSplitMisconception(stage, input, p)?.kind

test('42 × 3: each named misconception is detected', () => {
  const p = { a: 42, b: 3 }
  assert.equal(kindOf('predict', 'different', p), 'thinksFlipChanges')
  assert.equal(kindOf('confirm', 'different', p), 'thinksFlipChanges')
  assert.equal(kindOf('split', [4, 2], p), 'tensAsOnes')
  assert.equal(kindOf('split', [2, 4], p), 'tensAsOnes')
  assert.equal(kindOf('add', 120, p), 'forgotOnesPart')
  assert.equal(kindOf('confirm', 120, p), 'forgotOnesPart')
  assert.equal(kindOf('tensPart', 12, p), 'droppedZero')
  assert.equal(kindOf('add', 18, p), 'droppedZero')
  assert.equal(kindOf('tensPart', 43, p), 'addedInstead')
  assert.equal(kindOf('onesPart', 5, p), 'addedInstead')
  assert.equal(kindOf('add', 45, p), 'addedInstead')
  assert.equal(kindOf('tensPart', 80, p), 'crossMultiplied')
  assert.equal(kindOf('onesPart', 80, p), 'crossMultiplied')
  assert.equal(kindOf('onesPart', 8, p), 'crossMultiplied')
  assert.equal(kindOf('chooseSide', 3, p), 'splitSmallFactor')
  // unknown slips → null (UI re-shows the step)
  assert.equal(flipSplitMisconception('add', 999, p), null)
  assert.equal(flipSplitMisconception('split', [30, 12], p), null)
  assert.equal(flipSplitMisconception('tensPart', Number.NaN, p), null)
})

test('every problem: the six named slips are detected wherever they differ from the right value', () => {
  for (const p of every()) {
    const t = Math.floor(p.a / 10), tv = t * 10, o = p.a % 10
    const tensPart = tv * p.b, onesPart = o * p.b, product = p.a * p.b
    assert.equal(kindOf('predict', 'different', p), 'thinksFlipChanges')
    assert.equal(kindOf('split', [t, o], p), 'tensAsOnes')
    assert.equal(kindOf('add', tensPart, p), 'forgotOnesPart')
    assert.equal(kindOf('tensPart', t * p.b, p), 'droppedZero')
    assert.equal(kindOf('tensPart', tv + p.b, p), 'addedInstead')
    if (o + p.b !== onesPart) assert.equal(kindOf('onesPart', o + p.b, p), 'addedInstead')
    if (tv * o !== tensPart && tv * o !== t * p.b && tv * o !== tv + p.b && tv * o !== t + p.b) assert.equal(kindOf('tensPart', tv * o, p), 'crossMultiplied')
    if (tv * o !== onesPart && tv * o !== o + p.b) assert.equal(kindOf('onesPart', tv * o, p), 'crossMultiplied')
    assert.notEqual(product, tensPart)
  }
})

test('hints: 3 tiers, amber copy, never the final product, speech has no symbols', () => {
  const slips = (p: BigProblem): [FlipStage, FlipInput][] => {
    const t = Math.floor(p.a / 10), tv = t * 10, o = p.a % 10
    return [
      ['predict', 'different'], ['confirm', 'different'], ['chooseSide', p.b], ['split', [t, o]],
      ['add', tv * p.b], ['confirm', tv * p.b], ['tensPart', t * p.b], ['add', t * p.b + o * p.b],
      ['tensPart', tv + p.b], ['onesPart', o + p.b], ['add', p.a + p.b],
      ['tensPart', tv * o], ['onesPart', o * tv], ['onesPart', o * t],
    ]
  }
  let n = 0
  for (const p of every()) {
    const product = new RegExp(`(^|[^\\d])${p.a * p.b}([^\\d]|$)`)
    for (const [stage, input] of slips(p)) {
      const m = flipSplitMisconception(stage, input, p)
      if (!m) continue
      n++
      assert.equal(m.tiers.length, 3)
      for (const h of m.tiers) {
        assert.ok(!product.test(h.text), `${m.kind} ${p.a}×${p.b} gives ${p.a * p.b}: ${h.text}`)
        assert.ok(!/\b(wrong|incorrect|no|bad)\b/i.test(h.text), h.text)
        assert.ok(!/[×+=]/.test(h.speak), h.speak)
        assert.ok(h.text.length > 0 && h.text.length <= 120, h.text)
      }
    }
  }
  assert.ok(n > 1000, `only ${n} hint sets checked`)
})

test('flip button is never wrong; bad shapes throw', () => {
  assert.equal(flipSplitMisconception('flip', 'different', { a: 42, b: 3 }), null)
  assert.throws(() => flipSplitSteps({ a: 7, b: 3 }), RangeError)
  assert.throws(() => flipSplitMisconception('add', 1, { a: 42, b: 10 }), RangeError)
})
