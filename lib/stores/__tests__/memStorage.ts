// Minimal in-memory localStorage so zustand persist runs under node:test.
// Imported BEFORE the store so persist sees it at create() time.
export const mem = new Map<string, string>()
const storage = {
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
g.window ??= { localStorage: storage }
