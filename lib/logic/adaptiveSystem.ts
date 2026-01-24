import { GameProblem, AttemptMetric, InteractionType } from '@/lib/types/gameEngine';

/**
 * Calculates the next problem's parameters based on "Flow State" logic.
 * If user is fast/correct -> increase abstraction (remove pictures).
 * If user is slow/hesitant -> increase scaffolding (add pictures/hints).
 *
 * IMPORTANT: Returns 'tap' or 'choice' for standard interactions, which lets
 * the module's configured gameType control rendering. Only returns specialized
 * interactions (drag-target, physics-feed, sequence) for advanced adaptive modes.
 */
export const calculateFlowState = (
  history: AttemptMetric[],
  currentStreak: number
): { nextInteraction: InteractionType; visualAidDensity: number } => {
  const last3 = history.slice(-3);
  const avgTime = last3.reduce((acc, m) => acc + m.timeTakenMs, 0) / (last3.length || 1);

  // "CodeSpark" Logic: If they are crushing it, switch to sequencing/logic
  // "Duolingo" Logic: If they struggle, revert to visual counting

  let nextInteraction: InteractionType = 'tap'; // Default: use standard mini-games
  let visualAidDensity = 1.0; // 1.0 = All pictures, 0.0 = Just numbers

  // Only trigger specialized adaptive modes for exceptional performance
  // This ensures standard mini-games (bubblePop, shuffle, etc.) work by default
  if (currentStreak > 7 && avgTime < 3000 && history.length >= 5) {
    // Exceptional performance: switch to challenging sequence puzzles
    nextInteraction = 'sequence';
    visualAidDensity = 0.2;
  } else if (currentStreak > 5 && avgTime < 4000 && history.length >= 3) {
    // Very good performance: active drag engagement
    nextInteraction = 'drag-target';
    visualAidDensity = 0.5;
  }
  // Default case: 'tap' lets standard gameType mini-games render
  // No need to force physics-feed - the standard games are already fun!

  return { nextInteraction, visualAidDensity };
};
