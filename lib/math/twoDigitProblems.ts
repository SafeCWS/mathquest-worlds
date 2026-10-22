/**
 * twoDigitProblems — pure generator for "Big Multiplication" (2-digit × 1-digit).
 *
 * Spec: ~/.claude/plans/mellow-roaming-hoare.md, Part 2. No React, no store,
 * no Math.random at module scope — every random call goes through an injected
 * `rng` so tests are deterministic.
 *
 * Levels partition the problem space:
 *   L1 — no regrouping: ones × b < 10 AND tens × b < 10 (product < 100). 21×3, 32×2, 41×2
 *   L2 — regrouping in the ones only: ones × b ≥ 10, tens column does not overflow
 *        (product < 100). 27×3, 46×2
 *   L3 — bigger factors: a 40–99, b 3–9, product ≥ 100. 42×3, 58×6, 78×8, 99×9
 */

export type BigLevel = 1 | 2 | 3
export const BIG_LEVELS: readonly BigLevel[] = [1, 2, 3] as const

export interface BigProblem {
  /** Two-digit factor (10–99). */
  a: number
  /** One-digit factor (2–9). */
  b: number
}

export type Rng = () => number

export interface ColumnSteps {
  onesDigit: number
  tensDigit: number
  /** onesDigit × b */
  onesProduct: number
  /** digit written in the ones place of the answer */
  onesWrite: number
  /** carried into the tens column (0 when none) */
  carry: number
  /** tensDigit × b */
  tensProduct: number
  /** tensProduct + carry — written to the left of onesWrite */
  tensSum: number
  product: number
}

/** The exact examples named in the spec, offered first in each level. */
export const LEVEL_EXAMPLES: Record<BigLevel, readonly BigProblem[]> = {
  1: [{ a: 21, b: 3 }, { a: 32, b: 2 }, { a: 41, b: 2 }],
  2: [{ a: 27, b: 3 }, { a: 46, b: 2 }],
  3: [{ a: 42, b: 3 }, { a: 58, b: 6 }, { a: 78, b: 8 }, { a: 99, b: 9 }],
}

export function columnSteps({ a, b }: BigProblem): ColumnSteps {
  const onesDigit = a % 10
  const tensDigit = Math.floor(a / 10)
  const onesProduct = onesDigit * b
  const onesWrite = onesProduct % 10
  const carry = Math.floor(onesProduct / 10)
  const tensProduct = tensDigit * b
  const tensSum = tensProduct + carry
  return { onesDigit, tensDigit, onesProduct, onesWrite, carry, tensProduct, tensSum, product: a * b }
}

/** Which level a problem belongs to, or null if it fits none (e.g. 15×3). */
export function levelOf(p: BigProblem): BigLevel | null {
  if (!isValidShape(p)) return null
  const s = columnSteps(p)
  if (s.product < 100) {
    if (s.carry === 0 && s.tensProduct < 10) return 1
    if (s.carry > 0 && s.tensSum < 10) return 2
    return null
  }
  if (p.a >= 40 && p.b >= 3) return 3
  return null
}

function isValidShape({ a, b }: BigProblem): boolean {
  return Number.isInteger(a) && Number.isInteger(b) && a >= 10 && a <= 99 && b >= 2 && b <= 9
}

/** Every problem in a level, in a stable order (a asc, then b asc). */
export function allProblems(level: BigLevel): BigProblem[] {
  const out: BigProblem[] = []
  for (let a = 10; a <= 99; a++) {
    for (let b = 2; b <= 9; b++) {
      if (levelOf({ a, b }) === level) out.push({ a, b })
    }
  }
  return out
}

export function sameProblem(x: BigProblem | null | undefined, y: BigProblem | null | undefined): boolean {
  return !!x && !!y && x.a === y.a && x.b === y.b
}

/**
 * Next problem for a level. Never returns `prev`. The first `LEVEL_EXAMPLES`
 * entries are served in order while `served` is below their count (so a child
 * sees 21×3 first, as in the spec), then random from the full level pool.
 */
export function nextProblem(level: BigLevel, prev: BigProblem | null, served = 0, rng: Rng = Math.random): BigProblem {
  const examples = LEVEL_EXAMPLES[level]
  if (served < examples.length && !sameProblem(examples[served], prev)) return { ...examples[served] }
  const pool = allProblems(level).filter((p) => !sameProblem(p, prev))
  const i = Math.min(pool.length - 1, Math.floor(rng() * pool.length))
  return { ...pool[i] }
}

/** 42 → [40, 2]. */
export function splitTensOnes(a: number): [number, number] {
  return [Math.floor(a / 10) * 10, a % 10]
}

/** Nearest ten, halves up (45 → 50). */
export function roundToTen(a: number): number {
  return Math.round(a / 10) * 10
}

