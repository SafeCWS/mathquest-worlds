/**
 * Security-review hardening (2026-10-22):
 *   1. decoy challenges — listed and unlisted emails are indistinguishable
 *      through every verify / request outcome
 *   2. per-client-IP limits on request and on failed verifies, without an
 *      over-limit IP burning the real code
 * Synthetic emails and documentation-range IPs only.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  OtpStore,
  parseAllowlist,
  resolveClientIp,
  clientIpFrom,
  CODE_TTL_MS,
  RESEND_COOLDOWN_MS,
  SEND_WINDOW_MS,
  MAX_CHALLENGE_ENTRIES,
  MAX_SEND_LOG_ENTRIES,
  IP_MAX_REQUESTS_PER_HOUR,
  IP_MAX_FAILED_VERIFIES,
  IP_VERIFY_WINDOW_MS,
  type RequestResult,
  type VerifyResult,
} from '../otpStore'
import { signInErrorCode } from '../signInErrors'
import { authorizeOtp } from '../authorize'

const PARENT = 'parent@example.com'
const STRANGER = 'stranger@example.com'
const ALLOW = parseAllowlist(JSON.stringify([{ email: PARENT }]))
const IP_A = '192.0.2.10'
const IP_B = '198.51.100.20'
const IP_C = '203.0.113.30'

let clock = 0
let codes: number[] = []
let store: OtpStore

beforeEach(() => {
  clock = 1_700_000_000_000
  codes = [123456, 654321, 111111, 222222, 333333, 444444, 555555]
  store = new OtpStore({
    now: () => clock,
    randomCode: () => {
      const n = codes.shift()
      if (n === undefined) throw new Error('test ran out of codes')
      return n
    },
  })
})

const outward = (r: VerifyResult) => (r.ok ? 'OK' : signInErrorCode(r))
/** What the outside world can observe about a request: issued or not, and the retry hint. */
const reqShape = (r: RequestResult) =>
  r.status === 'sent' || r.status === 'decoy'
    ? 'issued'
    : r.status === 'not-allowed'
      ? 'not-allowed'
      : `${r.status}:${r.retryInSec}`

