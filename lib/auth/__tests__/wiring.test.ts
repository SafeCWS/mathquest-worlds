/**
 * Wiring checks that unit tests of the pieces cannot see:
 *   - sign-in error codes match the login-page contract
 *   - middleware matcher: OTP route + PWA assets public, app routes protected (L156)
 *   - Edge safety: middleware's import graph never reaches node:crypto / nodemailer
 *   - password path + legacy env fallback are gone, no verify route exists
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
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

describe('middleware matcher (L156 + review HIGH: no extension bypass)', () => {
  const src = read('middleware.ts')
  const m = src.match(/matcher:\s*\[\s*'([^']+)'/)
  assert.ok(m, 'matcher string not found')
  const re = new RegExp('^' + m[1].replace(/\\\\/g, '\\') + '$')
  const isProtected = (p: string) => re.test(p)

  it('logged-out routes and static roots are public', () => {
    for (const p of [
      '/api/otp/request',
      '/api/auth/callback/credentials',
      '/api/auth/csrf',
      '/api/health',
      '/login',
      '/manifest.webmanifest',
      '/icons/icon-192.png',
      '/icons/apple-touch-icon.png',
      '/_next/static/chunks/x.js',
      '/_next/static/media/font.woff2',
      '/_next/image',
      '/favicon.ico',
      '/robots.txt',
    ]) {
      assert.equal(isProtected(p), false, p)
    }
  })

  it('app routes stay protected, including file-extension look-alikes on dynamic routes', () => {
    for (const p of [
      '/',
      '/worlds/1',
      '/worlds/ocean.json',
      '/multiplication/7.js',
      '/multiplication/big',
      '/progress',
      '/progress.txt',
      '/parent',
      '/parent.css',
      '/worlds/ocean/1/quiz.png',
      '/api/otpadmin',
      '/api/otp',
      '/api/healthz',
      '/api/health.json',
      '/loginx',
      '/manifest.webmanifest.js',
      '/favicon.ico.js',
      '/next.svg',
      '/icons',
    ]) {
      assert.equal(isProtected(p), true, p)
    }
  })
})

describe('server-side session guard in every protected route segment (defence in depth)', () => {
  const PUBLIC_SEGMENTS = new Set(['login', 'api'])
  const segments = readdirSync(join(ROOT, 'app'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && !PUBLIC_SEGMENTS.has(d.name) && !d.name.startsWith('(') && !d.name.startsWith('_'))
    .map((d) => d.name)

  it('there are protected segments to check', () => {
    assert.ok(segments.length >= 6, segments.join(','))
  })

  for (const seg of segments) {
    it(`app/${seg}/layout.tsx calls requireSession()`, () => {
      const f = `app/${seg}/layout.tsx`
      assert.ok(existsSync(join(ROOT, f)), `${f} missing`)
      assert.match(read(f), /await requireSession\(\)/, f)
    })
  }

  for (const f of ['app/worlds/[worldId]/layout.tsx', 'app/multiplication/[table]/layout.tsx']) {
    it(`${f} also calls requireSession()`, () => {
      assert.match(read(f), /await requireSession\(\)/)
    })
  }

  it('requireSession redirects to /login when there is no session', () => {
    const src = read('lib/auth/requireSession.ts')
    assert.match(src, /if \(!session\) redirect\('\/login'\)/)
  })
})

describe('Edge safety of the middleware graph', () => {
  it('middleware.ts never imports @/auth and only uses the provider-less config', () => {
    const src = read('middleware.ts')
    assert.doesNotMatch(src, /from ['"]@\/auth['"]/)
    assert.match(src, /from ['"]@\/lib\/auth\/config['"]/)
  })
  it('lib/auth/config.ts imports only next-auth types and the node-free allowlist', () => {
    const imports = [...read('lib/auth/config.ts').matchAll(/^import .* from ['"]([^'"]+)['"]/gm)].map((x) => x[1])
    assert.deepEqual(imports, ['next-auth', './allowlist'])
    assert.match(read('lib/auth/config.ts'), /^import type .* from 'next-auth'/m)
  })
  it('lib/auth/allowlist.ts imports nothing (Edge-safe)', () => {
    assert.doesNotMatch(read('lib/auth/allowlist.ts'), /^import /m)
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
