/**
 * Edge-safe NextAuth config: the jwt callback drops any session whose email
 * is not on SIMPLE_AUTH_USERS (review LOW-8), so removing someone from the
 * allowlist ends their session on the next request instead of in 30 days.
 */
import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { authConfig } from '../config'

const ORIGINAL = process.env.SIMPLE_AUTH_USERS
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.SIMPLE_AUTH_USERS
  else process.env.SIMPLE_AUTH_USERS = ORIGINAL
})

type JwtFn = (p: { token: Record<string, unknown> }) => Promise<Record<string, unknown> | null>
const jwt = authConfig.callbacks.jwt as unknown as JwtFn

describe('jwt callback allowlist check', () => {
  it('keeps a token whose email is on the allowlist (case/space-insensitive)', async () => {
    process.env.SIMPLE_AUTH_USERS = JSON.stringify([{ email: 'parent@example.com' }])
    const token = { email: ' Parent@Example.com ', sub: 'x' }
    assert.deepEqual(await jwt({ token }), token)
  })

  it('drops a token whose email was removed from the allowlist', async () => {
    process.env.SIMPLE_AUTH_USERS = JSON.stringify([{ email: 'grownup@example.com' }])
    assert.equal(await jwt({ token: { email: 'parent@example.com' } }), null)
  })

  it('drops tokens with no email, and everything when the allowlist is malformed or unset', async () => {
    process.env.SIMPLE_AUTH_USERS = JSON.stringify([{ email: 'parent@example.com' }])
    assert.equal(await jwt({ token: {} }), null)
    process.env.SIMPLE_AUTH_USERS = '{oops'
    assert.equal(await jwt({ token: { email: 'parent@example.com' } }), null)
    delete process.env.SIMPLE_AUTH_USERS
    assert.equal(await jwt({ token: { email: 'parent@example.com' } }), null)
  })
})