describe('decoy challenges (finding 1: enumeration via sign-in codes)', () => {
  it('6 wrong tries + 1 more: identical code sequence for listed and unlisted', () => {
    store.requestCode(PARENT, ALLOW, IP_A)
    store.requestCode(STRANGER, ALLOW, IP_B)
    const seq = (email: string, ip: string) =>
      Array.from({ length: 7 }, () => outward(store.verifyCode(email, '000000', ip)))
    const listed = seq(PARENT, IP_A)
    const unlisted = seq(STRANGER, IP_B)
    assert.deepEqual(listed, ['wrong_4', 'wrong_3', 'wrong_2', 'wrong_1', 'burned', 'burned', 'burned'])
    assert.deepEqual(unlisted, listed)
  })

  it('expiry is identical: expired at 10:00, then none', () => {
    store.requestCode(PARENT, ALLOW, IP_A)
    store.requestCode(STRANGER, ALLOW, IP_B)
    clock += CODE_TTL_MS
    assert.equal(outward(store.verifyCode(PARENT, '000000', IP_A)), 'expired')
    assert.equal(outward(store.verifyCode(STRANGER, '000000', IP_B)), 'expired')
    assert.equal(outward(store.verifyCode(PARENT, '000000', IP_A)), 'none')
    assert.equal(outward(store.verifyCode(STRANGER, '000000', IP_B)), 'none')
  })

  it('cooldown and hourly cap answer identically for listed and unlisted', () => {
    const run = (email: string, ip: string) => {
      const start = clock
      const out: string[] = []
      out.push(reqShape(store.requestCode(email, ALLOW, ip)))
      clock = start + 15_000
      out.push(reqShape(store.requestCode(email, ALLOW, ip)))
      for (let i = 1; i <= 5; i++) {
        clock = start + i * RESEND_COOLDOWN_MS
        out.push(reqShape(store.requestCode(email, ALLOW, ip)))
      }
      clock = start + SEND_WINDOW_MS
      out.push(reqShape(store.requestCode(email, ALLOW, ip)))
      clock = start
      return out
    }
    const listed = run(PARENT, IP_A)
    const unlisted = run(STRANGER, IP_B)
    assert.deepEqual(listed, [
      'issued',
      'cooldown:45',
      'issued',
      'issued',
      'issued',
      'issued',
      'rate-limited:3300',
      'issued',
    ])
    assert.deepEqual(unlisted, listed)
  })

  it('a decoy never verifies and never consumes the real code source', () => {
    const r = store.requestCode(STRANGER, ALLOW, IP_B)
    assert.equal(r.status, 'decoy')
    assert.equal('code' in r, false)
    assert.equal(codes.length, 7) // randomCode untouched
    // the next real code would be 123456: it must not open the decoy
    for (const guess of ['123456', '000000', '654321', '999999']) {
      assert.equal(store.verifyCode(STRANGER, guess, IP_B).ok, false)
    }
  })

  it('malformed emails store nothing (no decoy for junk)', () => {
    for (const bad of ['', '   ', 'no-at-sign', 'a'.repeat(300) + '@example.com', null]) {
      assert.equal(store.requestCode(bad, ALLOW, IP_A).status, 'not-allowed')
    }
    assert.deepEqual(store.size(), { challenges: 0, sendLogs: 0 })
  })

  it(`map cap: ${MAX_CHALLENGE_ENTRIES} challenges, oldest evicted first whatever its kind`, () => {
    const spray = (i: number) =>
      store.requestCode(`spray${i}@example.com`, ALLOW, `10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`)
    for (let i = 0; i < MAX_CHALLENGE_ENTRIES + 200; i++) spray(i)
    const s = store.size()
    assert.equal(s.challenges, MAX_CHALLENGE_ENTRIES)
    assert.ok(s.sendLogs <= MAX_SEND_LOG_ENTRIES)
    // purely by age: the first 200 are gone, the next 500 remain
    assert.equal(store.hasChallenge('spray199@example.com'), false)
    assert.equal(store.hasChallenge('spray200@example.com'), true)
    assert.equal(store.hasChallenge(`spray${MAX_CHALLENGE_ENTRIES + 199}@example.com`), true)
  })

  it('eviction is blind to listed vs unlisted: both answer none once evicted, in age order', () => {
    store.requestCode(PARENT, ALLOW, IP_A) // oldest
    store.requestCode(STRANGER, ALLOW, IP_B) // second oldest
    for (let i = 0; i < MAX_CHALLENGE_ENTRIES - 2; i++) {
      store.requestCode(`fill${i}@example.com`, ALLOW, `10.1.${(i >> 8) & 255}.${i & 255}`)
    }
    assert.equal(store.size().challenges, MAX_CHALLENGE_ENTRIES) // at the cap, nothing evicted yet
    assert.equal(store.hasChallenge(PARENT), true)
    store.requestCode('next1@example.com', ALLOW, '10.2.0.1')
    assert.equal(store.hasChallenge(PARENT), false) // the listed one went first: it was oldest
    assert.equal(store.hasChallenge(STRANGER), true)
    store.requestCode('next2@example.com', ALLOW, '10.2.0.2')
    assert.equal(store.hasChallenge(STRANGER), false)
    assert.equal(outward(store.verifyCode(PARENT, '000000', IP_A)), 'none')
    assert.equal(outward(store.verifyCode(STRANGER, '000000', IP_B)), 'none')
  })

  it('a re-request moves an email to the young end of the LRU', () => {
    store.requestCode(PARENT, ALLOW, IP_A)
    store.requestCode(STRANGER, ALLOW, IP_B)
    clock += RESEND_COOLDOWN_MS
    store.requestCode(PARENT, ALLOW, IP_A) // PARENT is now younger than STRANGER
    for (let i = 0; i < MAX_CHALLENGE_ENTRIES - 1; i++) {
      store.requestCode(`fill${i}@example.com`, ALLOW, `10.1.${(i >> 8) & 255}.${i & 255}`)
    }
    assert.equal(store.hasChallenge(STRANGER), false)
    assert.equal(store.hasChallenge(PARENT), true)
  })

  it('the sweep clears expired decoys', () => {
    store.requestCode(STRANGER, ALLOW, IP_B)
    assert.equal(store.hasChallenge(STRANGER), true)
    clock += CODE_TTL_MS
    store.sweepExpired()
    assert.equal(store.hasChallenge(STRANGER), false)
    clock += SEND_WINDOW_MS
    store.sweepExpired()
    assert.deepEqual(store.size(), { challenges: 0, sendLogs: 0 })
  })
})

