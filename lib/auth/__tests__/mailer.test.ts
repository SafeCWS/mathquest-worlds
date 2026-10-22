/**
 * mailer — L92 fallback order, skip-when-unset, no code/address in logs.
 * The SMTP transport is injected; a REAL send is a separate, manual G3 check.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildOtpMail, maskEmail, sendOtpMail, SMTP_USER } from '../mailer'

const TO = 'parent@example.com'
const FAKE_PASS = 'synthetic-test-pass'

function recorder() {
  const lines: string[] = []
  return { lines, log: { warn: (m: string) => lines.push(m), error: (m: string) => lines.push(m) } }
}

describe('maskEmail', () => {
  it('keeps first letter + domain only', () => {
    assert.equal(maskEmail('tina@example.com'), 't***@example.com')
    assert.equal(maskEmail('noat'), '***')
    assert.equal(maskEmail('@example.com'), '***')
  })
})

describe('buildOtpMail', () => {
  it('subject starts with the code phrase for iOS autofill; English body', () => {
    const m = buildOtpMail('042137', 10)
    assert.equal(m.subject, 'Your MathQuest code: 042137')
    assert.match(m.text, /042137/)
    assert.match(m.text, /10 minutes/)
    assert.match(m.html, /042137/)
  })
  it('refuses a non-6-digit code', () => {
    assert.throws(() => buildOtpMail('<b>x</b>', 10), RangeError)
  })
})

describe('sendOtpMail', () => {
  it('sender is the airecruiter@ constant', () => {
    assert.equal(SMTP_USER, 'airecruiter@customworkforcesolutionsllc.com')
  })

  it('tries 465 (implicit TLS) first and stops on success', async () => {
    const calls: Array<{ port: number; secure: boolean }> = []
    const out = await sendOtpMail(TO, '123456', 10, {
      pass: FAKE_PASS,
      send: async ({ port, secure }) => {
        calls.push({ port, secure })
      },
      log: recorder().log,
    })
    assert.equal(out, 'sent-465')
    assert.deepEqual(calls, [{ port: 465, secure: true }])
  })

  it('falls back to 587 STARTTLS when 465 fails (L92)', async () => {
    const calls: number[] = []
    const r = recorder()
    const out = await sendOtpMail(TO, '123456', 10, {
      pass: FAKE_PASS,
      send: async ({ port }) => {
        calls.push(port)
        if (port === 465) throw Object.assign(new Error('timeout 123456 parent@example.com'), { code: 'ETIMEDOUT' })
      },
      log: r.log,
    })
    assert.equal(out, 'sent-587')
    assert.deepEqual(calls, [465, 587])
    assert.match(r.lines.join('\n'), /ETIMEDOUT/)
  })

  it('both ports fail ⇒ "failed", resolves (never rejects)', async () => {
    const r = recorder()
    const out = await sendOtpMail(TO, '123456', 10, {
      pass: FAKE_PASS,
      send: async () => {
        throw new Error(`auth failed for ${TO} with ${FAKE_PASS} code 123456`)
      },
      log: r.log,
    })
    assert.equal(out, 'failed')
    assert.equal(r.lines.length, 2)
  })

  it('logs never contain the code, the full address or the password', async () => {
    const r = recorder()
    await sendOtpMail(TO, '123456', 10, {
      pass: FAKE_PASS,
      send: async () => {
        throw new Error(`auth failed for ${TO} with ${FAKE_PASS} code 123456`)
      },
      log: r.log,
    })
    const all = r.lines.join('\n')
    assert.doesNotMatch(all, /123456/)
    assert.doesNotMatch(all, /parent@example\.com/)
    assert.doesNotMatch(all, new RegExp(FAKE_PASS))
    assert.match(all, /p\*\*\*@example\.com/)
  })

  it('no password ⇒ warns and skips, does not throw, does not call SMTP', async () => {
    const r = recorder()
    let called = false
    const out = await sendOtpMail(TO, '123456', 10, {
      pass: '',
      send: async () => {
        called = true
      },
      log: r.log,
    })
    assert.equal(out, 'skipped-no-password')
    assert.equal(called, false)
    assert.equal(r.lines.length, 1)
    assert.doesNotMatch(r.lines[0], /123456/)
  })
})
