// Adaptive difficulty system based on diagnostic results

import { Module } from '@/lib/constants/levels'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

/**
 * Adjusts module difficulty parameters based on player's skill level
 */
export function adjustModuleForSkillLevel(
  module: Module,
  skillLevel: SkillLevel
): Module {
  const adjusted = { ...module }

  switch (skillLevel) {
    case 'beginner':
      // Easier problems - reduce max numbers, increase visuals
      adjusted.maxNumber = Math.max(5, Math.floor(module.maxNumber * 0.6))
      adjusted.minNumber = 1
      // Prefer tap and choice (more visual)
      adjusted.interactionTypes = ['tap', 'choice']
      break

    case 'intermediate':
      // Standard difficulty - use as-is
      break

    case 'advanced':
      // Harder problems - increase range, add complexity
      adjusted.maxNumber = Math.min(99, Math.ceil(module.maxNumber * 1.5))
      adjusted.minNumber = Math.max(1, Math.floor(module.minNumber * 1.2))
      // Include all interaction types
      if (!adjusted.interactionTypes.includes('trace')) {
        adjusted.interactionTypes = [...adjusted.interactionTypes, 'trace']
      }
      break
  }

  return adjusted
}

/**
 * Get recommended starting module based on skill level
 */
export function getRecommendedStartingModule(
  skillLevel: SkillLevel,
  levelId: number
): number {
  switch (skillLevel) {
    case 'beginner':
      return 1 // Start from module 1

    case 'intermediate':
      // Skip first module if level 1, otherwise start from module 1
      return levelId === 1 ? 2 : 1

    case 'advanced':
      // Skip first two modules if level 1, otherwise start from module 2
      return levelId === 1 ? 3 : 2
  }
}

/**
 * Should show diagnostic quiz?
 * Returns true if user hasn't completed diagnostic yet
 */
export function shouldShowDiagnostic(
  diagnosticCompleted: boolean,
  totalStars: number
): boolean {
  // Show diagnostic if:
  // 1. Never completed before, OR
  // 2. User has 0 stars (fresh start)
  return !diagnosticCompleted || totalStars === 0
}

/**
 * Get encouragement message based on diagnostic performance
 */
export function getDiagnosticFeedback(
  skillLevel: SkillLevel
): { title: string; message: string; emoji: string } {
  switch (skillLevel) {
    case 'beginner':
      return {
        title: 'Perfect Starting Point!',
        message: "We'll start with fun visual counting and work our way up!",
        emoji: '🌱'
      }

    case 'intermediate':
      return {
        title: 'Great Foundation!',
        message: "You know your basics! Let's build on that!",
        emoji: '🌟'
      }

    case 'advanced':
      return {
        title: 'Math Superstar!',
        message: "Wow! We'll challenge you with harder problems!",
        emoji: '🚀'
      }
  }
}
