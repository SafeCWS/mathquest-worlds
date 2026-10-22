/**
 * POST /api/otp/request core — identical body + fixed timing floor (L99, L162).
 * Synthetic emails only.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { OtpStore } from '../otpStore'
import { handleRequestCode, PUBLIC_BODY, TIMING_FLOOR_MS } from '../requestCode'

const ALLOW_JSON = JSON.stringify([{ email: 'parent@example.com' }, { email: 'grownup@example.com' }])

function req(body: string): Request {
  return new Request('http://localhost/api/otp/request', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
}

function harness(opts: { allowlistJson?: string; codes?: number[] } = {}) {
  let clock = 1_700_000_000_000
  const codes = [...(opts.codes ?? [123456, 654321])]
  const store = new OtpStore({ now: () => clock, randomCode: () => codes.shift() ?? 0 })
  const mails: Array<{ to: string; code: string; ttl: number }> = []
  const sleeps: number[] = []
  const deps = {
    store,
    allowlistJson: 'allowlistJson' in opts ? opts.allowlistJson : ALLOW_JSON,
    now: () => clock,
    sleep: async (ms: number) => {
      sleeps.push(ms)
      clock += ms
    },
    sendMail: async (to: string, code: string, ttl: number) => {
      mails.push({ to, code, ttl })
    },
  }
  return { store, mails, sleeps, deps, tick: (ms: number) => (clock += ms) }
}

async function bodyOf(r: Response): Promise<string> {
  assert.equal(r.status, 200)
  assert.equal(r.headers.get('cache-control'), 'no-store')
  return r.text()
}

const EXPECTED = JSON.stringify(PUBLIC_BODY)

describe('handleRequestCode', () => {
  it('public body is exactly the contract, no devCode', () => {
    assert.deepEqual(JSON.parse(EXPECTED), {
      ok: true,
      message: 'If that email is on the family list, a code is on its way.',
      resendAfterSec: 60,
    })
  })

  it('allowlisted: same body, one mail with the code, normalised address', async () => {
    const h = harness()
    const text = await bodyOf(await handleRequestCode(req('{"email":"  Parent@Example.COM "}'), h.deps))
    assert.equal(text, EXPECTED)
    assert.doesNotMatch(text, /123456|devCode/)
    await new Promise((r) => setImmediate(r))
    assert.deepEqual(h.mails, [{ to: 'parent@example.com', code: '123456', ttl: 10 }])
  })

  it('identical body for not-allowlisted, cooldown, hourly cap, malformed, oversized', async () => {
    const h = harness()
    const bodies: string[] = []
    bodies.push(await bodyOf(await handleRequestCode(req('{"email":"stranger@example.com"}'), h.deps)))
    bodies.push(await bodyOf(await handleRequestCode(req('{"email":"parent@example.com"}'), h.deps))) // sent
    bodies.push(await bodyOf(await handleRequestCode(req('{"email":"parent@example.com"}'), h.deps))) // cooldown
    bodies.push(await bodyOf(await handleRequestCode(req('{not json'), h.deps)))
    bodies.push(await bodyOf(await handleRequestCode(req('null'), h.deps)))
    bodies.push(await bodyOf(await handleRequestCode(req(JSON.stringify({ email: 'x'.repeat(5000) })), h.deps)))
    for (const b of bodies) assert.equal(b, EXPECTED)
    await new Promise((r) => setImmediate(r))
    assert.equal(h.mails.length, 1) // only the one real send
  })

  it('rate-limited (6th send in the hour) answers the same body and sends nothing', async () => {
    const h = harness({ codes: [1, 2, 3, 4, 5, 6] })
    for (let i = 0; i < 5; i++) {
      await handleRequestCode(req('{"email":"parent@example.com"}'), h.deps)
      h.tick(60_000)
    }
    const text = await bodyOf(await handleRequestCode(req('{"email":"parent@example.com"}'), h.deps))
    assert.equal(text, EXPECTED)
    await new Promise((r) => setImmediate(r))
    assert.equal(h.mails.length, 5)
  })

  it('malformed SIMPLE_AUTH_USERS ⇒ nobody gets a code (operator-approved lockout)', async () => {
    const h = harness({ allowlistJson: '{oops' })
    assert.equal(await bodyOf(await handleRequestCode(req('{"email":"parent@example.com"}'), h.deps)), EXPECTED)
    await new Promise((r) => setImmediate(r))
    assert.equal(h.mails.length, 0)
    assert.deepEqual(h.store.size(), { challenges: 0, sendLogs: 0 })
  })

  it('unset SIMPLE_AUTH_USERS ⇒ nobody gets a code', async () => {
    const h = harness({ allowlistJson: undefined })
    await handleRequestCode(req('{"email":"parent@example.com"}'), h.deps)
    await new Promise((r) => setImmediate(r))
    assert.equal(h.mails.length, 0)
  })

  it('every path waits out the remaining floor from request start', async () => {
    const h = harness()
    await handleRequestCode(req('{"email":"stranger@example.com"}'), h.deps)
    await handleRequestCode(req('{"email":"parent@example.com"}'), h.deps)
    assert.deepEqual(h.sleeps, [TIMING_FLOOR_MS, TIMING_FLOOR_MS])
  })

  it('the response does NOT wait for the mail (fire-and-forget)', async () => {
    const h = harness()
    let resolveMail: () => void = () => {}
    let mailStarted = false
    h.deps.sendMail = () =>
      new Promise<void>((r) => {
        mailStarted = true
        resolveMail = r
      })
    const res = await handleRequestCode(req('{"email":"parent@example.com"}'), h.deps)
    assert.equal(await bodyOf(res), EXPECTED)
    assert.equal(mailStarted, true)
    resolveMail()
  })

  it('a throwing mailer still yields the public body and no unhandled rejection', async () => {
    const h = harness()
    h.deps.sendMail = async () => {
      throw new Error('smtp down')
    }
    const origErr = console.error
    console.error = () => {}
    try {
      assert.equal(await bodyOf(await handleRequestCode(req('{"email":"parent@example.com"}'), h.deps)), EXPECTED)
      await new Promise((r) => setImmediate(r))
    } finally {
      console.error = origErr
    }
  })

  it('L162 wall-clock: allowlisted with a 900 ms mailer vs stranger differ by < 50 ms', async () => {
    const allow = JSON.stringify([{ email: 'parent@example.com' }])
    const slowMail = () => new Promise<void>((r) => setTimeout(r, 900).unref())
    const time = async (email: string) => {
      const store = new OtpStore()
      const t0 = performance.now()
      const res = await handleRequestCode(req(JSON.stringify({ email })), {
        store,
        allowlistJson: allow,
        sendMail: slowMail,
      })
      await res.text()
      return performance.now() - t0
    }
    const found = await time('parent@example.com')
    const missing = await time('stranger@example.com')
    assert.ok(found >= TIMING_FLOOR_MS - 5 && missing >= TIMING_FLOOR_MS - 5, `${found} / ${missing}`)
    assert.ok(found < TIMING_FLOOR_MS + 150, `found path waited for SMTP: ${found}ms`)
    assert.ok(Math.abs(found - missing) < 50, `delta ${Math.abs(found - missing)}ms`)
  })
})
