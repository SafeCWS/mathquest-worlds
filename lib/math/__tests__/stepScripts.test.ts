import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  blockBuilderSteps, breakApartSteps, columnSteps, detectMisconception, estimateHint,
  misconceptionHint, normalizeLocale, type Step,
} from '../stepScripts'

const SAMPLES: Array<[number, number, number]> = [
  [21, 3, 63], [32, 2, 64], [41, 2, 82], // L1
  [27, 3, 81], [46, 2, 92],              // L2
  [58, 6, 348], [78, 8, 624], [99, 9, 891], // L3
  [42, 3, 126],                           // spec's demo problem
]
const LOCALES = ['en', 'es'] as const
const texts = (s: Step[]) => s.map((x) => x.text)

// ---------------------------------------------------------------- column

test('column 78×8 EN matches the spec narration exactly', () => {
  const s = columnSteps(78, 8, 'en')
  assert.deepEqual(texts(s), [
    '8 times 8 is 64.',
    'Write the 4, carry the 6.',
    '7 times 8 is 56.',
    '56 plus the 6 you carried is 62.',
    'The answer is 624!',
  ])
  assert.deepEqual(s.map((x) => x.highlight), ['ones', 'carry', 'tens', 'answerTens', 'answer'])
  assert.deepEqual(s.map((x) => x.value), [64, 6, 56, 62, 624])
})

test('column 78×8 ES is natural Latin American Spanish', () => {
  assert.deepEqual(texts(columnSteps(78, 8, 'es')), [
    '8 por 8 es 64.',
    'Escribe el 4 y llevas 6.',
    '7 por 8 es 56.',
    '56 más el 6 que llevabas es 62.',
    '¡La respuesta es 624!',
  ])
})

test('column with no regrouping skips the carry lines', () => {
  assert.deepEqual(texts(columnSteps(21, 3, 'en')), ['1 times 3 is 3.', 'Write the 3.', '2 times 3 is 6.', 'The answer is 63!'])
  assert.deepEqual(texts(columnSteps(32, 2, 'es')), ['2 por 2 es 4.', 'Escribe el 4.', '3 por 2 es 6.', '¡La respuesta es 64!'])
  assert.equal(columnSteps(41, 2, 'en')[1].highlight, 'answerOnes')
  assert.ok(!columnSteps(41, 2, 'en').some((x) => x.highlight === 'carry'))
})

test('column with regrouping: 27×3, 46×2, 58×6, 99×9', () => {
  assert.deepEqual(texts(columnSteps(27, 3, 'en')), [
    '7 times 3 is 21.', 'Write the 1, carry the 2.', '2 times 3 is 6.', '6 plus the 2 you carried is 8.', 'The answer is 81!',
  ])
  assert.equal(columnSteps(46, 2, 'es')[1].text, 'Escribe el 2 y llevas 1.')
  assert.equal(columnSteps(58, 6, 'en')[3].text, '30 plus the 4 you carried is 34.')
  assert.deepEqual(texts(columnSteps(99, 9, 'es')), [
    '9 por 9 es 81.', 'Escribe el 1 y llevas 8.', '9 por 9 es 81.', '81 más el 8 que llevabas es 89.', '¡La respuesta es 891!',
  ])
})

// ---------------------------------------------------------------- every mode, every sample, both locales

test('every mode ends on the right answer for every sample in both locales', () => {
  for (const [a, b, ans] of SAMPLES) {
    for (const loc of LOCALES) {
      for (const fn of [columnSteps, breakApartSteps, blockBuilderSteps]) {
        const s = fn(a, b, loc)
        const last = s[s.length - 1]
        assert.equal(last.highlight, 'answer', `${fn.name} ${a}×${b} ${loc}`)
        assert.equal(last.value, ans, `${fn.name} ${a}×${b} ${loc}`)
        assert.ok(last.text.includes(String(ans)))
        for (const st of s) {
          assert.ok(st.text.length > 0 && st.speak.length > 0)
          assert.doesNotMatch(st.speak, /[×=—–]/, `speak has a symbol: ${st.speak}`)
        }
      }
    }
  }
})

test('Spanish output never leaks English words', () => {
  const english = /\b(times|plus|the|is|write|carry|ones|tens|answer|count|groups?|trade|make)\b/i
  for (const [a, b] of SAMPLES) {
    for (const fn of [columnSteps, breakApartSteps, blockBuilderSteps]) {
      for (const st of fn(a, b, 'es')) assert.doesNotMatch(st.text, english, st.text)
    }
    assert.doesNotMatch(estimateHint(a, b, 'es').text, english)
  }
})

test('locale normalization: es-MX → es, unknown → en', () => {
  assert.equal(normalizeLocale('es-MX'), 'es')
  assert.equal(normalizeLocale('ES'), 'es')
  assert.equal(normalizeLocale('fr'), 'en')
  assert.equal(normalizeLocale(undefined), 'en')
  assert.equal(columnSteps(78, 8, 'es-419')[0].text, '8 por 8 es 64.')
})

