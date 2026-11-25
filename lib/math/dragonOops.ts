/**
 * dragonOops — "Dragon Oops" (Big Multiplication v2, optional 5th game).
 *
 * Spec: ~/.claude/plans/mellow-roaming-hoare.md §"The four games" #5 (WWC monitor/reflect,
 * "characters make mistakes"). The dragon shows a fully worked problem with exactly ONE wrong
 * step; every later step is computed correctly FROM the wrong value, so the final answer is off
 * and the child has to find the FIRST step that does not hold, then fix it on the pad.
 *
 * Pure: no React, no DOM. English only (prototype). Injectable rng.
 *
 * Every step carries its arithmetic (`op` + `args`) so `stepHolds()` can check it — the tests
 * use that to prove there is exactly one broken step and that fixing it repairs the whole chain.
 */

import { levelOf, splitTensOnes, type BigProblem, type Rng } from './twoDigitProblems'

export type OopsMethod = 'split' | 'column'

/**
 *   split → args [a, ones]        holds when value + ones === a        ("42 = 40 + 2")
 *   mul   → args [x, y]           holds when value === x × y           ("40 × 3 = 120")
 *   add   → args [x, y]           holds when value === x + y           ("120 + 6 = 126")
 *   carry → args [onesProduct]    holds when value === ⌊onesProduct/10⌋ ("64: write 4, carry 6")
 *   join  → args [tensSum, write] holds when value === tensSum×10+write ("Answer: 624")
 */
export type OopsOp = 'split' | 'mul' | 'add' | 'carry' | 'join'

export type OopsKind = 'tensAsOnes' | 'droppedZero' | 'addedInstead' | 'forgotOnesPart' | 'forgotCarry'

export interface OopsStep {
  text: string
  speak: string
  value: number
  op: OopsOp
  args: number[]
  wrong?: true
}

export interface Oops {
  problem: BigProblem
  method: OopsMethod
  kind: OopsKind
  steps: OopsStep[]
  /** Index of the one wrong step. */
  wrongIndex: number
  /** The value that step should have. */
  fix: number
  /** Dragon's line for the intro card. */
  intro: string
}

export function stepHolds(s: OopsStep): boolean {
  const [x, y] = s.args
  switch (s.op) {
    case 'split': return s.value + y === x
    case 'mul': return s.value === x * y
    case 'add': return s.value === x + y
    case 'carry': return s.value === Math.floor(x / 10)
    case 'join': return s.value === x * 10 + y
  }
}

