// Single source of truth for ALL multiplication facts.
// Every game mode reads from this — no mode computes its own products.

export interface MultiplicationFact {
  a: number       // first factor (table number)
  b: number       // second factor (1-10)
  product: number
  table: number   // which table this belongs to
}

// Generate via actual multiplication — guarantees accuracy
function generateTable(n: number): MultiplicationFact[] {
  return Array.from({ length: 10 }, (_, i) => ({
    a: n,
    b: i + 1,
    product: n * (i + 1),
    table: n,
  }))
}

export const MULTIPLICATION_TABLES: Record<number, MultiplicationFact[]> = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [i + 1, generateTable(i + 1)])
) as Record<number, MultiplicationFact[]>

export const ALL_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
export type TableNumber = (typeof ALL_TABLES)[number]

/**
 * Get N random facts from a specific table.
 * Returns a shuffled subset — never duplicates within a single call.
 */
export function getRandomFacts(table: number, count: number): MultiplicationFact[] {
  const facts = MULTIPLICATION_TABLES[table]
  if (!facts) return []

  // Fisher-Yates shuffle on a copy
  const shuffled = [...facts]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/**
 * Get a specific multiplication fact by its two factors.
 */
export function getFact(a: number, b: number): MultiplicationFact {
  return {
    a,
    b,
    product: a * b,
    table: a,
  }
}