describe('per-client-IP limits (finding 2: lockout DoS)', () => {
  it(`request: ${IP_MAX_REQUESTS_PER_HOUR} per IP per hour across all emails, then rate-limited with nothing stored`, () => {
    for (let i = 0; i < IP_MAX_REQUESTS_PER_HOUR; i++) {
      assert.equal(reqShape(store.requestCode(`kid${i}@example.com`, ALLOW, IP_C)), 'issued', `#${i + 1}`)
    }
    const before = store.size()
    const r = store.requestCode(PARENT, ALLOW, IP_C)
    assert.equal(r.status, 'rate-limited')
    assert.deepEqual(store.size(), before)
    assert.equal(store.hasChallenge(PARENT), false)
    assert.equal(codes.length, 7) // no real code minted for the over-limit IP
    // another client is unaffected
    assert.equal(store.requestCode(PARENT, ALLOW, IP_A).status, 'sent')
    // and the limited IP recovers after the rolling hour
    clock += SEND_WINDOW_MS
    assert.equal(reqShape(store.requestCode('later@example.com', ALLOW, IP_C)), 'issued')
  })

  it(`verify: after ${IP_MAX_FAILED_VERIFIES} failures in 10 min the IP is refused WITHOUT burning the real code`, () => {
    const real = store.requestCode(PARENT, ALLOW, IP_A)
    const code = (real as { code: string }).code
    // attacker spends its budget on other addresses (decoys + no-request emails)
    for (let i = 0; i < IP_MAX_FAILED_VERIFIES; i++) {
      assert.equal(store.verifyCode(`probe${i}@example.com`, '000000', IP_C).ok, false)
    }
    // now it goes for the family email: every attempt answers "burned" and
    // the family's 5 tries are untouched — even the CORRECT code is refused
    for (let i = 0; i < 8; i++) {
      assert.equal(outward(store.verifyCode(PARENT, '000000', IP_C)), 'burned')
    }
    assert.equal(outward(store.verifyCode(PARENT, code, IP_C)), 'burned')
    // the family, from its own IP, still has 5 tries: 4 wrong + right works
    for (let i = 4; i >= 1; i--) {
      assert.equal(outward(store.verifyCode(PARENT, '999999', IP_A)), `wrong_${i}`)
    }
    assert.equal(store.verifyCode(PARENT, code, IP_A).ok, true)
  })

  it('the verify window rolls: an over-limit IP is allowed again after 10 min', () => {
    for (let i = 0; i < IP_MAX_FAILED_VERIFIES; i++) store.verifyCode(`probe${i}@example.com`, '0', IP_C)
    assert.equal(outward(store.verifyCode(PARENT, '000000', IP_C)), 'burned')
    clock += IP_VERIFY_WINDOW_MS
    store.requestCode(PARENT, ALLOW, IP_A)
    assert.equal(outward(store.verifyCode(PARENT, '000000', IP_C)), 'wrong_4')
  })

  it('successful verifies do not count against the IP', () => {
    for (let i = 0; i < IP_MAX_FAILED_VERIFIES + 3; i++) {
      clock += SEND_WINDOW_MS // fresh send window each round
      const r = store.requestCode(PARENT, ALLOW, IP_A)
      codes.push(100000 + i)
      assert.equal(store.verifyCode(PARENT, (r as { code: string }).code, IP_A).ok, true, `round ${i}`)
    }
  })

  it('the per-email rules still hold from many IPs: 5 wrong tries burn', () => {
    store.requestCode(PARENT, ALLOW, IP_A)
    const ips = ['192.0.2.1', '192.0.2.2', '192.0.2.3', '192.0.2.4', '192.0.2.5']
    const out = ips.map((ip) => outward(store.verifyCode(PARENT, '000000', ip)))
    assert.deepEqual(out, ['wrong_4', 'wrong_3', 'wrong_2', 'wrong_1', 'burned'])
  })
})

