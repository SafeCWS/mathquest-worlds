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
  clientIpFrom,
  CODE_TTL_MS,
  RESEND_COOLDOWN_MS,
  SEND_WINDOW_MS,
  MAX_CHALLENGE_ENTRIES,
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

  it(`map cap: ${MAX_CHALLENGE_ENTRIES} entries, oldest decoys evicted first, real code survives`, () => {
    const real = store.requestCode(PARENT, ALLOW, IP_A)
    assert.equal(real.status, 'sent')
    for (let i = 0; i < MAX_CHALLENGE_ENTRIES + 200; i++) {
      // a different client IP each time so the IP limit is not what stops it
      store.requestCode(`spray${i}@example.com`, ALLOW, `10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`)
    }
    const s = store.size()
    assert.ok(s.challenges <= MAX_CHALLENGE_ENTRIES, `challenges ${s.challenges}`)
    assert.ok(s.sendLogs <= MAX_CHALLENGE_ENTRIES, `sendLogs ${s.sendLogs}`)
    assert.equal(store.hasChallenge('spray0@example.com'), false) // oldest decoy evicted
    assert.equal(store.hasChallenge(`spray${MAX_CHALLENGE_ENTRIES + 199}@example.com`), true)
    assert.equal(store.verifyCode(PARENT, (real as { code: string }).code, IP_A).ok, true)
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

describe('clientIpFrom', () => {
  const h = (xff?: string) => new Headers(xff === undefined ? {} : { 'x-forwarded-for': xff })
  it('takes the first hop of x-forwarded-for, trimmed', () => {
    assert.equal(clientIpFrom(h('203.0.113.7, 10.0.0.1, 10.0.0.2')), '203.0.113.7')
    assert.equal(clientIpFrom(h('  2001:db8::1 ')), '2001:db8::1')
  })
  it("falls back to 'unknown' when missing, empty or junk", () => {
    assert.equal(clientIpFrom(h()), 'unknown')
    assert.equal(clientIpFrom(h('')), 'unknown')
    assert.equal(clientIpFrom(h(' , 10.0.0.1')), 'unknown')
    assert.equal(clientIpFrom(h('x'.repeat(200))), 'unknown')
    assert.equal(clientIpFrom(h('<script>')), 'unknown')
    assert.equal(clientIpFrom(undefined), 'unknown')
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
