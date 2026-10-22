/**
 * Security hardening (review rounds 1–3, 2026-10-22; operator decision: one
 * generic sign-in failure, no tries-left):
 *   - every sign-in failure is the single code 'invalid'
 *   - unlisted emails store NOTHING; real entries are bounded by the
 *     allowlist and never evicted, so no flood can drop a real code or reset
 *     a real email's send cap
 *   - verify does constant HMAC work on every path
 *   - per-client-IP limits keyed by the Render-appended (right-most) XFF hop,
 *     switchable with TRUSTED_IP_HEADER
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
  MAX_SENDS_PER_HOUR,
  IP_MAX_REQUESTS_PER_HOUR,
  IP_MAX_FAILED_VERIFIES,
  IP_VERIFY_WINDOW_MS,
  type RequestResult,
} from '../otpStore'
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

/** Counts HMAC computations so constant work is observable. */
class CountingStore extends OtpStore {
  hashes = 0
  protected override hash(email: string, code: string): Buffer {
    this.hashes++
    return super.hash(email, code)
  }
}

function makeStore<T extends OtpStore>(Ctor: new (o: ConstructorParameters<typeof OtpStore>[0]) => T): T {
  return new Ctor({
    now: () => clock,
    randomCode: () => {
      const n = codes.shift()
      if (n === undefined) throw new Error('test ran out of codes')
      return n
    },
  })
}

beforeEach(() => {
  clock = 1_700_000_000_000
  codes = [123456, 654321, 111111, 222222, 333333, 444444, 555555]
  store = makeStore(OtpStore)
})

const xff = (ip: string) => new Request('http://localhost/', { headers: { 'x-forwarded-for': `10.0.0.1, ${ip}` } })
const signIn = (email: string, code: string, ip: string) => {
  const r = authorizeOtp({ email, code }, xff(ip), store)
  return r.ok ? 'OK' : r.code
}
const issued = (r: RequestResult) => r.status === 'sent'

describe('one generic sign-in failure (operator decision)', () => {
  it('listed vs unlisted: identical "invalid" for 6 wrong tries + 1 more', () => {
    store.requestCode(PARENT, ALLOW, IP_A)
    store.requestCode(STRANGER, ALLOW, IP_B)
    const listed = Array.from({ length: 7 }, () => signIn(PARENT, '000000', IP_A))
    const unlisted = Array.from({ length: 7 }, () => signIn(STRANGER, '000000', IP_B))
    assert.deepEqual(listed, Array(7).fill('invalid'))
    assert.deepEqual(unlisted, listed)
  })

  it('expired, burned, none, garbage and IP-over-limit all answer "invalid"', () => {
    const real = store.requestCode(PARENT, ALLOW, IP_A) as { code: string }
    for (let i = 0; i < 5; i++) signIn(PARENT, '999999', IP_A) // burns it
    assert.equal(signIn(PARENT, real.code, IP_A), 'invalid') // burned
    clock += CODE_TTL_MS
    assert.equal(signIn(PARENT, real.code, IP_B), 'invalid') // expired
    assert.equal(signIn(PARENT, real.code, IP_B), 'invalid') // none
    assert.equal(signIn('', '', IP_B), 'invalid')
    assert.deepEqual(authorizeOtp(undefined, undefined, store), { ok: false, code: 'invalid' })
    for (let i = 0; i < IP_MAX_FAILED_VERIFIES; i++) signIn(`p${i}@example.com`, '1', IP_C)
    assert.equal(signIn(PARENT, '000000', IP_C), 'invalid') // over-limit IP
  })

  it('internally the 5-try burn still holds: the right code fails after 5 wrong', () => {
    const real = store.requestCode(PARENT, ALLOW, IP_A) as { code: string }
    for (let i = 0; i < 5; i++) store.verifyCode(PARENT, '999999', IP_A)
    assert.equal(store.verifyCode(PARENT, real.code, IP_A).ok, false)
  })

  it('a correct code signs in, once', () => {
    const real = store.requestCode(PARENT, ALLOW, IP_A) as { code: string }
    assert.equal(signIn(PARENT, real.code, IP_A), 'OK')
    assert.equal(signIn(PARENT, real.code, IP_A), 'invalid')
  })

  it('constant work: exactly one HMAC on every verify path', () => {
    const s = makeStore(CountingStore)
    const run = (email: string, code: string, ip: string | null) => {
      s.hashes = 0
      s.verifyCode(email, code, ip)
      return s.hashes
    }
    assert.equal(run(STRANGER, '000000', IP_B), 1) // no challenge
    assert.equal(run('', '', null), 1) // garbage
    s.requestCode(PARENT, ALLOW, IP_A)
    assert.equal(run(PARENT, '000000', IP_A), 1) // wrong
    for (let i = 0; i < IP_MAX_FAILED_VERIFIES; i++) s.verifyCode(`p${i}@example.com`, '1', IP_C)
    assert.equal(run(PARENT, '000000', IP_C), 1) // IP over limit
    for (let i = 0; i < 5; i++) s.verifyCode(PARENT, '999999', IP_A)
    assert.equal(run(PARENT, '000000', IP_A), 1) // burned
  })
})

