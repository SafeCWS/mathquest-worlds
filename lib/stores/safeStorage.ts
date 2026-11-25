// Storage that can never take the game down (red-team round 1, #2 / #3 / #5).
//
// - getItem: a read error (Safari "Block All Cookies" throws on ANY localStorage access) or a
//   corrupt JSON value returns null — zustand then hydrates from defaults instead of hanging.
// - setItem / removeItem: quota-full and blocked-storage errors are swallowed.
// - When localStorage is unreadable, values live in an in-memory map for the life of the tab,
//   so gems and progress still count during the session.
// - Server (no window): returns undefined, exactly like zustand's default — no hydration on
//   the server, and the in-memory map is never shared between requests.
import type { PersistStorage, StorageValue } from 'zustand/middleware'

const memory = new Map<string, string>()

function local(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : (window.localStorage ?? null)
  } catch {
    return null
  }
}

/** Raw string read: localStorage when readable, otherwise the in-memory copy. Never throws. */
export function safeGetItem(name: string): string | null {
  try {
    const ls = local()
    const v = ls ? ls.getItem(name) : null
    if (v !== null) return v
  } catch {
    // blocked / denied — fall through to memory
  }
  return memory.get(name) ?? null
}

/** Raw string write. Always kept in memory; a failed localStorage write is swallowed. */
export function safeSetItem(name: string, value: string): void {
  memory.set(name, value)
  try {
    local()?.setItem(name, value)
  } catch {
    // quota full / blocked — the in-memory copy carries the session
  }
}

export function safeRemoveItem(name: string): void {
  memory.delete(name)
  try {
    local()?.removeItem(name)
  } catch {
    // ignore
  }
}

/** Parsed persist envelope, or null for missing / corrupt / non-object values. Never throws. */
export function readPersisted<S>(name: string): StorageValue<S> | null {
  const raw = safeGetItem(name)
  if (raw === null) return null
  try {
    const v: unknown = JSON.parse(raw)
    return v !== null && typeof v === 'object' ? (v as StorageValue<S>) : null
  } catch {
    return null
  }
}

/** zustand `persist` storage built on the helpers above. */
export function safeJSONStorage<S>(): PersistStorage<S> | undefined {
  if (typeof window === 'undefined') return undefined
  return {
    getItem: (name) => readPersisted<S>(name),
    setItem: (name, value) => {
      let json: string
      try {
        json = JSON.stringify(value)
      } catch {
        return
      }
      safeSetItem(name, json)
    },
    removeItem: (name) => safeRemoveItem(name),
  }
}

/** Calls `onChange` when ANOTHER tab writes `name` (or clears storage). Client only. */
export function onOtherTabWrite(name: string, onChange: () => void): void {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
  window.addEventListener('storage', (e: Event) => {
    const key = (e as StorageEvent).key
    if (key === name || key === null) onChange()
  })
}