test('out-of-range problems throw a RangeError (programmer error, not kid error)', () => {
  assert.throws(() => columnSteps(7, 3, 'en'), RangeError)
  assert.throws(() => columnSteps(100, 3, 'en'), RangeError)
  assert.throws(() => columnSteps(42, 10, 'en'), RangeError)
  assert.throws(() => columnSteps(42.5, 3, 'en'), RangeError)
})

// ---------------------------------------------------------------- break apart

test('break apart 42×3 EN + ES', () => {
  const en = breakApartSteps(42, 3, 'en')
  assert.deepEqual(texts(en), ['Break 42 into 40 and 2.', '40 times 3 is 120.', '2 times 3 is 6.', '120 plus 6 is 126.', 'The answer is 126!'])
  assert.deepEqual(en.map((x) => x.highlight), ['split', 'tensPart', 'onesPart', 'sum', 'answer'])
  assert.deepEqual(texts(breakApartSteps(78, 8, 'es')), ['Separa 78 en 70 y 8.', '70 por 8 es 560.', '8 por 8 es 64.', '560 más 64 es 624.', '¡La respuesta es 624!'])
})

test('break apart a round number has no ones part', () => {
  const s = breakApartSteps(40, 3, 'en')
  assert.ok(!s.some((x) => x.highlight === 'onesPart'))
  assert.equal(s[s.length - 1].value, 120)
})

// ---------------------------------------------------------------- block builder

test('block builder 46×2 includes the trade line from the spec', () => {
  assert.deepEqual(texts(blockBuilderSteps(46, 2, 'en')), [
    'Make 2 groups of 46: 4 tens and 6 ones in each.',
    'Count the ones: 2 groups of 6 is 12 ones.',
    'You have 12 ones — trade 10 for a ten!',
    'That leaves 2 ones.',
    'Count the tens: 2 groups of 4 is 8 tens.',
    '8 tens plus 1 traded ten is 9 tens.',
    '9 tens and 2 ones make 92.',
    'The answer is 92!',
  ])
  const trade = blockBuilderSteps(46, 2, 'en').find((x) => x.highlight === 'trade')!
  assert.equal(trade.speak, 'You have 12 ones, trade 10 for a ten!')
  assert.equal(blockBuilderSteps(46, 2, 'es')[2].text, 'Tienes 12 unidades: ¡cambia 10 por una decena!')
})

test('block builder 78×8 trades several tens; 42×3 never trades', () => {
  const s = blockBuilderSteps(78, 8, 'en')
  assert.equal(s.find((x) => x.highlight === 'trade')!.text, 'You have 64 ones — trade 60 for 6 tens!')
  assert.equal(blockBuilderSteps(78, 8, 'es').find((x) => x.highlight === 'trade')!.text, 'Tienes 64 unidades: ¡cambia 60 por 6 decenas!')
  assert.ok(!blockBuilderSteps(42, 3, 'en').some((x) => x.highlight === 'trade'))
  assert.equal(blockBuilderSteps(27, 3, 'es')[3].text, 'Te queda 1 unidad.')
  assert.equal(blockBuilderSteps(27, 3, 'en')[3].text, 'That leaves 1 one.')
})

// ---------------------------------------------------------------- estimate

test('estimate hints round to the nearest ten', () => {
  assert.equal(estimateHint(42, 3, 'en').text, '42 is close to 40. 40 times 3 is 120, so 42 times 3 is about 120.')
  assert.equal(estimateHint(42, 3, 'es').text, '42 está cerca de 40. 40 por 3 es 120, así que 42 por 3 es como 120.')
  assert.equal(estimateHint(78, 8, 'en').value, 640)
  assert.equal(estimateHint(99, 9, 'en').value, 900)
  assert.equal(estimateHint(40, 3, 'en').text, '40 is already round: 40 times 3 is 120.')
  assert.equal(estimateHint(42, 3, 'en').highlight, 'estimate')
})

// ---------------------------------------------------------------- misconceptions: true case + control each

test('forgotCarry: 78×8 → 564; control 565 does not match', () => {
  assert.equal(detectMisconception(78, 8, 564), 'forgotCarry')
  assert.equal(detectMisconception(27, 3, 61), 'forgotCarry')
  assert.notEqual(detectMisconception(78, 8, 565), 'forgotCarry')
  const h = misconceptionHint(78, 8, 564, 'en')!
  assert.equal(h.text, 'So close! You forgot the 6 you carried. Add it to 56.')
  assert.equal(h.highlight, 'carry')
  assert.equal(misconceptionHint(78, 8, 564, 'es')!.text, '¡Casi! Se te olvidó el 6 que llevabas. Súmalo al 56.')
})

