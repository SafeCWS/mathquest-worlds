import type { BigProblem } from '@/lib/math/twoDigitProblems'
import type { StepHighlight } from '@/lib/math/stepScripts'

export type BigMode = 'blocks' | 'split' | 'column' | 'guess'
export const BIG_MODES: readonly BigMode[] = ['blocks', 'split', 'column', 'guess'] as const

export function isBigMode(v: string | null | undefined): v is BigMode {
  return !!v && (BIG_MODES as readonly string[]).includes(v)
}

/** 3-tier amber hint ladder for the CURRENT step: nudge → show the step → worked step. */
export interface HintLadder {
  /** Tier 1 — points at where to look, no numbers given away. */
  nudge: string
  /** Tier 2 — the strategy for this step (shown automatically after a wrong answer). */
  step: string
  /** Tier 3 — the worked step (from lib/math/stepScripts). */
  worked: string
  /** What the worked step glows. */
  highlight?: StepHighlight
}

export type MascotEvent = 'step' | 'trade'

/** Contract between the game shell and each of the 4 modes. */
export interface ModeProps {
  problem: BigProblem
  /** Final answer correct — shell plays correct()+streak and shows the celebration. */
  onSolved: () => void
  /**
   * Any wrong answer — shell shakes, plays wrong(), auto-opens the hint ladder at tier 2.
   * Pass `finalAnswer` when the child answered the WHOLE problem, so the shell can try
   * misconceptionHint(a, b, finalAnswer, locale) first. Never touches progress.
   */
  onWrong: (finalAnswer?: number) => void
  /** A step done inside the problem — stepComplete() + mascot. */
  onStep: (event?: MascotEvent) => void
  /** Hint ladder for the current step. Call on every step change. */
  setHint: (ladder: HintLadder) => void
  /** What 🔊 reads for the current step. */
  setSpeech: (text: string) => void
  /** Cell the shell wants glowing (from a misconception hint or tier-3). */
  highlight: StepHighlight | null
  /**
   * First-time walkthrough: the mode shows <DemoFinger> on its step-1 target, glows it,
   * narrates the step, PERFORMS it itself, then calls onDemoDone(). Taps are blocked meanwhile.
   */
  demo: boolean
  onDemoDone: () => void
  /** Read text aloud in the current locale (shell → speakFor). */
  narrate: (text: string) => void
}
