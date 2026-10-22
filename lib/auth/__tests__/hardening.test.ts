/**
 * Security hardening (review rounds 1–3, 2026-10-22; operator decision: one
 * generic sign-in failure, no tries-left):
 *   - every sign-in failure is the single code 'invalid'
 *   - unlisted emails store NOTHING; real entries are bounded by the
 *     allowlist and never evicted, so no flood can drop a real code or reset
 *     a real email's send cap
 *   - verify does constant HMAC work on every path
 *   - per-client-IP limits keyed by cf-connecting-ip (service sits in
 *     Render's Cloudflare zone), switchable with TRUSTED_IP_HEADER
 * Synthetic emails and documentation-range IPs only.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  OtpStore,
  parseAllowlist,
  resolveClientIp,
  clientIpFrom,
  describeIpHeaders,
  CODE_TTL_MS,
  RESEND_COOLDOWN_MS,
  SEND_WINDOW_MS,
  MAX_SENDS_PER_HOUR,
  IP_MAX_REQUESTS_PER_HOUR,
  IP_MAX_FAILED_VERIFIES,
  IP_VERIFY_WINDOW_MS,
  MAX_DAILY_FAILURES,
  DAILY_FAILURE_WINDOW_MS,
  LOCK_LADDER_MS,
  LADDER_RESET_MS,
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

const xff = (ip: string) =>
  new Request('http://localhost/', { headers: { 'cf-connecting-ip': ip, 'x-forwarded-for': `10.0.0.1, ${ip}` } })
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

describe('resolveClientIp (behind Render’s Cloudflare zone)', () => {
  const h = (o: Record<string, string>) => new Headers(o)
  it('default: cf-connecting-ip (Cloudflare overwrites it)', () => {
    assert.deepEqual(resolveClientIp(h({ 'cf-connecting-ip': '2001:db8::2', 'x-forwarded-for': '1.1.1.1, 172.70.0.1' })), {
      ip: '2001:db8::2',
      source: 'cf-connecting-ip',
    })
  })
  it('default never reads true-client-ip or x-forwarded-for (shared edge IP)', () => {
    assert.deepEqual(resolveClientIp(h({ 'true-client-ip': '1.1.1.1', 'x-forwarded-for': '3.3.3.3, 172.70.0.1' })), {
      ip: null,
      source: 'none',
    })
    const a = resolveClientIp(h({ 'true-client-ip': '4.4.4.4', 'cf-connecting-ip': '198.51.100.7' }))
    const b = resolveClientIp(h({ 'true-client-ip': '5.5.5.5', 'cf-connecting-ip': '198.51.100.7' }))
    assert.equal(a.ip, '198.51.100.7')
    assert.equal(b.ip, a.ip)
  })
  it('a rotating spoofed true-client-ip / x-forwarded-for does not dodge the request limit', () => {
    for (let i = 0; i < IP_MAX_REQUESTS_PER_HOUR; i++) {
      const ip = resolveClientIp(h({ 'true-client-ip': `192.0.2.${i}`, 'x-forwarded-for': `10.0.0.${i}`, 'cf-connecting-ip': IP_C })).ip
      store.requestCode(`kid${i}@example.com`, ALLOW, ip)
    }
    const ip = resolveClientIp(h({ 'true-client-ip': '192.0.2.200', 'x-forwarded-for': '10.0.0.200', 'cf-connecting-ip': IP_C })).ip
    assert.equal(store.requestCode(PARENT, ALLOW, ip).status, 'rate-limited')
  })
  it('TRUSTED_IP_HEADER accepts only cf-connecting-ip or x-forwarded-for-rightmost', () => {
    const hdr = h({ 'cf-connecting-ip': '2001:db8::2', 'true-client-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.9, 198.51.100.7' })
    assert.deepEqual(resolveClientIp(hdr, 'x-forwarded-for-rightmost'), { ip: '198.51.100.7', source: 'x-forwarded-for-rightmost' })
    assert.deepEqual(resolveClientIp(hdr, 'CF-Connecting-IP'), { ip: '2001:db8::2', source: 'cf-connecting-ip' })
    // anything else (incl. true-client-ip) is ignored → the cf-connecting-ip default
    for (const bad of ['true-client-ip', 'x-forwarded-for', 'x-real-ip', 'bad header!', '']) {
      assert.deepEqual(resolveClientIp(hdr, bad), { ip: '2001:db8::2', source: 'cf-connecting-ip' }, bad)
    }
  })
  it('missing / garbage ⇒ no IP', () => {
    const cases: Record<string, string>[] = [{}, { 'cf-connecting-ip': '' }, { 'cf-connecting-ip': 'junk' }, { 'cf-connecting-ip': '1.1.1.1, 2.2.2.2' }, { 'cf-connecting-ip': 'x'.repeat(200) }]
    for (const o of cases) assert.deepEqual(resolveClientIp(h(o)), { ip: null, source: 'none' }, JSON.stringify(o))
    assert.deepEqual(resolveClientIp(undefined), { ip: null, source: 'none' })
  })
  it('clientIpFrom logs source + header names + the xff/cf equality boolean once, never values', () => {
    const lines: string[] = []
    const orig = console.info
    console.info = (m: string) => lines.push(String(m))
    try {
      clientIpFrom(h({ 'cf-connecting-ip': '203.0.113.77', 'x-forwarded-for': '203.0.113.77' }))
      clientIpFrom(h({ 'cf-connecting-ip': '203.0.113.79' }))
    } finally {
      console.info = orig
    }
    assert.ok(lines.length <= 1, `logged ${lines.length} times`)
    for (const l of lines) {
      assert.match(l, /ip_source=\S+ headers_present=\S+ xff_rightmost_equals_cf_connecting_ip=(true|false)/)
      assert.doesNotMatch(l, /203\.0\.113/)
    }
  })
  it('describeIpHeaders reports names and the equality boolean only', () => {
    assert.equal(
      describeIpHeaders(h({ 'cf-connecting-ip': '203.0.113.5', 'x-forwarded-for': '10.0.0.1, 203.0.113.5' })),
      'headers_present=cf-connecting-ip,x-forwarded-for xff_rightmost_equals_cf_connecting_ip=true',
    )
    assert.equal(
      describeIpHeaders(h({ 'cf-connecting-ip': '203.0.113.5', 'x-forwarded-for': '172.70.0.1' })),
      'headers_present=cf-connecting-ip,x-forwarded-for xff_rightmost_equals_cf_connecting_ip=false',
    )
    assert.equal(describeIpHeaders(h({})), 'headers_present=(none) xff_rightmost_equals_cf_connecting_ip=false')
  })
})

describe('per-email failure lock (review SHOULD-4; escalating per operator)', () => {
  const locks: Array<{ email: string; until: number }> = []
  let lockStore: OtpStore
  beforeEach(() => {
    locks.length = 0
    lockStore = new OtpStore({
      now: () => clock,
      randomCode: () => 100000 + Math.floor(Math.random() * 899999),
      onLock: (email, until) => locks.push({ email, until }),
    })
  })
  /** n failed verifies on PARENT spread over fresh codes and many IPs (no IP limit trips). */
  const fail = (n: number, st: OtpStore = lockStore) => {
    let done = 0
    let round = 0
    while (done < n) {
      clock += SEND_WINDOW_MS / 5 + 1 // stay under 5 sends/hour and past cooldown
      st.requestCode(PARENT, ALLOW, `192.0.2.${round % 250}`)
      for (let i = 0; i < 5 && done < n; i++, done++) {
        st.verifyCode(PARENT, '000000', `10.${round}.${i}.1`)
      }
      round++
    }
  }

  it(`${MAX_DAILY_FAILURES} failures in 24 h lock the email (first lock: 1 h); the right code then fails; ONE notice`, () => {
    fail(MAX_DAILY_FAILURES)
    assert.equal(locks.length, 1)
    assert.equal(locks[0].email, PARENT)
    assert.equal(locks[0].until, clock + LOCK_LADDER_MS[0])
    const r = lockStore.requestCode(PARENT, ALLOW, '198.51.100.1')
    assert.equal(r.status, 'locked') // no code minted while locked
    assert.equal(lockStore.verifyCode(PARENT, '000000', '198.51.100.2').ok, false)
    fail(10) // more attempts while locked: still exactly one notice
    assert.equal(locks.length, 1)
  })

  it(`${MAX_DAILY_FAILURES - 1} failures do not lock`, () => {
    fail(MAX_DAILY_FAILURES - 1)
    assert.equal(locks.length, 0)
    clock += SEND_WINDOW_MS // fail() used this hour's 5 sends; the 29 failures stay inside 24 h
    const r = lockStore.requestCode(PARENT, ALLOW, '198.51.100.1') as { status: string; code?: string }
    assert.equal(r.status, 'sent')
    assert.equal(lockStore.verifyCode(PARENT, r.code, '198.51.100.1').ok, true)
  })

  it('failures older than 24 h roll off', () => {
    fail(MAX_DAILY_FAILURES - 1)
    clock += DAILY_FAILURE_WINDOW_MS
    fail(MAX_DAILY_FAILURES - 1)
    assert.equal(locks.length, 0)
  })

  it('the first lock lifts after 1 h and sign-in works again', () => {
    fail(MAX_DAILY_FAILURES)
    clock += LOCK_LADDER_MS[0]
    const r = lockStore.requestCode(PARENT, ALLOW, '198.51.100.1') as { code: string }
    assert.equal(lockStore.verifyCode(PARENT, r.code, '198.51.100.1').ok, true)
  })

  it('signs in as "invalid" while locked, with exactly one HMAC per verify', () => {
    fail(MAX_DAILY_FAILURES)
    store = lockStore
    assert.equal(signIn(PARENT, '123456', IP_A), 'invalid')
    const counting = makeStore(CountingStore)
    codes = Array.from({ length: 20 }, (_, i) => 200000 + i)
    fail(MAX_DAILY_FAILURES, counting)
    counting.hashes = 0
    assert.equal(counting.verifyCode(PARENT, '000000', '198.51.100.3').ok, false)
    assert.equal(counting.hashes, 1)
  })

  it('unlisted emails never enter the failure / lock maps', () => {
    for (let i = 0; i < 200; i++) lockStore.verifyCode(STRANGER, '000000', `10.0.${i}.1`)
    lockStore.assertBoundedBy(ALLOW)
    assert.deepEqual(lockStore.lockSize(), { dailyFailures: 0, lockouts: 0, ladder: 0 })
    fail(MAX_DAILY_FAILURES)
    lockStore.assertBoundedBy(ALLOW)
    assert.deepEqual(lockStore.lockSize(), { dailyFailures: 0, lockouts: 1, ladder: 1 }) // count resets at each lock
  })

  it('IP-refused attempts do not count toward the email lock', () => {
    lockStore.requestCode(PARENT, ALLOW, IP_A)
    for (let i = 0; i < IP_MAX_FAILED_VERIFIES; i++) lockStore.verifyCode(`probe${i}@example.com`, '0', IP_C)
    for (let i = 0; i < 100; i++) lockStore.verifyCode(PARENT, '000000', IP_C) // all refused by IP
    assert.equal(locks.length, 0)
    assert.equal(lockStore.lockSize().dailyFailures, 0)
  })

  it('the sweep clears expired locks and stale failure windows', () => {
    fail(MAX_DAILY_FAILURES)
    clock += LOCK_LADDER_MS[0] + LADDER_RESET_MS
    lockStore.sweepExpired()
    assert.deepEqual(lockStore.lockSize(), { dailyFailures: 0, lockouts: 0, ladder: 0 })
  })
})