describe('real entries are bounded by the allowlist, never evicted', () => {
  it('unlisted emails store nothing at all', () => {
    assert.equal(store.requestCode(STRANGER, ALLOW, IP_B).status, 'not-allowed')
    assert.deepEqual(store.size(), { challenges: 0, sendLogs: 0 })
    assert.equal(codes.length, 7) // no code minted
  })

  it('a real challenge survives 10,000 unlisted / garbage requests', () => {
    const real = store.requestCode(PARENT, ALLOW, IP_A) as { code: string }
    for (let i = 0; i < 10_000; i++) {
      const ip = i % 3 === 0 ? null : `10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`
      store.requestCode(i % 2 ? `flood${i}@example.com` : `junk-${i}`, ALLOW, ip)
    }
    assert.deepEqual(store.size(), { challenges: 1, sendLogs: 1 })
    store.assertBoundedBy(ALLOW)
    assert.equal(store.verifyCode(PARENT, real.code, IP_A).ok, true)
  })

  it('no flood can reset a real email’s 5-sends/hour cap', () => {
    for (let i = 0; i < MAX_SENDS_PER_HOUR; i++) {
      assert.equal(issued(store.requestCode(PARENT, ALLOW, `192.0.2.${i + 1}`)), true)
      clock += RESEND_COOLDOWN_MS
    }
    for (let i = 0; i < 10_000; i++) store.requestCode(`flood${i}@example.com`, ALLOW, `10.9.${(i >> 8) & 255}.${i & 255}`)
    assert.equal(store.requestCode(PARENT, ALLOW, '192.0.2.99').status, 'rate-limited')
    clock += SEND_WINDOW_MS
    assert.equal(store.requestCode(PARENT, ALLOW, '192.0.2.99').status, 'sent')
  })

  it('assertBoundedBy throws if a non-allowlisted key ever reached the maps', () => {
    store.requestCode(PARENT, ALLOW, IP_A)
    assert.doesNotThrow(() => store.assertBoundedBy(ALLOW))
    assert.throws(() => store.assertBoundedBy(new Set()), /not on the allowlist/)
  })
})

describe('per-client-IP limits', () => {
  it(`request: ${IP_MAX_REQUESTS_PER_HOUR} per IP per hour across all emails, then refused with nothing minted`, () => {
    for (let i = 0; i < IP_MAX_REQUESTS_PER_HOUR; i++) store.requestCode(`kid${i}@example.com`, ALLOW, IP_C)
    assert.equal(store.requestCode(PARENT, ALLOW, IP_C).status, 'rate-limited')
    assert.equal(store.hasChallenge(PARENT), false)
    assert.equal(codes.length, 7)
    assert.equal(store.requestCode(PARENT, ALLOW, IP_A).status, 'sent') // other client unaffected
    clock += SEND_WINDOW_MS
    assert.notEqual(store.requestCode(PARENT, ALLOW, IP_C).status, 'rate-limited')
  })

  it(`verify: after ${IP_MAX_FAILED_VERIFIES} failures the IP is refused WITHOUT burning the real code`, () => {
    const real = store.requestCode(PARENT, ALLOW, IP_A) as { code: string }
    for (let i = 0; i < IP_MAX_FAILED_VERIFIES; i++) store.verifyCode(`probe${i}@example.com`, '000000', IP_C)
    for (let i = 0; i < 8; i++) assert.equal(store.verifyCode(PARENT, '000000', IP_C).ok, false)
    assert.equal(store.verifyCode(PARENT, real.code, IP_C).ok, false) // even the right code
    for (let i = 0; i < 4; i++) store.verifyCode(PARENT, '999999', IP_A) // family still has its tries
    assert.equal(store.verifyCode(PARENT, real.code, IP_A).ok, true)
  })

  it('the verify window rolls after 10 min', () => {
    for (let i = 0; i < IP_MAX_FAILED_VERIFIES; i++) store.verifyCode(`probe${i}@example.com`, '0', IP_C)
    clock += IP_VERIFY_WINDOW_MS
    const real = store.requestCode(PARENT, ALLOW, IP_A) as { code: string }
    assert.equal(store.verifyCode(PARENT, real.code, IP_C).ok, true)
  })

  it('no usable IP: limits skipped, two IP-less clients never share state', () => {
    for (let i = 0; i < IP_MAX_REQUESTS_PER_HOUR + 5; i++) store.requestCode(`kid${i}@example.com`, ALLOW, null)
    const real = store.requestCode(PARENT, ALLOW, null) as { code: string }
    assert.equal(real.code, '123456')
    for (let i = 0; i < IP_MAX_FAILED_VERIFIES + 5; i++) store.verifyCode(`probe${i}@example.com`, '0', null)
    assert.equal(store.verifyCode(PARENT, real.code, null).ok, true)
    assert.deepEqual(store.ipSize(), { requests: 0, failures: 0 })
  })
})

