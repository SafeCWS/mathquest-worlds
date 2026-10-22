// Gentle "days played" streak (research rec #7). Counts consecutive calendar days with at
// least one solved problem, ending today or yesterday. Nothing is ever taken away for a
// missed day beyond the count restarting — no hearts, no lives, no warnings.
// PROTOTYPE: localStorage only (key below); the repo version belongs in progressStore.

const KEY = 'mathquest-big-days-played'

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function read(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function markPlayedToday(now = new Date()): void {
  if (typeof window === 'undefined') return
  const days = new Set(read())
  days.add(dayKey(now))
  window.localStorage.setItem(KEY, JSON.stringify([...days].sort().slice(-400)))
}

/** Pure for tests: streak length from a set of day keys. */
export function streakFrom(days: ReadonlySet<string>, now = new Date()): number {
  const d = new Date(now)
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1) // yesterday still counts until today is played
  let n = 0
  while (days.has(dayKey(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function daysPlayedStreak(now = new Date()): number {
  return streakFrom(new Set(read()), now)
}
