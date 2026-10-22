// Minimal in-memory localStorage so zustand persist runs under node:test.
// Imported BEFORE the store so persist sees it at create() time.
// `window` is an EventTarget so tests can dispatch cross-tab `storage` events.
export const mem = new Map<string, string>()
export const storage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => { mem.set(k, String(v)) },
  removeItem: (k: string) => { mem.delete(k) },
  clear: () => mem.clear(),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() { return mem.size },
}
// zustand persist's default storage is createJSONStorage(() => window.localStorage).
const g = globalThis as { window?: unknown; localStorage?: unknown }
g.localStorage = storage
g.window ??= Object.assign(new EventTarget(), { localStorage: storage })

/** Simulate another tab writing `key` (browsers fire `storage` only in the OTHER tabs). */
export function storageEvent(key: string | null): void {
  const e = new Event('storage') as Event & { key: string | null }
  Object.defineProperty(e, 'key', { value: key })
  ;(g.window as EventTarget).dispatchEvent(e)
}