describe('lock cannot be amplified past real guesses (review: lockout amplification)', () => {
  let notices = 0
  let st: OtpStore
  beforeEach(() => {
    notices = 0
    st = new OtpStore({ now: () => clock, onLock: () => notices++ })
  })

  it('(a) burn a code, then 100 more guesses: daily count stays 5, not locked', () => {
    st.requestCode(PARENT, ALLOW, IP_A)
    for (let i = 0; i < 105; i++) st.verifyCode(PARENT, '000000', `10.7.${i}.1`) // distinct IPs: no IP limit
    assert.equal(st.dailyFailureCount(PARENT), 5)
    assert.equal(notices, 0)
    assert.equal(st.requestCode(PARENT, ALLOW, IP_A).status === 'locked', false)
  })

  it('expired and no-challenge guesses never count', () => {
    st.requestCode(PARENT, ALLOW, IP_A)
    clock += CODE_TTL_MS
    for (let i = 0; i < 50; i++) st.verifyCode(PARENT, '000000', `10.8.${i}.1`) // expired, then none
    assert.equal(st.dailyFailureCount(PARENT), 0)
  })

  it('(b) 6 codes × 5 wrong guesses, within the send caps, lock the email', () => {
    const start = clock
    for (let round = 0; round < 6; round++) {
      // cooldown 60 s + 5 sends/hour: one code every 12 min + 1 ms
      clock = start + round * (SEND_WINDOW_MS / 5 + 1)
      assert.equal(st.requestCode(PARENT, ALLOW, `192.0.2.${round + 1}`).status, 'sent', `round ${round}`)
      for (let i = 0; i < 5; i++) st.verifyCode(PARENT, '000000', `10.9.${round}.${i}`)
    }
    assert.equal(notices, 1)
    assert.ok(clock - start > SEND_WINDOW_MS, 'reaching the lock took more than an hour')
    assert.equal(st.requestCode(PARENT, ALLOW, IP_A).status, 'locked')
  })
})