test('carryBeforeMultiply: 78×8 → 1044; control 1045 does not match', () => {
  assert.equal(detectMisconception(78, 8, 1044), 'carryBeforeMultiply')
  assert.equal(detectMisconception(46, 2, 102), 'carryBeforeMultiply') // (4+1)×2 = 10 → 10|2
  assert.notEqual(detectMisconception(78, 8, 1045), 'carryBeforeMultiply')
  assert.equal(misconceptionHint(78, 8, 1044, 'en')!.highlight, 'tens')
  assert.match(misconceptionHint(78, 8, 1044, 'es')!.text, /^¡Casi! Primero multiplica: 7 por 8 es 56/)
})

test('onesOnly: 78×8 → 64 and 42×3 → 46; control 63 does not match', () => {
  assert.equal(detectMisconception(78, 8, 64), 'onesOnly')
  assert.equal(detectMisconception(42, 3, 46), 'onesOnly')
  assert.notEqual(detectMisconception(78, 8, 63), 'onesOnly')
  assert.equal(misconceptionHint(42, 3, 46, 'en')!.text, 'Good start! You did the ones. Now multiply the tens too: 4 times 3.')
  assert.equal(misconceptionHint(42, 3, 46, 'es')!.text, '¡Buen comienzo! Ya hiciste las unidades. Ahora multiplica también las decenas: 4 por 3.')
})

test('fullOnesProduct: 78×8 → 5664 (and 6264); control 5665 does not match', () => {
  assert.equal(detectMisconception(78, 8, 5664), 'fullOnesProduct')
  assert.equal(detectMisconception(78, 8, 6264), 'fullOnesProduct')
  assert.notEqual(detectMisconception(78, 8, 5665), 'fullOnesProduct')
  assert.equal(misconceptionHint(78, 8, 5664, 'en')!.text, 'Only the 4 goes in the ones place. Carry the 6 over to the tens.')
  assert.equal(misconceptionHint(78, 8, 5664, 'es')!.text, 'En el lugar de las unidades solo va el 4. Lleva el 6 a las decenas.')
})

test('carry detectors never fire on a no-regrouping problem', () => {
  // 42×3: concat(12, 6) is the CORRECT answer — must never be called "forgot the carry".
  assert.equal(detectMisconception(42, 3, 126), null)
  for (const w of [0, 1, 7, 99, 999]) {
    const k = detectMisconception(21, 3, w)
    assert.ok(k !== 'forgotCarry' && k !== 'carryBeforeMultiply' && k !== 'fullOnesProduct', `21×3 → ${w}: ${k}`)
  }
})

test('placeValue: 56+64 = 120, ×10, reversed digits; control 625 does not match', () => {
  assert.equal(detectMisconception(78, 8, 120), 'placeValue')
  assert.equal(detectMisconception(78, 8, 6240), 'placeValue')
  assert.equal(detectMisconception(78, 8, 426), 'placeValue')
  assert.equal(detectMisconception(40, 3, 12), 'placeValue')
  assert.equal(detectMisconception(78, 8, 625), null)
  assert.equal(misconceptionHint(78, 8, 120, 'en')!.text, 'Check the places! The 7 in 78 means 70, so 70 times 8 is 560.')
  assert.equal(misconceptionHint(78, 8, 120, 'es')!.text, '¡Revisa los lugares! El 7 de 78 vale 70, así que 70 por 8 es 560.')
  assert.match(misconceptionHint(78, 8, 6240, 'es')!.text, /^¡Revisa los lugares! Cada número va en su columna/)
})

test('no hint for the correct answer, unknown errors, or junk input', () => {
  for (const [a, b, ans] of SAMPLES) assert.equal(misconceptionHint(a, b, ans, 'en'), null)
  assert.equal(misconceptionHint(78, 8, 623, 'en'), null)
  assert.equal(misconceptionHint(78, 8, Number.NaN, 'en'), null)
  assert.equal(misconceptionHint(78, 8, -624, 'es'), null)
  assert.equal(misconceptionHint(78, 8, 62.4, 'es'), null)
})

test('exhaustive: no detector ever flags the correct product; hints never state the final answer', () => {
  let flagged = 0
  for (let a = 10; a <= 99; a++) {
    for (let b = 2; b <= 9; b++) {
      const ans = a * b
      assert.equal(detectMisconception(a, b, ans), null, `${a}×${b}`)
      for (const w of [564, 64, 120, ans * 10, ans + 1]) {
        const h = misconceptionHint(a, b, w, 'en')
        if (!h) continue
        flagged++
        assert.ok(!new RegExp(`\\b${ans}\\b`).test(h.text), `${a}×${b} hint gives away ${ans}: ${h.text}`)
      }
    }
  }
  assert.ok(flagged > 0)
})
