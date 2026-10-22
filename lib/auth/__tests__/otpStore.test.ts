/**
 * otpStore unit tests — node:test, run with:
 *   npm run test:unit
 *
 * Clock and code source are injected, so every timing rule (10-min expiry,
 * 60 s cooldown, rolling hour) is tested at its exact boundary.
 * Synthetic emails only.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  OtpStore,
  parseAllowlist,
  CODE_TTL_MS,
  RESEND_COOLDOWN_MS,
  SEND_WINDOW_MS,
  resolveTestCodeSource,
} from '../otpStore'

const PARENT = 'parent@example.com'
const ALLOW = parseAllowlist(
  JSON.stringify([
    { email: PARENT, password: 'ignored' },
    { email: 'grownup@example.com', password: 'ignored' },
  ]),
)

let clock = 0
let nextCodes: number[] = []
let store: OtpStore

function make(): OtpStore {
  return new OtpStore({
    now: () => clock,
    randomCode: () => {
      const n = nextCodes.shift()
      if (n === undefined) throw new Error('test ran out of codes')
      return n
    },
  })
}

function sent(email = PARENT): string {
  const r = store.requestCode(email, ALLOW)
  assert.equal(r.status, 'sent')
  return (r as { code: string }).code
}

beforeEach(() => {
  clock = 1_700_000_000_000
  nextCodes = [123456, 654321, 111111, 222222, 333333, 444444, 555555]
  store = make()
})

describe('requestCode + verifyCode', () => {
  it('happy path: send, verify, sign in', () => {
    const code = sent()
    assert.equal(code, '123456')
    assert.deepEqual(store.verifyCode(PARENT, code), { ok: true, email: PARENT })
  })

  it('zero-pads small codes to 6 digits', () => {
    nextCodes = [42]
    assert.equal(sent(), '000042')
    assert.equal(store.verifyCode(PARENT, '000042').ok, true)
  })

  it('uses the real crypto.randomInt source by default', () => {
    const real = new OtpStore()
    const r = real.requestCode(PARENT, ALLOW)
    assert.equal(r.status, 'sent')
    assert.match((r as { code: string }).code, /^\d{6}$/)
  })

  it('wrong code x5 burns it; tries count down', () => {
    sent()
    for (let i = 1; i <= 4; i++) {
      assert.deepEqual(store.verifyCode(PARENT, '000000'), {
        ok: false,
        reason: 'wrong',
        triesLeft: 5 - i,
      })
    }
    assert.deepEqual(store.verifyCode(PARENT, '000000'), {
      ok: false,
      reason: 'burned',
      triesLeft: 0,
    })
  })

  it('6th try with the CORRECT code still fails once burned', () => {
    const code = sent()
    for (let i = 0; i < 5; i++) store.verifyCode(PARENT, '999999')
    assert.deepEqual(store.verifyCode(PARENT, code), { ok: false, reason: 'burned' })
  })

  it('4 wrong tries then the correct code still works', () => {
    const code = sent()
    for (let i = 0; i < 4; i++) store.verifyCode(PARENT, '999999')
    assert.equal(store.verifyCode(PARENT, code).ok, true)
  })

  it('non-digit / wrong-length input counts as a wrong try', () => {
    sent()
    assert.equal((store.verifyCode(PARENT, 'abc') as { reason: string }).reason, 'wrong')
    assert.equal((store.verifyCode(PARENT, '1234567') as { triesLeft: number }).triesLeft, 3)
  })

  it('accepts a code pasted with a space or dash', () => {
    sent()
    assert.equal(store.verifyCode(PARENT, '123 456').ok, true)
  })

  it('valid at 9:59.999, expired at exactly 10:00', () => {
    const code = sent()
    const start = clock
    clock = start + CODE_TTL_MS - 1
    // check without consuming: a wrong try proves it is still live
    assert.equal((store.verifyCode(PARENT, '000000') as { reason: string }).reason, 'wrong')
    clock = start + CODE_TTL_MS
    assert.deepEqual(store.verifyCode(PARENT, code), { ok: false, reason: 'expired' })
    // expired challenge is cleared
    assert.deepEqual(store.verifyCode(PARENT, code), { ok: false, reason: 'none' })
  })

  it('correct code just before expiry succeeds', () => {
    const code = sent()
    clock += CODE_TTL_MS - 1
    assert.equal(store.verifyCode(PARENT, code).ok, true)
  })

  it('single use: the same code fails the second time', () => {
    const code = sent()
    assert.equal(store.verifyCode(PARENT, code).ok, true)
    assert.deepEqual(store.verifyCode(PARENT, code), { ok: false, reason: 'none' })
    assert.equal(store.hasChallenge(PARENT), false)
  })

  it('verify with no request returns none', () => {
    assert.deepEqual(store.verifyCode(PARENT, '123456'), { ok: false, reason: 'none' })
    assert.deepEqual(store.verifyCode('', '123456'), { ok: false, reason: 'none' })
  })

  it('60 s resend cooldown with retryInSec', () => {
    sent()
    clock += 15_000
    assert.deepEqual(store.requestCode(PARENT, ALLOW), { status: 'cooldown', retryInSec: 45 })
    clock += RESEND_COOLDOWN_MS - 15_000 - 1
    assert.deepEqual(store.requestCode(PARENT, ALLOW), { status: 'cooldown', retryInSec: 1 })
    clock += 1
    assert.equal(store.requestCode(PARENT, ALLOW).status, 'sent')
  })

  it('hourly cap: 5 sends per rolling hour, 6th is rate-limited until the oldest ages out', () => {
    const first = clock
    for (let i = 0; i < 5; i++) {
      assert.equal(store.requestCode(PARENT, ALLOW).status, 'sent', `send #${i + 1}`)
      clock += RESEND_COOLDOWN_MS
    }
    const r = store.requestCode(PARENT, ALLOW)
    assert.equal(r.status, 'rate-limited')
    assert.equal((r as { retryInSec: number }).retryInSec, (first + SEND_WINDOW_MS - clock) / 1000)
    clock = first + SEND_WINDOW_MS - 1
    assert.equal(store.requestCode(PARENT, ALLOW).status, 'rate-limited')
    clock = first + SEND_WINDOW_MS
    assert.equal(store.requestCode(PARENT, ALLOW).status, 'sent')
  })

  it('successful sign-in does NOT reset the hourly cap', () => {
    for (let i = 0; i < 5; i++) {
      const code = sent()
      assert.equal(store.verifyCode(PARENT, code).ok, true)
      clock += RESEND_COOLDOWN_MS
    }
    assert.equal(store.requestCode(PARENT, ALLOW).status, 'rate-limited')
  })

  it('caps are per email: one family member does not block the other', () => {
    for (let i = 0; i < 5; i++) {
      sent()
      clock += RESEND_COOLDOWN_MS
    }
    assert.equal(store.requestCode(PARENT, ALLOW).status, 'rate-limited')
    assert.equal(store.requestCode('grownup@example.com', ALLOW).status, 'sent')
  })

  it('non-allowlisted email: a decoy, never a real code (see hardening.test.ts)', () => {
    assert.equal(store.requestCode('stranger@example.com', ALLOW).status, 'decoy')
    assert.deepEqual(store.size(), { challenges: 1, sendLogs: 1 })
    assert.deepEqual(store.verifyCode('stranger@example.com', '123456'), {
      ok: false,
      reason: 'wrong',
      triesLeft: 4,
    })
    // the random code source was never consumed
    assert.equal(nextCodes.length, 7)
  })

  it('empty / oversized email is not-allowed', () => {
    assert.equal(store.requestCode('', ALLOW).status, 'not-allowed')
    assert.equal(store.requestCode(null, ALLOW).status, 'not-allowed')
    assert.equal(store.requestCode('a'.repeat(300) + '@example.com', ALLOW).status, 'not-allowed')
  })

  it('email is case-insensitive and trimmed on request and verify', () => {
    const code = sent('  Parent@EXAMPLE.com ')
    assert.equal(store.verifyCode('PARENT@example.COM', code).ok, true)
    // and the cooldown is shared across spellings
    clock += RESEND_COOLDOWN_MS
    sent(PARENT)
    assert.equal(store.requestCode('PARENT@EXAMPLE.COM', ALLOW).status, 'cooldown')
  })

  it('a new request replaces the prior code and resets tries', () => {
    const old = sent()
    for (let i = 0; i < 3; i++) store.verifyCode(PARENT, '999999')
    clock += RESEND_COOLDOWN_MS
    const fresh = sent()
    assert.notEqual(fresh, old)
    assert.equal((store.verifyCode(PARENT, old) as { triesLeft: number }).triesLeft, 4)
    assert.equal(store.verifyCode(PARENT, fresh).ok, true)
  })

  it('a new request after a burn gives a working code', () => {
    sent()
    for (let i = 0; i < 5; i++) store.verifyCode(PARENT, '999999')
    clock += RESEND_COOLDOWN_MS
    const fresh = sent()
    assert.equal(store.verifyCode(PARENT, fresh).ok, true)
  })

  it('a code issued to one email does not work for another', () => {
    const code = sent(PARENT)
    assert.deepEqual(store.verifyCode('grownup@example.com', code), { ok: false, reason: 'none' })
  })

  it('rejects an out-of-range random source', () => {
    nextCodes = [1_000_000]
    assert.throws(() => store.requestCode(PARENT, ALLOW), RangeError)
  })
})

describe('parseAllowlist', () => {
  it('reads the auth.ts shape, ignores password, normalises email', () => {
    const s = parseAllowlist('[{"email":" Parent@Example.com ","password":"x"},{"email":"grownup@example.com"}]')
    assert.deepEqual([...s].sort(), ['grownup@example.com', 'parent@example.com'])
  })

  it('malformed JSON yields an empty set, never throws', () => {
    for (const bad of ['{not json', '[{"email":', 'null', '42', '"parent@example.com"', '{"email":"a@b.c"}', '', '   ']) {
      assert.equal(parseAllowlist(bad).size, 0, `input: ${bad}`)
    }
    assert.equal(parseAllowlist(undefined).size, 0)
    assert.equal(parseAllowlist(null).size, 0)
  })

  it('skips junk entries but keeps good ones', () => {
    const s = parseAllowlist('[null, 7, "x", {"email": 5}, {"email": ""}, {"email":"no-at-sign"}, {"email":"parent@example.com"}]')
    assert.deepEqual([...s], ['parent@example.com'])
  })
})

describe('sweepExpired (L99)', () => {
  it('removes expired challenges, keeps live ones', () => {
    sent(PARENT)
    clock += 5 * 60 * 1000
    sent('grownup@example.com')
    clock += 5 * 60 * 1000 // PARENT now exactly at 10:00, grownup at 5:00
    store.sweepExpired()
    assert.equal(store.hasChallenge(PARENT), false)
    assert.equal(store.hasChallenge('grownup@example.com'), true)
  })

  it('keeps a burned-but-unexpired code so it still answers burned', () => {
    sent()
    for (let i = 0; i < 5; i++) store.verifyCode(PARENT, '999999')
    store.sweepExpired()
    assert.equal((store.verifyCode(PARENT, '123456') as { reason: string }).reason, 'burned')
  })

  it('drops send logs once every send is older than the rolling hour', () => {
    sent()
    assert.equal(store.verifyCode(PARENT, '123456').ok, true)
    clock += SEND_WINDOW_MS - 1
    store.sweepExpired()
    assert.deepEqual(store.size(), { challenges: 0, sendLogs: 1 })
    clock += 1
    assert.equal(store.sweepExpired(), 1) // the send log (no client IP given, so no IP window)
    assert.deepEqual(store.size(), { challenges: 0, sendLogs: 0 })
  })

  it('empty store sweeps to zero', () => {
    assert.equal(store.sweepExpired(), 0)
  })
})

describe('resolveTestCodeSource (Playwright hook guard)', () => {
  it('returns the fixed code under NODE_ENV=development (next dev / Playwright)', () => {
    const src = resolveTestCodeSource({ NODE_ENV: 'development', OTP_TEST_CODE: '000042' })
    assert.ok(src)
    assert.equal(src(), 42)
  })

  it('returns the fixed code only under NODE_ENV=test with 6 digits', () => {
    const src = resolveTestCodeSource({ NODE_ENV: 'test', OTP_TEST_CODE: '246810' })
    assert.ok(src)
    assert.equal(src(), 246810)
    const s = new OtpStore({ randomCode: src, now: () => clock })
    const r = s.requestCode(PARENT, ALLOW)
    assert.equal((r as { code: string }).code, '246810')
  })

  it('is unreachable in production and with unset / unexpected NODE_ENV', () => {
    for (const NODE_ENV of ['production', undefined, '', 'TEST', 'test ', 'Production', 'dev', 'staging']) {
      assert.equal(resolveTestCodeSource({ NODE_ENV, OTP_TEST_CODE: '246810' }), undefined, `NODE_ENV=${NODE_ENV}`)
    }
  })

  it('rejects a malformed OTP_TEST_CODE even under test', () => {
    for (const OTP_TEST_CODE of [undefined, '', '12345', '1234567', 'abcdef', '12 456']) {
      assert.equal(resolveTestCodeSource({ NODE_ENV: 'test', OTP_TEST_CODE }), undefined)
    }
  })
})
