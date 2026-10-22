/**
 * flipSplit — steps + misconception detector for "Flip & Split" (Big Multiplication v2).
 *
 * Spec: ~/.claude/plans/mellow-roaming-hoare.md §"The four games" #4 (3.OA.B.5 commutativity,
 * 4.NBT.B.5 area model). Pure: no React, no DOM, no audio. English only (prototype).
 *
 * The card starts as b × a (3 × 42), the child predicts Same/Different, flips it to a × b
 * (42 × 3), chooses the side to split (the 2-digit factor), splits 42 → 40 | 2, solves both
 * parts and adds them.
 *
 * Hint contract (tests enforce): amber copy — never "wrong"/"incorrect"/"no" — and NO hint
 * tier ever contains the final product as a number. Tier 3 shows a worked step, then the UI
 * re-asks.
 */

import { type StepHighlight } from './stepScripts'
import { splitTensOnes, type BigProblem } from './twoDigitProblems'

export type FlipStage = 'predict' | 'flip' | 'chooseSide' | 'split' | 'tensPart' | 'onesPart' | 'add' | 'confirm'

export const FLIP_STAGES: readonly FlipStage[] = ['predict', 'flip', 'chooseSide', 'split', 'tensPart', 'onesPart', 'add', 'confirm']

export type FlipHighlight = StepHighlight | 'rectangle' | 'flip' | 'side'

export interface FlipStep {
  stage: FlipStage
  text: string
  speak: string
  highlight: FlipHighlight
  /** The number the child enters / finds at this step, when there is one. */
  value?: number
  /** Tap choices for predict ('Same' | 'Different') and chooseSide ([a, b]). */
  choices?: readonly (string | number)[]
}

/**
 * What the UI passes for each stage:
 *   predict / confirm → 'same' | 'different'   (confirm also accepts a number: the flipped card's answer)
 *   chooseSide        → the factor tapped (a or b)
 *   split             → [tens, ones] in either order, e.g. [40, 2]
 *   tensPart / onesPart / add → number
 *   flip              → anything (the Flip button cannot be "wrong")
 */
export type FlipInput = 'same' | 'different' | number | readonly [number, number]

export type FlipMisconceptionKind =
  | 'thinksFlipChanges'   // picked "Different"
  | 'tensAsOnes'          // split 42 as 4 + 2
  | 'forgotOnesPart'      // answered the tens part only (120)
  | 'droppedZero'         // 40 × 3 = 12
  | 'addedInstead'        // 40 + 3, 2 + 3
  | 'crossMultiplied'     // 40 × 2 — one part times the other part
  | 'splitSmallFactor'    // chose to split the 1-digit side

export interface FlipHint {
  text: string
  speak: string
  highlight: FlipHighlight
}

export interface FlipMisconception {
  kind: FlipMisconceptionKind
  /** [nudge, picture, worked step] — show one per miss, in order; none gives the final answer. */
  tiers: [FlipHint, FlipHint, FlipHint]
}

interface Parts {
  a: number
  b: number
  tensDigit: number
  tensValue: number
  onesDigit: number
  tensPart: number
  onesPart: number
  product: number
}

function parts({ a, b }: BigProblem): Parts {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 10 || a > 99 || b < 2 || b > 9) {
    throw new RangeError(`flipSplit expects a 2-digit × 1-digit problem, got ${a} × ${b}`)
  }
  const [tensValue, onesDigit] = splitTensOnes(a)
  return {
    a, b, tensDigit: tensValue / 10, tensValue, onesDigit,
    tensPart: tensValue * b, onesPart: onesDigit * b, product: a * b,
  }
}

