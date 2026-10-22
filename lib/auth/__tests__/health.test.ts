/**
 * /api/health must not be an enumeration oracle (review MEDIUM): nothing in
 * it may move when a code is sent, so "request a code for X, watch health"
 * reveals nothing. It carries only the static mailConfigured boolean.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { GET } from '../../../app/api/health/route'
import { handleRequestCode } from '../requestCode'
import { OtpStore } from '../otpStore'
import { sendOtpMail } from '../mailer'

const body = async () => {
  const b = (await (await GET()).json()) as Record<string, unknown>
  delete b.timestamp
  return b
}
const quiet = { info() {}, warn() {}, error() {} }

describe('/api/health', () => {
  it('is identical before and after a real send to a listed email (and a failed one)', async () => {
    const before = await body()
    const res = await handleRequestCode(
      new Request('http://localhost/api/otp/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"email":"parent@example.com"}',
      }),
      {
        store: new OtpStore(),
        allowlistJson: '[{"email":"parent@example.com"}]',
        sleep: async () => {},
        sendMail: (to, code, ttl) => sendOtpMail(to, code, ttl, { pass: 'synthetic', send: async () => {}, log: quiet }),
      },
    )
    await res.text()
    await new Promise((r) => setTimeout(r, 10))
    await sendOtpMail('parent@example.com', '123456', 10, {
      pass: 'synthetic',
      send: async () => {
        throw new Error('down')
      },
      log: quiet,
    })
    assert.deepEqual(await body(), before)
  })

  it('exposes mailConfigured as a static boolean and no address', async () => {
    const b = await body()
    assert.equal(typeof b.mailConfigured, 'boolean')
    assert.equal('otpMail' in b, false)
    assert.doesNotMatch(JSON.stringify(b), /@/)
  })

  it('render.yaml declares GMAIL_APP_PASSWORD with sync: false and no value', () => {
    const y = readFileSync(join(__dirname, '..', '..', '..', 'render.yaml'), 'utf8')
    assert.match(y, /- key: GMAIL_APP_PASSWORD\n\s+sync: false\n/)
    assert.doesNotMatch(y, /key: GMAIL_APP_PASSWORD\n\s+value:/)
  })
})
