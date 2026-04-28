/**
 * speechUtils unit test — QC pass 2026-04-27.
 *
 * Asserts the contract of speak() / speakEquation() in isolation:
 *   - pace 'normal' (default) → utterance.rate === 0.95
 *   - pace 'kid-fast'         → utterance.rate === 1.0
 *   - pace 'slow'             → utterance.rate === 0.8
 *   - speakEquation default   → text matches /N times M. What.*answer/ AND
 *                                does NOT contain the product
 *   - speakEquation reveal:'full' → text contains the product
 *
 * Runner: Node's stdlib `node --test` driven via tsx. No vitest / jest
 * dependency — keeps the package.json surface minimal. Run with:
 *   npm run test:unit
 *
 * (We use tsx because the file is .ts and Node's test runner doesn't strip
 * types on its own. tsx is pinned in devDependencies — added 2026-04-27 to
 * close the PACA G2 BLOCKER on reproducible CI runs.)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

// We need to install a SpeechSynthesisUtterance + speechSynthesis mock on
// the global `window` BEFORE importing speechUtils. Otherwise
// isSpeechSupported() returns false and speak() bails before setting rate.
interface MockUtterance {
  text: string
  rate: number
  pitch: number
  lang: string
  volume: number
  voice: SpeechSynthesisVoice | null
}

const captured: MockUtterance[] = []

class MockSpeechSynthesisUtterance implements MockUtterance {
  text: string
  rate = 1
  pitch = 1
  lang = ''
  volume = 1
  voice: SpeechSynthesisVoice | null = null
  constructor(text: string) {
    this.text = text
    captured.push(this)
  }
}

const mockSpeechSynthesis = {
  cancel: () => {},
  speak: (_u: MockUtterance) => {},
  getVoices: (): SpeechSynthesisVoice[] => [],
}

;(globalThis as unknown as { window: object }).window = {
  speechSynthesis: mockSpeechSynthesis,
  SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
}
;(globalThis as unknown as { SpeechSynthesisUtterance: typeof MockSpeechSynthesisUtterance }).SpeechSynthesisUtterance =
  MockSpeechSynthesisUtterance

// Now import speechUtils — its `typeof window` check will see our globals.
// Note: import comes AFTER the global window stub above. ES module hoisting
// would normally break this, but tsx transforms to CJS where the import
// becomes a require() call evaluated in source order.
import { speak, speakEquation, PACE_RATE_MAP } from '../speechUtils'

test('PACE_RATE_MAP encodes the QC pacing decision', () => {
  assert.equal(PACE_RATE_MAP['kid-fast'], 1.0)
  assert.equal(PACE_RATE_MAP['normal'], 0.95)
  assert.equal(PACE_RATE_MAP['slow'], 0.8)
})

test('speak() defaults to normal pace (rate 0.95)', () => {
  captured.length = 0
  speak('hi')
  assert.equal(captured.length, 1)
  assert.equal(captured[0].rate, 0.95)
})

test("speak('hi', { pace: 'kid-fast' }) -> rate 1.0", () => {
  captured.length = 0
  speak('hi', { pace: 'kid-fast' })
  assert.equal(captured[0].rate, 1.0)
})

test("speak('hi', { pace: 'slow' }) -> rate 0.8", () => {
  captured.length = 0
  speak('hi', { pace: 'slow' })
  assert.equal(captured[0].rate, 0.8)
})

test('speakEquation(3, 4) defaults to question-only and never speaks the product', () => {
  captured.length = 0
  speakEquation(3, 4)
  assert.equal(captured.length, 1)
  const text = captured[0].text
  assert.match(text, /3 times 4. What.*answer/)
  assert.ok(!text.includes('12'), `expected text to NOT contain '12', got: ${text}`)
})

test("speakEquation(3, 4, { revealMode: 'full' }) speaks the product", () => {
  captured.length = 0
  speakEquation(3, 4, { revealMode: 'full' })
  const text = captured[0].text
  assert.match(text, /3 times 4 equals 12/)
})

test("speakEquation(3, 4, { revealMode: 'with-hint' }) speaks groups, not product", () => {
  captured.length = 0
  speakEquation(3, 4, { revealMode: 'with-hint' })
  const text = captured[0].text
  assert.match(text, /3 times 4. That's 3 groups of 4/)
  assert.ok(!text.includes('12'), `with-hint should NOT contain '12', got: ${text}`)
})

test("speakEquation pace propagates to utterance.rate", () => {
  captured.length = 0
  speakEquation(3, 4, { pace: 'kid-fast' })
  assert.equal(captured[0].rate, 1.0)
})