function toSpeech(text: string): string {
  return text
    .replace(/\s*×\s*/g, ' times ')
    .replace(/\s*\+\s*/g, ' plus ')
    .replace(/\s*=\s*/g, ' is ')
    .replace(/\s*\|\s*/g, ' and ')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function fStep(stage: FlipStage, text: string, highlight: FlipHighlight, value?: number, choices?: readonly (string | number)[]): FlipStep {
  const s: FlipStep = { stage, text, speak: toSpeech(text), highlight }
  if (value !== undefined) s.value = value
  if (choices) s.choices = choices
  return s
}

function hint(text: string, highlight: FlipHighlight): FlipHint {
  return { text, speak: toSpeech(text), highlight }
}

/** 42 × 3 → 8 steps, one per stage, in FLIP_STAGES order. */
export function flipSplitSteps(problem: BigProblem): FlipStep[] {
  const p = parts(problem)
  return [
    fStep('predict', `${p.b} × ${p.a}. If we flip it to ${p.a} × ${p.b}, will the answer change?`, 'rectangle', undefined, ['Same', 'Different']),
    fStep('flip', `Flip! ${p.b} × ${p.a} turns into ${p.a} × ${p.b}. Same rectangle, same gems.`, 'flip'),
    fStep('chooseSide', `Which number is easier to split? Tap ${p.a}.`, 'side', p.a, [p.a, p.b]),
    fStep('split', `Split ${p.a} into ${p.tensValue} and ${p.onesDigit}.`, 'split', p.tensValue),
    fStep('tensPart', `${p.tensValue} × ${p.b} = ?`, 'tensPart', p.tensPart),
    fStep('onesPart', `${p.onesDigit} × ${p.b} = ?`, 'onesPart', p.onesPart),
    fStep('add', `${p.tensPart} + ${p.onesPart} = ?`, 'sum', p.product),
    fStep('confirm', `${p.a} × ${p.b} = ${p.product}, and ${p.b} × ${p.a} = ${p.product}. Same!`, 'answer', p.product),
  ]
}

function isPair(x: FlipInput): x is readonly [number, number] {
  return Array.isArray(x) && x.length === 2
}

function sameSet(pair: readonly [number, number], x: number, y: number): boolean {
  return (pair[0] === x && pair[1] === y) || (pair[0] === y && pair[1] === x)
}

/** Is this input right for the stage? 'flip' is always right. */
export function isFlipCorrect(stage: FlipStage, input: FlipInput, problem: BigProblem): boolean {
  const p = parts(problem)
  switch (stage) {
    case 'flip':
      return true
    case 'predict':
      return input === 'same'
    case 'confirm':
      return input === 'same' || input === p.product
    case 'chooseSide':
      return input === p.a
    case 'split':
      return isPair(input) && sameSet(input, p.tensValue, p.onesDigit)
    case 'tensPart':
      return input === p.tensPart
    case 'onesPart':
      return input === p.onesPart
    case 'add':
      return input === p.product
  }
}

function detect(stage: FlipStage, input: FlipInput, p: Parts): FlipMisconceptionKind | null {
  if (stage === 'predict' || stage === 'confirm') {
    if (input === 'different') return 'thinksFlipChanges'
    if (stage === 'predict' || typeof input !== 'number') return null
    // confirm with a number: same detectors as the sum
    return detect('add', input, p)
  }
  if (stage === 'chooseSide') return input === p.b ? 'splitSmallFactor' : null
  if (stage === 'split') return isPair(input) && sameSet(input, p.tensDigit, p.onesDigit) ? 'tensAsOnes' : null
  if (typeof input !== 'number' || !Number.isFinite(input)) return null
  const n = input

  if (stage === 'tensPart') {
    if (n === p.tensDigit * p.b) return 'droppedZero'
    if (n === p.tensValue + p.b || n === p.tensDigit + p.b) return 'addedInstead'
    if (n === p.tensValue * p.onesDigit || n === p.tensDigit * p.onesDigit) return 'crossMultiplied'
    return null
  }
  if (stage === 'onesPart') {
    if (n === p.onesDigit + p.b) return 'addedInstead'
    if (n === p.onesDigit * p.tensValue || n === p.onesDigit * p.tensDigit) return 'crossMultiplied'
    return null
  }
  // add
  if (n === p.tensPart) return 'forgotOnesPart'
  if (n === p.tensDigit * p.b + p.onesPart) return 'droppedZero'
  if (n === p.a + p.b || n === (p.tensValue + p.b) + (p.onesDigit + p.b) || n === p.tensPart + p.onesDigit + p.b) return 'addedInstead'
  if (n === p.tensValue * p.onesDigit + p.onesPart || n === p.tensPart + p.onesDigit * p.tensValue) return 'crossMultiplied'
  return null
}

function tiersFor(kind: FlipMisconceptionKind, stage: FlipStage, p: Parts): [FlipHint, FlipHint, FlipHint] {
  const tv = p.tensValue
  switch (kind) {
    case 'thinksFlipChanges':
      return [
        hint(`Good thinking! Let's test it. Flip the card and look at the rectangle.`, 'flip'),
        hint(`${p.b} rows of ${p.a}, or ${p.a} rows of ${p.b} — it's the same rectangle, just turned.`, 'rectangle'),
        hint(`Turning it doesn't add or take away any gems. ${p.b} × ${p.a} and ${p.a} × ${p.b} match.`, 'rectangle'),
      ]
    case 'splitSmallFactor':
      return [
        hint(`${p.b} is already small. Let's split the big number instead.`, 'side'),
        hint(`${p.a} has tens and ones, so it splits nicely.`, 'side'),
        hint(`Tap ${p.a}. We'll break it into ${tv} and ${p.onesDigit}.`, 'side'),
      ]
    case 'tensAsOnes':
      return [
        hint(`Nice try! The ${p.tensDigit} in ${p.a} is in the tens place.`, 'split'),
        hint(`${p.tensDigit} tens is ${p.tensDigit} bars of ten. Count them: that's ${tv}.`, 'split'),
        hint(`${p.a} = ${tv} + ${p.onesDigit}. Try the split again.`, 'split'),
      ]
    case 'droppedZero':
      if (stage === 'add') {
        return [
          hint(`Almost! Check the tens box — ${tv} × ${p.b} is a lot of tens.`, 'tensPart'),
          hint(`${p.tensDigit} × ${p.b} = ${p.tensDigit * p.b}, so ${tv} × ${p.b} is ${p.tensDigit * p.b} tens.`, 'tensPart'),
          hint(`${p.tensDigit * p.b} tens is ${p.tensPart}. Now add ${p.tensPart} + ${p.onesPart}.`, 'tensPart'),
        ]
      }
      return [
        hint(`So close! That's ${p.tensDigit} × ${p.b}. But it's ${tv}, not ${p.tensDigit}.`, 'tensPart'),
        hint(`${p.tensDigit} × ${p.b} = ${p.tensDigit * p.b}. Each one is a ten, so it's ${p.tensDigit * p.b} tens.`, 'tensPart'),
        hint(`${p.tensDigit * p.b} tens — put the zero back on. Try ${tv} × ${p.b} again.`, 'tensPart'),
      ]
    case 'addedInstead': {
      const box = stage === 'onesPart' ? 'onesPart' : stage === 'tensPart' ? 'tensPart' : 'sum'
      const x = stage === 'onesPart' ? p.onesDigit : tv
      if (stage === 'add' || stage === 'confirm') {
        return [
          hint(`Hmm, it looks like we added. This box is times!`, 'sum'),
          hint(`First ${tv} × ${p.b}, then ${p.onesDigit} × ${p.b}. Then add those two.`, 'sum'),
          hint(`${tv} × ${p.b} = ${p.tensPart} and ${p.onesDigit} × ${p.b} = ${p.onesPart}. Now add them.`, 'sum'),
        ]
      }
      return [
        hint(`Hmm, it looks like we added. Look at the sign — it means times!`, box),
        hint(`${x} × ${p.b} means ${p.b} groups of ${x}.`, box),
        hint(`Count ${p.b} groups of ${x}: ${Array.from({ length: p.b }, () => x).join(' + ')}.`, box),
      ]
    }
    case 'crossMultiplied': {
      const box = stage === 'onesPart' ? 'onesPart' : stage === 'tensPart' ? 'tensPart' : 'sum'
      return [
        hint(`Careful! Each piece of ${p.a} gets multiplied by ${p.b}.`, box),
        hint(`The two pieces are ${tv} and ${p.onesDigit}. Both times ${p.b} — not times each other.`, box),
        hint(stage === 'onesPart'
          ? `This box is ${p.onesDigit} × ${p.b}: ${p.b} groups of ${p.onesDigit}.`
          : stage === 'tensPart'
            ? `This box is ${tv} × ${p.b}: ${p.b} groups of ${tv}.`
            : `${tv} × ${p.b} = ${p.tensPart} and ${p.onesDigit} × ${p.b} = ${p.onesPart}. Now add them.`, box),
      ]
    }
    case 'forgotOnesPart':
      return [
        hint(`Nice — that's the ${tv} part! Don't forget the ${p.onesDigit} part.`, 'sum'),
        hint(`The rectangle has two boxes: ${tv} × ${p.b} and ${p.onesDigit} × ${p.b}. Use both.`, 'sum'),
        hint(`${p.tensPart} + ${p.onesPart}: start at ${p.tensPart} and count on ${p.onesPart}.`, 'sum'),
      ]
  }
}

/**
 * Which known slip is this, with its 3 hint tiers? null when the input is correct or matches
 * no known pattern (the UI then re-shows the current step's text).
 */
export function flipSplitMisconception(stage: FlipStage, input: FlipInput, problem: BigProblem): FlipMisconception | null {
  const p = parts(problem)
  if (isFlipCorrect(stage, input, problem)) return null
  const kind = detect(stage, input, p)
  if (!kind) return null
  return { kind, tiers: tiersFor(kind, stage, p) }
}
