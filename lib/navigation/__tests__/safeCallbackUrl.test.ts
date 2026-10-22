import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeCallbackUrl } from '../safeCallbackUrl'

const ORIGIN = 'https://mathquest.example.test'

/** Resolve the result the way the browser will (relative '/' against our origin). */
function landsOn(result: string): string {
  return new URL(result, ORIGIN).origin
}

const cases: Array<[input: string | null, expected: string]> = [
  ['//evil.com', '/'],
  ['/\\evil.com', '/'],
  ['\\\\evil.com', '/'],
  [`${ORIGIN}//evil.com`, `${ORIGIN}/evil.com`],
  [`${ORIGIN}/\\evil.com`, `${ORIGIN}/evil.com`],
  ['https://evil.com', '/'],
  ['https://evil.com/multiplication', '/'],
  ['javascript:alert(1)', '/'],
  ['data:text/html,hi', '/'],
  ['http://mathquest.example.test/multiplication', '/'], // other scheme = other origin
  ['', '/'],
  [null, '/'],
  ['/multiplication/big?x=1#y', `${ORIGIN}/multiplication/big?x=1#y`],
  ['/', `${ORIGIN}/`],
]

for (const [input, expected] of cases) {
  test(`safeCallbackUrl(${JSON.stringify(input)}) → ${expected}`, () => {
    const out = safeCallbackUrl(input, ORIGIN)
    assert.equal(out, expected)
    assert.equal(landsOn(out), ORIGIN, 'always lands on our origin')
    assert.ok(!out.startsWith('//'), 'never protocol-relative')
  })
}
