import { AttemptMetric, InteractionType } from '@/lib/types/gameEngine';

/**
 * Calculates the next problem's parameters based on "Flow State" logic.
 * If user is fast/correct -> increase abstraction (remove pictures).
 * If user is slow/hesitant -> increase scaffolding (add pictures/hints).
 *
 * Returns 'tap' for standard interactions (lets the module's configured gameType
 * control rendering). Only returns specialized interactions (drag-target, sequence)
 * for advanced adaptive modes triggered by exceptional performance.
 */
export function calculateFlowState(
  history: AttemptMetric[],
  currentStreak: number
): { nextInteraction: InteractionType; visualAidDensity: number } {
  const last3 = history.slice(-3);
  const avgTime = last3.reduce((acc, m) => acc + m.timeTakenMs, 0) / (last3.length || 1);

  let nextInteraction: InteractionType = 'tap';
  let visualAidDensity = 1.0;

  if (currentStreak > 10 && avgTime < 3000 && history.length >= 8) {
    nextInteraction = 'sequence';
    visualAidDensity = 0.2;
  } else if (currentStreak > 8 && avgTime < 4000 && history.length >= 8) {
    nextInteraction = 'drag-target';
    visualAidDensity = 0.5;
  }

  return { nextInteraction, visualAidDensity };
}
