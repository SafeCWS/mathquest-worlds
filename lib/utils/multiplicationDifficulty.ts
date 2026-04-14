/**
 * Utilities for generating plausible wrong answers and adaptive difficulty.
 * Used by all multiplication game modes to produce believable distractors.
 */

/**
 * Generate N wrong answers that are plausible but incorrect.
 *
 * For products: nearby multiples (e.g., for 7x8=56, wrong answers might be 48, 54, 63)
 * For factors: nearby numbers within 1-10 range
 * NEVER includes the correct answer in the wrong answers.
 */
export function generateWrongAnswers(
  correctAnswer: number,
  count: number,
  type: 'product' | 'factor'
): number[] {
  const wrong = new Set<number>()

  if (type === 'product') {
    // Strategy: generate nearby multiples and off-by-one/two products
    const candidates: number[] = []

    // Nearby multiples of common table numbers
    for (let table = 1; table <= 10; table++) {
      for (let mult = 1; mult <= 10; mult++) {
        const val = table * mult
        if (val !== correctAnswer && val > 0) {
          candidates.push(val)
        }
      }
    }

    // Also add +/- 1, 2, 10 from correct answer (common kid mistakes)
    const offsets = [-10, -2, -1, 1, 2, 10]
    for (const offset of offsets) {
      const val = correctAnswer + offset
      if (val > 0 && val !== correctAnswer) {
        candidates.push(val)
      }
    }

    // Sort candidates by distance from correct answer (closer = more plausible)
    candidates.sort(
      (a, b) => Math.abs(a - correctAnswer) - Math.abs(b - correctAnswer)
    )

    // Pick from closest candidates, but shuffle a bit for variety
    // Take top 2x what we need, then randomly select from those
    const pool = candidates.slice(0, Math.max(count * 3, 12))

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }

    for (const val of pool) {
      if (wrong.size >= count) break
      if (val !== correctAnswer && !wrong.has(val)) {
        wrong.add(val)
      }
    }
  } else {
    // Factor type: pick nearby numbers within 1-10
    const candidates: number[] = []

    for (let n = 1; n <= 10; n++) {
      if (n !== correctAnswer) {
        candidates.push(n)
      }
    }

    // Sort by distance from correct answer
    candidates.sort(
      (a, b) => Math.abs(a - correctAnswer) - Math.abs(b - correctAnswer)
    )

    // Shuffle close candidates for variety
    const pool = candidates.slice(0, Math.max(count * 2, 6))
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }

    for (const val of pool) {
      if (wrong.size >= count) break
      wrong.add(val)
    }
  }

  // Fallback: if we somehow don't have enough, pad with random numbers
  while (wrong.size < count) {
    const fallback =
      type === 'product'
        ? Math.floor(Math.random() * 90) + 1
        : Math.floor(Math.random() * 10) + 1
    if (fallback !== correctAnswer && !wrong.has(fallback)) {
      wrong.add(fallback)
    }
  }

  return Array.from(wrong).slice(0, count)
}

/**
 * Determine suggested difficulty based on accuracy history.
 *
 * - 0 attempts or 0 stars: easy
 * - Some attempts with decent stars: medium
 * - Many attempts with high stars: hard
 */
export function suggestDifficulty(
  attempts: number,
  bestStars: number
): 'easy' | 'medium' | 'hard' {
  if (attempts === 0) return 'easy'
  if (bestStars >= 3) return 'hard'
  if (bestStars >= 2 || attempts >= 3) return 'medium'
  return 'easy'
}

/**
 * Shuffle an array of answer options (correct + wrong) for display.
 * Returns a new shuffled array.
 */
export function shuffleAnswers<T>(answers: T[]): T[] {
  const shuffled = [...answers]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
