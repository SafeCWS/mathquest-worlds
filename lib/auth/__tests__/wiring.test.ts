/**
 * Wiring checks that unit tests of the pieces cannot see:
 *   - sign-in error codes match the login-page contract
 *   - middleware matcher: OTP route + PWA assets public, app routes protected (L156)
 *   - Edge safety: middleware's import graph never reaches node:crypto / nodemailer
 *   - password path + legacy env fallback are gone, no verify route exists
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { signInErrorCode, SIGN_IN_ERROR_CODES } from '../signInErrors'

const ROOT = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

describe('sign-in failure contract (operator decision: one generic message)', () => {
  it('the only failure code is "invalid", for every internal reason', () => {
    assert.deepEqual([...SIGN_IN_ERROR_CODES], ['invalid'])
    for (const r of [
      { ok: false, reason: 'wrong', triesLeft: 4 },
      { ok: false, reason: 'wrong', triesLeft: 1 },
      { ok: false, reason: 'burned', triesLeft: 0 },
      { ok: false, reason: 'burned' },
      { ok: false, reason: 'expired' },
      { ok: false, reason: 'none' },
    ] as const) {
      assert.equal(signInErrorCode(r), 'invalid')
    }
  })
})

describe('middleware matcher (L156)', () => {
  const src = read('middleware.ts')
  const m = src.match(/matcher:\s*\[\s*'([^']+)'/)
  assert.ok(m, 'matcher string not found')
  const re = new RegExp('^' + m[1].replace(/\\\\/g, '\\') + '$')
  const isProtected = (p: string) => re.test(p)

  it('logged-out routes are public', () => {
    for (const p of [
      '/api/otp/request',
      '/api/auth/callback/credentials',
      '/api/auth/csrf',
      '/api/health',
      '/login',
      '/manifest.webmanifest',
      '/icons/icon-192.png',
      '/_next/static/chunks/x.js',
      '/favicon.ico',
    ]) {
      assert.equal(isProtected(p), false, p)
    }
  })

  it('app routes stay protected, including look-alikes of the OTP prefix', () => {
    for (const p of ['/', '/worlds/1', '/progress', '/parent', '/multiplication/big', '/api/otpadmin', '/api/otp']) {
      assert.equal(isProtected(p), true, p)
    }
  })
})

describe('Edge safety of the middleware graph', () => {
  it('middleware.ts never imports @/auth and only uses the provider-less config', () => {
    const src = read('middleware.ts')
    assert.doesNotMatch(src, /from ['"]@\/auth['"]/)
    assert.match(src, /from ['"]@\/lib\/auth\/config['"]/)
  })
  it('lib/auth/config.ts imports nothing but next-auth types', () => {
    const imports = [...read('lib/auth/config.ts').matchAll(/^import .* from ['"]([^'"]+)['"]/gm)].map((x) => x[1])
    assert.deepEqual(imports, ['next-auth'])
    assert.match(read('lib/auth/config.ts'), /^import type /m)
  })
})

describe('removed paths stay removed', () => {
  it('auth.ts has no password path and no SIMPLE_AUTH_EMAIL/PASSWORD fallback', () => {
    const src = read('auth.ts')
    assert.doesNotMatch(src, /SIMPLE_AUTH_EMAIL|SIMPLE_AUTH_PASSWORD/)
    assert.doesNotMatch(src, /password\s*:|type:\s*['"]password['"]|credentials\??\.password/i)
    // the request is forwarded so the per-IP verify limit sees the client
    assert.match(src, /async authorize\(credentials, request\)/)
    assert.match(src, /authorizeOtp\(credentials, request\)/)
  })
  it('there is no standalone verify route and no devCode anywhere server-side', () => {
    assert.equal(existsSync(join(ROOT, 'app/api/otp/verify')), false)
    for (const f of ['app/api/otp/request/route.ts', 'lib/auth/requestCode.ts', 'lib/auth/otpStore.ts']) {
      assert.doesNotMatch(read(f), /devCode/, f)
    }
  })
})