export interface EstimateChoices {
  /** The sensible estimate: roundToTen(a) × b. */
  correct: number
  /** Three choices: the estimate, ×10 and ÷10 — shuffled by `rng`. */
  choices: number[]
}

/** "42 × 3 is about…" → 120 / 1,200 / 12. */
export function estimateChoices({ a, b }: BigProblem, rng: Rng = Math.random): EstimateChoices {
  const correct = roundToTen(a) * b
  const set = [correct, correct * 10, Math.round(correct / 10)]
  for (let i = set.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[set[i], set[j]] = [set[j], set[i]]
  }
  return { correct, choices: set }
}

// ───────────── Quiet adaptivity (research rec #10) ─────────────
// 3 first-try solves in a row → 'harder'; 2 misses on one step → 'easier'.
// Stays inside the level; never shown to the child; never repeats back-to-back.

export type Difficulty = 'easier' | 'same' | 'harder'

/** Regrouping load: the carry size, then the product. 21×3 → [0, 63]; 78×8 → [6, 624]. */
export function difficultyScore(p: BigProblem): number {
  const s = columnSteps(p)
  return s.carry * 1000 + s.product
}

export function nextProblemAdaptive(
  level: BigLevel,
  prev: BigProblem | null,
  served: number,
  difficulty: Difficulty,
  rng: Rng = Math.random,
): BigProblem {
  if (difficulty === 'same') return nextProblem(level, prev, served, rng)
  const sorted = allProblems(level).sort((x, y) => difficultyScore(x) - difficultyScore(y))
  const third = Math.max(2, Math.ceil(sorted.length / 3))
  const band = (difficulty === 'easier' ? sorted.slice(0, third) : sorted.slice(-third)).filter((p) => !sameProblem(p, prev))
  const i = Math.min(band.length - 1, Math.floor(rng() * band.length))
  return { ...band[i] }
}

// ───────────── Shuffle deck (operator 2026-10-22: "always must be shuffling") ─────────────
// Deal every problem in a level once, in random order, then reshuffle. A recent window
// (carried across games and reshuffles) keeps the same few problems from coming back.
// Round tens (40×3, 10×2) are left out: no ones column, so no practice of the skill.

export interface DeckState {
  queue: Record<BigLevel, BigProblem[]>
  /** Most recent first, all levels. */
  recent: BigProblem[]
}

export function emptyDeck(): DeckState {
  return { queue: { 1: [], 2: [], 3: [] }, recent: [] }
}

export function deckPool(level: BigLevel): BigProblem[] {
  return allProblems(level).filter((p) => p.a % 10 !== 0)
}

export function shuffled<T>(list: readonly T[], rng: Rng = Math.random): T[] {
  const out = list.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function recentWindow(level: BigLevel): number {
  return Math.min(12, Math.floor(deckPool(level).length / 2))
}

function isRecent(state: DeckState, level: BigLevel, p: BigProblem): boolean {
  return state.recent.slice(0, recentWindow(level)).some((r) => sameProblem(r, p))
}

/** Draw the next problem. Mutates nothing: returns the new deck state. */
export function drawProblem(
  state: DeckState,
  level: BigLevel,
  difficulty: Difficulty = 'same',
  rng: Rng = Math.random,
): { problem: BigProblem; state: DeckState } {
  let queue = state.queue[level].slice()
  let problem: BigProblem | undefined

  if (difficulty !== 'same') {
    const sorted = deckPool(level).sort((x, y) => difficultyScore(x) - difficultyScore(y))
    const third = Math.max(2, Math.ceil(sorted.length / 3))
    const band = difficulty === 'easier' ? sorted.slice(0, third) : sorted.slice(-third)
    const fresh = band.filter((p) => !isRecent(state, level, p))
    const pick = fresh.length ? fresh : band.filter((p) => !sameProblem(p, state.recent[0]))
    problem = pick[Math.min(pick.length - 1, Math.floor(rng() * pick.length))]
    queue = queue.filter((p) => !sameProblem(p, problem))
  } else {
    // Skip anything seen recently; reshuffle the full pool when the queue runs dry.
    for (let guard = 0; guard < 2 && !problem; guard++) {
      if (queue.length === 0) queue = shuffled(deckPool(level), rng)
      const idx = queue.findIndex((p) => !isRecent(state, level, p))
      if (idx >= 0) problem = queue.splice(idx, 1)[0]
      else queue = []
    }
    problem ??= queue.shift() ?? deckPool(level)[0]
  }

  return {
    problem: { ...problem },
    state: { queue: { ...state.queue, [level]: queue }, recent: [problem, ...state.recent].slice(0, 24) },
  }
}
