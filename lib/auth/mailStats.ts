/**
 * OTP mail proof-of-life (L104). In-process: whether the last delivery
 * worked and how many failed in the last 24 h. Exposed on /api/health as a
 * boolean and a count — never an address, never a code.
 *
 * Pinned on globalThis: Next bundles each route separately, so plain module
 * state would give /api/otp/request and /api/health different copies.
 * Pure (no node imports) so the health route stays light.
 */
export type DeliveryOutcome = 'sent-465' | 'sent-587' | 'skipped-no-password' | 'failed'

const WINDOW_MS = 24 * 60 * 60 * 1000
const MAX_STORED = 10_000

export class MailStats {
  private lastOk: boolean | null = null
  private failures: number[] = []
  constructor(private readonly now: () => number = Date.now) {}

  record(outcome: DeliveryOutcome): void {
    const ok = outcome === 'sent-465' || outcome === 'sent-587'
    this.lastOk = ok
    if (!ok) {
      this.failures.push(this.now())
      if (this.failures.length > MAX_STORED) this.failures.splice(0, this.failures.length - MAX_STORED)
    }
  }

  snapshot(): { lastOk: boolean | null; failures24h: number } {
    const t = this.now()
    this.failures = this.failures.filter((f) => t - f < WINDOW_MS)
    return { lastOk: this.lastOk, failures24h: this.failures.length }
  }
}

const KEY = Symbol.for('mathquest.otpMailStats')

export function getMailStats(): MailStats {
  const g = globalThis as typeof globalThis & { [KEY]?: MailStats }
  if (!g[KEY]) g[KEY] = new MailStats()
  return g[KEY]
}