function speech(text: string): string {
  return text
    .replace(/\s*×\s*/g, ' times ')
    .replace(/\s*\+\s*/g, ' plus ')
    .replace(/\s*=\s*/g, ' is ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function mk(text: string, value: number, op: OopsOp, args: number[]): OopsStep {
  return { text, speak: speech(text), value, op, args }
}

interface Override { index: number; value: number }

function ov(o: Override | undefined, i: number, natural: number): number {
  return o && o.index === i ? o.value : natural
}

/** split: 42 = 40 + 2 · 40 × 3 = 120 · 2 × 3 = 6 · 120 + 6 = 126 */
export function buildSplit({ a, b }: BigProblem, o?: Override): OopsStep[] {
  const [, ones] = splitTensOnes(a)
  const v0 = ov(o, 0, a - ones)
  const v1 = ov(o, 1, v0 * b)
  const v2 = ov(o, 2, ones * b)
  const v3 = ov(o, 3, v1 + v2)
  return [
    mk(`${a} = ${v0} + ${ones}`, v0, 'split', [a, ones]),
    mk(`${v0} × ${b} = ${v1}`, v1, 'mul', [v0, b]),
    mk(`${ones} × ${b} = ${v2}`, v2, 'mul', [ones, b]),
    mk(`${v1} + ${v2} = ${v3}`, v3, 'add', [v1, v2]),
  ]
}

/** column: 8 × 8 = 64 · 64: write 4, carry 6 · 7 × 8 = 56 · 56 + 6 = 62 · Answer: 624 */
export function buildColumn({ a, b }: BigProblem, o?: Override): OopsStep[] {
  const tens = Math.floor(a / 10)
  const ones = a % 10
  const c0 = ov(o, 0, ones * b)
  const write = c0 % 10
  const c1 = ov(o, 1, Math.floor(c0 / 10))
  const c2 = ov(o, 2, tens * b)
  const c3 = ov(o, 3, c2 + c1)
  const c4 = ov(o, 4, c3 * 10 + write)
  return [
    mk(`${ones} × ${b} = ${c0}`, c0, 'mul', [ones, b]),
    mk(`${c0}: write ${write}, carry ${c1}`, c1, 'carry', [c0]),
    mk(`${tens} × ${b} = ${c2}`, c2, 'mul', [tens, b]),
    mk(`${c2} + ${c1} = ${c3}`, c3, 'add', [c2, c1]),
    mk(`Answer: ${c4}`, c4, 'join', [c3, write]),
  ]
}

interface Candidate { method: OopsMethod; kind: OopsKind; index: number; value: number }

/** Every plausible single slip for this problem (wrong value always ≠ the right one). */
export function oopsCandidates(problem: BigProblem): Candidate[] {
  const { a, b } = problem
  const [tensValue, ones] = splitTensOnes(a)
  const tensDigit = tensValue / 10
  const level = levelOf(problem)
  const out: Candidate[] = []
  const add = (c: Candidate, right: number) => {
    if (c.value !== right && c.value >= 0) out.push(c)
  }
  add({ method: 'split', kind: 'tensAsOnes', index: 0, value: tensDigit }, tensValue)
  add({ method: 'split', kind: 'droppedZero', index: 1, value: tensDigit * b }, tensValue * b)
  add({ method: 'split', kind: 'addedInstead', index: 1, value: tensValue + b }, tensValue * b)
  add({ method: 'split', kind: 'addedInstead', index: 2, value: ones + b }, ones * b)
  // Wrong LAST step only above L1 — at L1 the slip must sit earlier in the chain.
  if (level !== 1) add({ method: 'split', kind: 'forgotOnesPart', index: 3, value: tensValue * b }, a * b)
  const carry = Math.floor((ones * b) / 10)
  if (carry > 0) add({ method: 'column', kind: 'forgotCarry', index: 3, value: tensDigit * b }, tensDigit * b + carry)
  return out
}

export const OOPS_INTRO = 'Oops! I made one mistake. Can you find it?'

/**
 * A worked problem with ONE wrong step. Column method only when the problem carries
 * (L2/L3), and then it is chosen about half the time.
 */
export function oopsFor(problem: BigProblem, rng: Rng = Math.random): Oops {
  const { a, b } = problem
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 11 || a > 99 || b < 2 || b > 9 || a % 10 === 0) {
    throw new RangeError(`oopsFor expects a 2-digit (not round) × 1-digit problem, got ${a} × ${b}`)
  }
  const all = oopsCandidates(problem)
  const column = all.filter((c) => c.method === 'column')
  const split = all.filter((c) => c.method === 'split')
  const pool = column.length && rng() < 0.5 ? column : split
  const c = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]
  const build = c.method === 'split' ? buildSplit : buildColumn
  const right = build(problem)
  const steps = build(problem, { index: c.index, value: c.value })
  steps[c.index] = { ...steps[c.index], wrong: true }
  return { problem: { a, b }, method: c.method, kind: c.kind, steps, wrongIndex: c.index, fix: right[c.index].value, intro: OOPS_INTRO }
}

/** Rebuild the chain with the child's value at the wrong step. With `fix`, every step holds. */
export function replayOops(oops: Oops, value: number): OopsStep[] {
  const build = oops.method === 'split' ? buildSplit : buildColumn
  return build(oops.problem, { index: oops.wrongIndex, value })
}

/** Did the child tap the right step? Only the FIRST broken step counts. */
export function isWrongStep(oops: Oops, index: number): boolean {
  return index === oops.wrongIndex
}
