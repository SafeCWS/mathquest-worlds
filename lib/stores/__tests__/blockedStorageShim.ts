// Safari "Block All Cookies": every localStorage access throws SecurityError — including at
// module load, before any store is created. Import BEFORE any store / sound module.
const deny = (): never => { throw new DOMException('The operation is insecure.', 'SecurityError') }
const w = new EventTarget()
Object.defineProperty(w, 'localStorage', { get: deny, configurable: true })
Object.defineProperty(globalThis, 'localStorage', { get: deny, configurable: true })
;(globalThis as { window?: unknown }).window = w
