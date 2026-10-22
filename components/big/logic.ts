// UI adapter over the pure v2 logic (@python-autonomous owns lib/**; these files are imported,
// never edited here). The components import game logic ONLY through this file.
import type { BigProblem } from '@/lib/math/twoDigitProblems'
import { flipSplitMisconception, type FlipInput, type FlipStage } from '@/lib/math/flipSplit'
import type { Oops, OopsStep } from '@/lib/math/dragonOops'

export { storyFor, checkSlot, slotHint, mathCards, pickMathOk, type Story, type StoryTheme } from '@/lib/math/storyMissions'
export { flipSplitSteps, isFlipCorrect, type FlipStage } from '@/lib/math/flipSplit'
export { oopsFor, replayOops, isWrongStep, type Oops, type OopsStep } from '@/lib/math/dragonOops'
export { useHoardStore } from '@/lib/stores/hoardStore'

/** Gems added to the hoard for every finished problem (all modes; never for speed). */
export const GEMS_PER_PROBLEM = 3

/**
 * Amber hint for a known Flip & Split slip. `miss` = how many times this stage has been missed
 * (0-based) — the 3 tiers are shown one per miss, then the worked tier stays.
 */
export function flipHint(stage: FlipStage, input: FlipInput, problem: BigProblem, miss: number): string | undefined {
  const m = flipSplitMisconception(stage, input, problem)
  return m ? m.tiers[Math.min(2, Math.max(0, miss))].text : undefined
}

/** The pad prompt for fixing a Dragon Oops step: the step with its value blanked. */
export function oopsPrompt(s: OopsStep): string {
  const [x, y] = s.args
  switch (s.op) {
    case 'split': return `${x} = ? + ${y}`
    case 'mul': return `${x} × ${y} = ?`
    case 'add': return `${x} + ${y} = ?`
    case 'carry': return `${x}: carry ?`
    case 'join': return `Answer: ?`
  }
}

/** Tier-3 line: what the dragon did — a worked step, never the final answer. */
export function oopsWhy(o: Oops): string {
  const s = o.steps[o.wrongIndex]
  const [x, y] = s.args
  switch (o.kind) {
    case 'tensAsOnes': return `The dragon split ${x} into ${s.value} + ${y}. The ${s.value} in ${x} is ${s.value} tens.`
    case 'droppedZero': return `The dragon did ${x / 10} × ${y}. This step is ${x} × ${y}: put the zero back.`
    case 'addedInstead': return `The dragon added ${x} + ${y}. The sign says ×.`
    case 'forgotOnesPart': return `The dragon forgot to add the small piece, ${y}.`
    case 'forgotCarry': return `The dragon forgot the carry. Look at the step that says "carry".`
  }
}
