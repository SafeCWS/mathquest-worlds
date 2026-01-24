/**
 * Enhanced Game Components - Export Index
 *
 * Import everything you need for enhanced gameplay in one line:
 *
 * import {
 *   AnimatedAnswer,
 *   AnimatedButton,
 *   ConfettiBurst,
 *   useGameEffects
 * } from '@/components/game/enhanced'
 */

// Animated Components
export {
  AnimatedAnswer,
  AnimatedNumber,
  AnimatedProblem
} from '../AnimatedAnswer'

export {
  AnimatedButton,
  WorldButton,
  IconButton
} from '../AnimatedButton'

// Particle Effects
export {
  ConfettiBurst,
  StarBurst,
  FloatingText,
  RippleEffect,
  SparkleTrail,
  ComboMeter,
  AchievementPopup
} from '../ParticleEffects'

// Hooks
export {
  useGameEffects,
  useStreakAnimation,
  useNumberAnimation
} from '@/lib/hooks/useGameEffects'

// Types
export type { GameEffect } from '@/lib/hooks/useGameEffects'
