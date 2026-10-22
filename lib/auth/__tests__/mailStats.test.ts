/**
 * OTP mail proof-of-life (L104): lastOk + failures in the last 24 h, exposed
 * on /api/health as a boolean and a count — never an address.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MailStats, getMailStats } from '../mailStats'
import { sendOtpMail } from '../mailer'
import { GET } from '../../../app/api/health/route'

let clock = 0
let stats: MailStats
beforeEach(() => {
  clock = 1_700_000_000_000
  stats = new MailStats(() => clock)
})

describe('MailStats', () => {
  it('starts with no send attempted', () => {
    assert.deepEqual(stats.snapshot(), { lastOk: null, failures24h: 0 })
  })
  it('records success and failures; failures roll off after 24 h', () => {
    stats.record('failed')
    stats.record('skipped-no-password')
    assert.deepEqual(stats.snapshot(), { lastOk: false, failures24h: 2 })
    stats.record('sent-587')
    assert.deepEqual(stats.snapshot(), { lastOk: true, failures24h: 2 })
    clock += 24 * 60 * 60 * 1000
    assert.deepEqual(stats.snapshot(), { lastOk: true, failures24h: 0 })
  })
  it('caps stored failure timestamps', () => {
    for (let i = 0; i < 20_000; i++) stats.record('failed')
    assert.ok(stats.snapshot().failures24h <= 10_000)
  })
})

describe('wiring', () => {
  it('every delivery outcome reaches the process-wide stats', async () => {
    const before = getMailStats().snapshot().failures24h
    await sendOtpMail('parent@example.com', '123456', 10, { pass: '', log: { warn() {}, error() {} } })
    assert.equal(getMailStats().snapshot().failures24h, before + 1)
    assert.equal(getMailStats().snapshot().lastOk, false)
    await sendOtpMail('parent@example.com', '123456', 10, { pass: 'synthetic', send: async () => {}, log: { warn() {}, error() {} } })
    assert.equal(getMailStats().snapshot().lastOk, true)
  })

  it('/api/health exposes otpMail {lastOk, failures24h} and no address', async () => {
    const body = (await (await GET()).json()) as Record<string, unknown>
    assert.equal(body.status, 'ok')
    const m = body.otpMail as { lastOk: unknown; failures24h: unknown }
    assert.ok(m && typeof m === 'object')
    assert.ok(m.lastOk === null || typeof m.lastOk === 'boolean')
    assert.equal(typeof m.failures24h, 'number')
    assert.doesNotMatch(JSON.stringify(body), /@/)
  })

  it('render.yaml declares GMAIL_APP_PASSWORD with sync: false and no value', () => {
    const y = readFileSync(join(__dirname, '..', '..', '..', 'render.yaml'), 'utf8')
    assert.match(y, /- key: GMAIL_APP_PASSWORD\n\s+sync: false\n/)
    assert.doesNotMatch(y, /key: GMAIL_APP_PASSWORD\n\s+value:/)
  })
})