describe('escalating lock ladder: 1 h, 4 h, then 24 h (operator decision)', () => {
  const H = 60 * 60 * 1000
  let locks: Array<{ at: number; until: number }> = []
  let st: OtpStore
  let ipSeq = 0
  beforeEach(() => {
    locks = []
    ipSeq = 0
    st = new OtpStore({ now: () => clock, onLock: (_e, until) => locks.push({ at: clock, until }) })
  })
  /** 30 live wrong guesses: 6 codes, one every 12 min + 1 ms (cooldown + 5 sends/hour). */
  const thirty = () => {
    for (let round = 0; round < 6; round++) {
      clock += SEND_WINDOW_MS / 5 + 1
      assert.equal(st.requestCode(PARENT, ALLOW, `192.0.2.${(ipSeq++ % 250) + 1}`).status, 'sent')
      for (let i = 0; i < 5; i++) st.verifyCode(PARENT, '000000', `10.${ipSeq % 250}.${round}.${i}`)
    }
  }
  const locked = () => st.requestCode(PARENT, ALLOW, `198.51.100.${(ipSeq++ % 250) + 1}`).status === 'locked'

  it('first lock lasts exactly 1 h', () => {
    thirty()
    assert.equal(locks.length, 1)
    const { at, until } = locks[0]
    assert.equal(until - at, H)
    clock = until - 1
    assert.equal(locked(), true)
    clock = until
    assert.equal(locked(), false)
  })

  it('second lock within 24 h lasts 4 h, third 24 h, fourth 24 h; one notice each, until = lock end', () => {
    for (let n = 0; n < 4; n++) {
      thirty()
      assert.equal(locks.length, n + 1, `lock #${n + 1}`)
      clock = locks[n].until // wait the lock out, then the attacker resumes
    }
    assert.deepEqual(
      locks.map((l) => l.until - l.at),
      [H, 4 * H, 24 * H, 24 * H],
    )
  })

  it('the ladder resets after a quiet 24 h (measured from the last lock end)', () => {
    thirty()
    clock = locks[0].until
    thirty()
    assert.equal(locks[1].until - locks[1].at, 4 * H)
    clock = locks[1].until + LADDER_RESET_MS // 24 h with no lock in force or triggered
    thirty()
    assert.equal(locks[2].until - locks[2].at, H) // back to step 1
  })

  it('a lock just under 24 h after the last one ended still escalates', () => {
    thirty()
    clock = locks[0].until + LADDER_RESET_MS - 2 * H // thirty() then spends ~72 min
    thirty()
    assert.equal(locks[1].until - locks[1].at, 4 * H)
  })

  it('a mistyping user (≤ 29 live failures a day, then the right code) is never locked', () => {
    for (let day = 0; day < 5; day++) {
      let failures = 0
      for (let round = 0; round < 10 && failures < MAX_DAILY_FAILURES - 1; round++) {
        clock += SEND_WINDOW_MS / 5 + 1
        const r = st.requestCode(PARENT, ALLOW, '192.0.2.200') as { status: string; code?: string }
        assert.equal(r.status, 'sent', `day ${day} round ${round}`)
        const wrong = Math.min(4, MAX_DAILY_FAILURES - 1 - failures)
        for (let i = 0; i < wrong; i++, failures++) st.verifyCode(PARENT, '000000', '192.0.2.200')
        assert.equal(st.verifyCode(PARENT, r.code, '192.0.2.200').ok, true)
      }
      assert.equal(failures, MAX_DAILY_FAILURES - 1)
      clock += DAILY_FAILURE_WINDOW_MS
    }
    assert.equal(locks.length, 0)
  })

  it('ladder state is keyed by allowlisted emails only and swept after the reset window', () => {
    for (let i = 0; i < 300; i++) st.verifyCode(STRANGER, '000000', `10.200.${i & 255}.1`)
    thirty()
    st.assertBoundedBy(ALLOW)
    assert.equal(st.lockSize().ladder, 1)
    clock = locks[0].until + LADDER_RESET_MS
    st.sweepExpired()
    assert.equal(st.lockSize().ladder, 0)
  })
})
