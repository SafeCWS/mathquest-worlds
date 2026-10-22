/**
 * blockLayout — what Block Builder DRAWS for a big problem (product ≥ 100, Level 3).
 * Pure: no React. Item #1 of the 2026-10-22 round: never more than ~15 objects on screen.
 *
 * Place-value crates: big crate = 100, crate = 10, apple = 1.
 * Each column draws at most COLUMN_CAP icons; a bigger count is ONE stacked icon with a ×N badge.
 * Stages (one tap each):
 *   truck     — one truck with a ×b badge carrying (tens digit) crates + (ones digit) apples
 *   unloaded  — trucks gone; mat shows tensDigit×b crates and onesDigit×b apples
 *   onesDone  — every 10 apples filled a crate        (skipped when ones < 10)
 *   tensDone  — every 10 crates filled a big crate    (skipped when crates < 10)
 * The truck is only on screen in the first stage, so the two halves never add up.
 */
import { columnSteps, type BigProblem } from './twoDigitProblems'

export const COLUMN_CAP = 4
export const MAX_OBJECTS = 15

export type CrateKind = 'bigCrate' | 'crate' | 'apple'

export interface CrateColumn {
  kind: CrateKind
  /** True count this column stands for. */
  count: number
  /** Icons actually drawn (≤ COLUMN_CAP). */
  icons: number
  /** ×N badge on a single stacked icon, or null when every item is drawn. */
  badge: number | null
}

export interface Counts {
  hundreds: number
  tens: number
  ones: number
}

export type CrateStage = 'truck' | 'unloaded' | 'onesDone' | 'tensDone'

export function column(kind: CrateKind, count: number, cap = COLUMN_CAP): CrateColumn {
  if (count <= 0) return { kind, count: 0, icons: 0, badge: null }
  if (count <= cap) return { kind, count, icons: count, badge: null }
  return { kind, count, icons: 1, badge: count }
}

export function matColumns(c: Counts, cap = COLUMN_CAP): CrateColumn[] {
  return [column('bigCrate', c.hundreds, cap), column('crate', c.tens, cap), column('apple', c.ones, cap)]
}

/** Counts on the mat at each stage. */
export function stageCounts(p: BigProblem, stage: CrateStage): Counts {
  const s = columnSteps(p)
  const tens0 = s.tensDigit * p.b
  const ones0 = s.onesDigit * p.b
  if (stage === 'truck') return { hundreds: 0, tens: 0, ones: 0 }
  if (stage === 'unloaded') return { hundreds: 0, tens: tens0, ones: ones0 }
  const tens1 = tens0 + Math.floor(ones0 / 10)
  const ones1 = ones0 % 10
  if (stage === 'onesDone') return { hundreds: 0, tens: tens1, ones: ones1 }
  return { hundreds: Math.floor(tens1 / 10), tens: tens1 % 10, ones: ones1 }
}

/** Stages this problem actually walks through (trades that are not needed are skipped). */
export function stagesFor(p: BigProblem): CrateStage[] {
  const out: CrateStage[] = ['truck', 'unloaded']
  const u = stageCounts(p, 'unloaded')
  if (u.ones >= 10) out.push('onesDone')
  if (stageCounts(p, 'onesDone').tens >= 10) out.push('tensDone')
  return out
}

/** The truck's own load: tens-digit crates and ones-digit apples, capped the same way. */
export function truckColumns(p: BigProblem, cap = COLUMN_CAP): CrateColumn[] {
  const s = columnSteps(p)
  return [column('crate', s.tensDigit, cap), column('apple', s.onesDigit, cap)]
}

/** Objects drawn at a stage: truck + its icons, or the mat's icons (stack badges are part of their icon). */
export function objectsAt(p: BigProblem, stage: CrateStage): number {
  if (stage === 'truck') return 1 + truckColumns(p).reduce((n, c) => n + c.icons, 0)
  return matColumns(stageCounts(p, stage)).reduce((n, c) => n + c.icons, 0)
}
