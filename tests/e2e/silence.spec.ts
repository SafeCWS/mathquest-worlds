/**
 * Proof that the e2e browsers are silent (operator ruling 2026-10-22). Fails when:
 *   - a spec imports `test` from '@playwright/test' instead of './silence' (it would run unmuted)
 *   - the init script stops installing the speech / AudioContext stubs
 *   - a context opened by hand (browser.newContext) escapes the stubs
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from './silence'
import type { SilentWindow } from './silence'

const DIR = __dirname

test('every spec and setup file takes `test` from ./silence', () => {
  const files = readdirSync(DIR).filter((f) => /\.(spec|setup)\.ts$/.test(f))
  expect(files.length).toBeGreaterThan(3)
  for (const f of files) {
    const src = readFileSync(join(DIR, f), 'utf8')
    expect(src, `${f} must import test from ./silence`).toMatch(/import \{ test( as \w+)?, expect \} from '\.\/silence'/)
    expect(src, `${f} must not import a runtime test from @playwright/test`).not.toMatch(/import \{[^}]*\btest\b[^}]*\} from '@playwright\/test'/)
  }
})

async function probe(page: import('@playwright/test').Page) {
  await page.goto('/login')
  return page.evaluate(() => {
    const w = window as unknown as SilentWindow
    window.speechSynthesis.speak(new SpeechSynthesisUtterance('probe'))
    const ac = new window.AudioContext()
    const d = ac.destination as unknown as GainNode
    ac.createOscillator()
    return { spoke: w.__speak.slice(), muted: d instanceof GainNode && d.gain.value === 0, sfx: w.__sfx }
  })
}

test('the default context is silent: speech stubbed and counted, AudioContext ends at gain 0', async ({ page }) => {
  const r = await probe(page)
  expect(r.spoke).toEqual(['probe'])
  expect(r.muted).toBe(true)
  expect(r.sfx).toBe(1)
})

test('a context opened by hand is silent too', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ baseURL })
  const page = await ctx.newPage()
  const r = await probe(page)
  expect(r.spoke).toEqual(['probe'])
  expect(r.muted).toBe(true)
  await ctx.close()
})