describe('resolveClientIp (trusted sources only)', () => {
  const h = (o: Record<string, string>) => new Headers(o)
  it('prefers true-client-ip, then cf-connecting-ip, then the RIGHT-MOST x-forwarded-for hop', () => {
    assert.deepEqual(
      resolveClientIp(h({ 'true-client-ip': '203.0.113.1', 'cf-connecting-ip': '203.0.113.2', 'x-forwarded-for': '203.0.113.3' })),
      { ip: '203.0.113.1', source: 'true-client-ip' },
    )
    assert.deepEqual(resolveClientIp(h({ 'cf-connecting-ip': '2001:db8::2', 'x-forwarded-for': '203.0.113.3' })), {
      ip: '2001:db8::2',
      source: 'cf-connecting-ip',
    })
    assert.deepEqual(resolveClientIp(h({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1, 198.51.100.7' })), {
      ip: '198.51.100.7',
      source: 'x-forwarded-for-rightmost',
    })
  })
  it('a spoofed left-most x-forwarded-for hop does not change the key', () => {
    const a = resolveClientIp(h({ 'x-forwarded-for': '1.2.3.4, 198.51.100.7' }))
    const b = resolveClientIp(h({ 'x-forwarded-for': '9.9.9.9, 8.8.8.8, 198.51.100.7' }))
    assert.equal(a.ip, '198.51.100.7')
    assert.equal(b.ip, a.ip)
  })
  it('an invalid trusted header falls through to the next source', () => {
    assert.deepEqual(resolveClientIp(h({ 'true-client-ip': 'evil', 'cf-connecting-ip': '203.0.113.2' })), {
      ip: '203.0.113.2',
      source: 'cf-connecting-ip',
    })
  })
  it('missing / garbage everywhere ⇒ no IP (never a shared bucket)', () => {
    const cases: Record<string, string>[] = [{}, { 'x-forwarded-for': '' }, { 'x-forwarded-for': '10.0.0.1, junk' }, { 'true-client-ip': '<script>' }, { 'x-forwarded-for': 'x'.repeat(200) }]
    for (const o of cases) {
      assert.deepEqual(resolveClientIp(h(o)), { ip: null, source: 'none' }, JSON.stringify(o))
    }
    assert.deepEqual(resolveClientIp(undefined), { ip: null, source: 'none' })
  })
  it('clientIpFrom logs the source once per process, never the IP value', () => {
    const lines: string[] = []
    const orig = console.info
    console.info = (m: string) => lines.push(String(m))
    try {
      clientIpFrom(h({ 'cf-connecting-ip': '203.0.113.77' }))
      clientIpFrom(h({ 'cf-connecting-ip': '203.0.113.78' }))
    } finally {
      console.info = orig
    }
    assert.ok(lines.length <= 1, `logged ${lines.length} times`)
    for (const l of lines) {
      assert.match(l, /ip_source=/)
      assert.doesNotMatch(l, /203\.0\.113/)
    }
  })
})

describe('no usable client IP ⇒ per-IP limits skipped, per-email rules intact', () => {
  it('requests are not IP-limited, but the per-email cooldown still applies', () => {
    for (let i = 0; i < IP_MAX_REQUESTS_PER_HOUR + 10; i++) {
      assert.equal(reqShape(store.requestCode(`kid${i}@example.com`, ALLOW, null)), 'issued')
    }
    assert.equal(reqShape(store.requestCode('kid0@example.com', ALLOW, null)).startsWith('cooldown'), true)
    assert.deepEqual(store.ipSize(), { requests: 0, failures: 0 })
  })
  it('two IP-less clients never share state: one failing a lot does not block the other', () => {
    const real = store.requestCode(PARENT, ALLOW, null)
    for (let i = 0; i < IP_MAX_FAILED_VERIFIES + 5; i++) store.verifyCode(`probe${i}@example.com`, '000000', null)
    assert.equal(store.verifyCode(PARENT, (real as { code: string }).code, null).ok, true)
    assert.deepEqual(store.ipSize(), { requests: 0, failures: 0 })
  })
  it('the per-email 5-try burn still holds without an IP', () => {
    store.requestCode(PARENT, ALLOW, null)
    const out = Array.from({ length: 5 }, () => outward(store.verifyCode(PARENT, '000000', null)))
    assert.deepEqual(out, ['wrong_4', 'wrong_3', 'wrong_2', 'wrong_1', 'burned'])
  })
})

describe('authorizeOtp (what auth.ts authorize calls)', () => {
  const reqFrom = (ip: string) => new Request('http://localhost/api/auth/callback/credentials', { headers: { 'x-forwarded-for': ip } })

  it('passes the client IP from the request headers into verifyCode', () => {
    const real = store.requestCode(PARENT, ALLOW, IP_A)
    for (let i = 0; i < IP_MAX_FAILED_VERIFIES; i++) {
      authorizeOtp({ email: `probe${i}@example.com`, code: '000000' }, reqFrom(IP_C), store)
    }
    // the over-limit IP is refused; the same code from another IP signs in
    assert.deepEqual(authorizeOtp({ email: PARENT, code: (real as { code: string }).code }, reqFrom(IP_C), store), {
      ok: false,
      code: 'burned',
    })
    assert.deepEqual(authorizeOtp({ email: PARENT, code: (real as { code: string }).code }, reqFrom(IP_A), store), {
      ok: true,
      user: { id: PARENT, email: PARENT },
    })
  })

  it('maps failures to the contract codes and tolerates a missing request', () => {
    store.requestCode(STRANGER, ALLOW, IP_B)
    assert.deepEqual(authorizeOtp({ email: STRANGER, code: '1' }, reqFrom(IP_B), store), { ok: false, code: 'wrong_4' })
    assert.deepEqual(authorizeOtp(undefined, undefined, store), { ok: false, code: 'none' })
  })
})
