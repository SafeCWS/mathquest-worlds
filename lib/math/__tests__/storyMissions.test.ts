import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  checkSlot, distractorFor, mathCards, MAX_STORY_WORDS, pickMathOk, slotHint, storyFor, STORY_THEMES, wordCount,
  type Story,
} from '../storyMissions'
import { deckPool, drawProblem, emptyDeck, type BigLevel } from '../twoDigitProblems'

function seeded(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32 }
}

const LEVELS: BigLevel[] = [1, 2, 3]
const BANNED_WORDS = ['dollar', 'dollars', 'cent', 'cents', 'year', 'years', 'old', 'age', 'ages', 'birthday', 'price', 'cost', 'pay', 'money', 'coin', 'coins']
const NAMES = ['Tina', 'Sam', 'Max', 'Mia', 'Emma', 'Liam', 'Noah', 'Ava', 'Ben', 'Lily', 'Leo', 'Zoe', 'Jack', 'Anna',
  'Lucas', 'Sofia', 'Mateo', 'Maria', 'Jose', 'Luis', 'Ana', 'Eli', 'Ella', 'Owen', 'Ruby', 'Tom', 'Kim', 'Abeni', 'Lorie', 'Fabien']
const ALLOWED_CAPS = new Set(['How', 'The'])

/** Every (problem, theme, template, distractor on/off) in every level's deck. */
function* everyStory(): Generator<{ level: BigLevel; story: Story }> {
  let seed = 1
  for (const level of LEVELS) {
    for (const p of deckPool(level)) {
      for (const theme of STORY_THEMES) {
        for (const template of [0, 1]) {
          yield { level, story: storyFor(p, seeded(seed++), { theme, template }) }
          yield { level, story: storyFor(p, seeded(seed++), { theme, template, distractor: true }) }
        }
      }
    }
  }
}

function allTexts(s: Story): string[] {
  return [s.text, s.question, ...s.steps.map((x) => x.text), ...s.steps.map((x) => x.speak)]
}

test('every story in every level: ≤ 15 words, has "each" and "in all", right answer', () => {
  let n = 0
  for (const { story: s } of everyStory()) {
    n++
    assert.ok(wordCount(s.text) <= MAX_STORY_WORDS, `${wordCount(s.text)} words: ${s.text}`)
    assert.match(s.text, /\beach\b/, s.text)
    assert.match(s.question, /\bin all\?$/, s.question)
    assert.ok(s.text.endsWith(s.question))
    assert.equal(s.answer, s.problem.a * s.problem.b)
    assert.equal(s.groups, s.problem.b)
    assert.equal(s.each, s.problem.a)
    assert.equal(s.speak, s.text)
  }
  assert.ok(n > 1000, `only ${n} stories checked`)
})

test('full question ("How many gems in all?") whenever it fits — always without a distractor', () => {
  for (const { story: s } of everyStory()) {
    if (s.distractor === undefined) assert.equal(s.question, `How many ${s.unit} in all?`, s.text)
  }
  // with a distractor, every 1-word unit still gets the full question
  for (const { story: s } of everyStory()) {
    if (!s.unit.includes(' ')) assert.equal(s.question, `How many ${s.unit} in all?`, s.text)
  }
})

test('story numbers: groups and each appear in the text; nothing else except the distractor', () => {
  for (const { story: s } of everyStory()) {
    assert.ok(s.numbers.includes(s.groups) && s.numbers.includes(s.each), s.text)
    const extra = s.numbers.filter((x) => x !== s.groups && x !== s.each)
    if (s.distractor === undefined) assert.deepEqual(extra, [], s.text)
    else assert.deepEqual(extra, [s.distractor], s.text)
  }
})

test('distractor: L3 by default only; 2–9, never a, b, or a digit of a', () => {
  for (const level of LEVELS) {
    for (const p of deckPool(level)) {
      for (let seed = 1; seed <= 5; seed++) {
        const s = storyFor(p, seeded(seed * 97 + p.a))
        if (level === 3) assert.ok(s.distractor !== undefined, `${p.a}×${p.b}`)
        else assert.equal(s.distractor, undefined, `${p.a}×${p.b}`)
      }
      for (let seed = 1; seed <= 20; seed++) {
        const d = distractorFor(p, seeded(seed))
        assert.ok(d >= 2 && d <= 9)
        assert.notEqual(d, p.a); assert.notEqual(d, p.b)
        assert.notEqual(d, Math.floor(p.a / 10)); assert.notEqual(d, p.a % 10)
      }
    }
  }
})

test('no money, no ages, no human names (L192)', () => {
  for (const { story: s } of everyStory()) {
    for (const t of allTexts(s)) {
      assert.ok(!t.includes('$') && !t.includes('¢'), t)
      for (const w of BANNED_WORDS) assert.ok(!new RegExp(`\\b${w}\\b`, 'i').test(t), `"${w}" in: ${t}`)
      for (const name of NAMES) assert.ok(!new RegExp(`\\b${name}\\b`).test(t), `"${name}" in: ${t}`)
    }
    // Any capitalised word in the story must be a sentence start from a tiny allowlist.
    for (const w of s.text.match(/\b[A-Z][a-z]+\b/g) ?? []) assert.ok(ALLOWED_CAPS.has(w), `"${w}" in: ${s.text}`)
  }
})