describe('resolveClientIp', () => {
  const h = (o: Record<string, string>) => new Headers(o)
  it('default: the RIGHT-MOST x-forwarded-for hop only', () => {
    assert.deepEqual(resolveClientIp(h({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1, 198.51.100.7' })), {
      ip: '198.51.100.7',
      source: 'x-forwarded-for-rightmost',
    })
  })
  it('default ignores spoofed true-client-ip / cf-connecting-ip and left-most hops', () => {
    const a = resolveClientIp(h({ 'true-client-ip': '1.1.1.1', 'cf-connecting-ip': '2.2.2.2', 'x-forwarded-for': '3.3.3.3, 198.51.100.7' }))
    const b = resolveClientIp(h({ 'true-client-ip': '4.4.4.4', 'cf-connecting-ip': '5.5.5.5', 'x-forwarded-for': '6.6.6.6, 198.51.100.7' }))
    assert.equal(a.ip, '198.51.100.7')
    assert.equal(b.ip, a.ip)
    assert.deepEqual(resolveClientIp(h({ 'true-client-ip': '1.1.1.1', 'cf-connecting-ip': '2.2.2.2' })), {
      ip: null,
      source: 'none',
    })
  })
  it('a rotating spoofed true-client-ip does not dodge the request limit', () => {
    for (let i = 0; i < IP_MAX_REQUESTS_PER_HOUR; i++) {
      const ip = resolveClientIp(h({ 'true-client-ip': `192.0.2.${i}`, 'x-forwarded-for': `10.0.0.${i}, ${IP_C}` })).ip
      store.requestCode(`kid${i}@example.com`, ALLOW, ip)
    }
    const ip = resolveClientIp(h({ 'true-client-ip': '192.0.2.200', 'x-forwarded-for': `10.0.0.200, ${IP_C}` })).ip
    assert.equal(store.requestCode(PARENT, ALLOW, ip).status, 'rate-limited')
  })
  it('TRUSTED_IP_HEADER switches the source', () => {
    const hdr = h({ 'cf-connecting-ip': '2001:db8::2', 'x-forwarded-for': '198.51.100.7' })
    assert.deepEqual(resolveClientIp(hdr, 'cf-connecting-ip'), { ip: '2001:db8::2', source: 'header:cf-connecting-ip' })
    assert.deepEqual(resolveClientIp(hdr, 'CF-Connecting-IP'), { ip: '2001:db8::2', source: 'header:cf-connecting-ip' })
    assert.deepEqual(resolveClientIp(h({ 'x-forwarded-for': '198.51.100.7' }), 'cf-connecting-ip'), { ip: null, source: 'none' })
    assert.deepEqual(resolveClientIp(hdr, 'x-forwarded-for'), { ip: '198.51.100.7', source: 'x-forwarded-for-rightmost' })
    // a malformed env value is ignored (default source), never a crash
    assert.equal(resolveClientIp(hdr, 'bad header!').source, 'x-forwarded-for-rightmost')
  })
  it('missing / garbage ⇒ no IP', () => {
    const cases: Record<string, string>[] = [{}, { 'x-forwarded-for': '' }, { 'x-forwarded-for': '10.0.0.1, junk' }, { 'x-forwarded-for': 'x'.repeat(200) }]
    for (const o of cases) assert.deepEqual(resolveClientIp(h(o)), { ip: null, source: 'none' }, JSON.stringify(o))
    assert.deepEqual(resolveClientIp(undefined), { ip: null, source: 'none' })
  })
  it('clientIpFrom logs source + header NAMES present once per process, never values', () => {
    const lines: string[] = []
    const orig = console.info
    console.info = (m: string) => lines.push(String(m))
    try {
      clientIpFrom(h({ 'cf-connecting-ip': '203.0.113.77', 'x-forwarded-for': '203.0.113.78' }))
      clientIpFrom(h({ 'x-forwarded-for': '203.0.113.79' }))
    } finally {
      console.info = orig
    }
    assert.ok(lines.length <= 1, `logged ${lines.length} times`)
    for (const l of lines) {
      assert.match(l, /ip_source=\S+ headers_present=/)
      assert.doesNotMatch(l, /203\.0\.113/)
    }
  })
})