test('plurals: groups noun and unit are plural; answer sentence "126 gems!"', () => {
  const s = storyFor({ a: 42, b: 3 }, seeded(1), { theme: 'gems', template: 0, distractor: false })
  assert.equal(s.text, '3 dragons each guard 42 gems. How many gems in all?')
  assert.equal(s.steps[s.steps.length - 1].text, '126 gems!')
  for (const { story: x } of everyStory()) {
    assert.match(x.unit, /s$/); assert.match(x.groupNoun, /s$/); assert.doesNotMatch(x.groupNounOne, /s$/)
    assert.ok(!/\b1 [a-z]+s\b/.test(x.text), x.text)
  }
})

test('step order: groups, each, pickMath, split, tensPart, onesPart, add, answer — values right', () => {
  for (const { story: s } of everyStory()) {
    const { a, b } = s.problem
    assert.deepEqual(s.steps.map((x) => x.kind), ['groups', 'each', 'pickMath', 'split', 'tensPart', 'onesPart', 'add', 'answer'])
    const v = Object.fromEntries(s.steps.map((x) => [x.kind, x.value]))
    assert.equal(v.groups, b); assert.equal(v.each, a)
    assert.equal(v.tensPart, Math.floor(a / 10) * 10 * b)
    assert.equal(v.onesPart, (a % 10) * b)
    assert.equal(v.add, a * b); assert.equal(v.answer, a * b)
    assert.deepEqual(s.steps[2].choices, [`${b} × ${a}`, `${b} + ${a}`])
    for (const x of s.steps) assert.ok(!/[×+=]/.test(x.speak), `symbol in speech: ${x.speak}`)
  }
})

test('42 × 3 story steps reuse Break It Apart narration', () => {
  const s = storyFor({ a: 42, b: 3 }, seeded(3), { theme: 'eggs', template: 0 })
  assert.deepEqual(s.steps.map((x) => x.text), [
    'How many nests?', 'How many eggs in each nest?', '3 groups of 42. Pick the math!',
    'Break 42 into 40 and 2.', '40 times 3 is 120.', '2 times 3 is 6.', '120 plus 6 is 126.', '126 eggs!',
  ])
})

test('pick the math: both × orders accepted, + rejected, junk rejected', () => {
  for (const { story: s } of everyStory()) {
    const [times, plus] = mathCards(s)
    assert.ok(pickMathOk(s, times))
    assert.ok(pickMathOk(s, `${s.each} × ${s.groups}`))
    assert.ok(pickMathOk(s, `${s.each}x${s.groups}`))
    assert.ok(!pickMathOk(s, plus))
    assert.ok(!pickMathOk(s, `${s.each} + ${s.groups}`))
  }
  const s = storyFor({ a: 42, b: 3 }, seeded(1))
  for (const bad of ['', '3 ×', '3 × 41', '4 × 42', '3 × 42 × 1', '3 - 42', 'abc']) assert.ok(!pickMathOk(s, bad), bad)
})

test('slots: ok / swapped / distractor / notInStory, hints never give the total', () => {
  for (const { story: s } of everyStory()) {
    assert.equal(checkSlot(s, 'groups', s.groups), 'ok')
    assert.equal(checkSlot(s, 'each', s.each), 'ok')
    assert.equal(checkSlot(s, 'groups', s.each), 'swapped')
    assert.equal(checkSlot(s, 'each', s.groups), 'swapped')
    assert.equal(checkSlot(s, 'groups', Number.NaN), 'notInStory')
    if (s.distractor !== undefined) assert.equal(checkSlot(s, 'groups', s.distractor), 'distractor')
    assert.equal(slotHint(s, 'groups', 'ok'), null)
    for (const r of ['swapped', 'distractor', 'notInStory'] as const) {
      for (const slot of ['groups', 'each'] as const) {
        const h = slotHint(s, slot, r)!
        assert.ok(!new RegExp(`\\b${s.answer}\\b`).test(h), h)
        assert.ok(!/\b(wrong|incorrect|no)\b/i.test(h), h)
      }
    }
  }
})

test('deterministic with a seeded rng; themes rotate across a dealt deck', () => {
  const p = { a: 58, b: 6 }
  assert.deepEqual(storyFor(p, seeded(42)), storyFor(p, seeded(42)))
  const rng = seeded(7)
  let deck = emptyDeck()
  const themes = new Set<string>()
  for (let i = 0; i < 12; i++) {
    const d = drawProblem(deck, 3, 'same', rng)
    deck = d.state
    themes.add(storyFor(d.problem, rng).theme)
  }
  assert.ok(themes.size >= 3, `only ${[...themes].join(',')}`)
})

test('rejects out-of-shape problems', () => {
  assert.throws(() => storyFor({ a: 5, b: 3 }, seeded(1)), RangeError)
  assert.throws(() => storyFor({ a: 42, b: 1 }, seeded(1)), RangeError)
  assert.throws(() => storyFor({ a: 42.5, b: 3 }, seeded(1)), RangeError)
})
