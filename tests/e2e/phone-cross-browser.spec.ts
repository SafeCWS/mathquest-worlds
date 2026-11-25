/**
 * Phone width (390 × 844, touch) in Chromium, WebKit and Firefox — run with
 * playwright.phone.config.ts. Guards the app-wide 2026-10-22 changes:
 *   - KidButton fires on onClick (a real tap), not pointerdown, on EXISTING screens
 *   - primary KidButton text is dark (--space-primary) on the yellow/orange fill
 *   - no sideways scroll on the new and touched screens
 *   - Big Multiplication phone answer sheet: 78 × 8 is solvable by taps alone
 */
import { test, expect } from './silence'
import type { Page } from '@playwright/test'

async function noSidewaysScroll(page: Page) {
  const sw = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(sw).toBeLessThanOrEqual(390)
}

async function pad(page: Page, n: number) {
  const area = page.locator('[data-testid=answer-pad]')
  for (const d of String(n)) await area.locator('button').filter({ hasText: new RegExp(`^${d}$`) }).tap()
  await area.getByRole('button', { name: 'Check my answer' }).tap()
}

test('existing KidButtons fire on tap: home → create-character → back home', async ({ page }) => {
  await page.goto('/')
  const start = page.getByRole('button', { name: 'Start your adventure' })
  await expect(start).toBeVisible({ timeout: 20_000 })
  await noSidewaysScroll(page)
  const color = await start.evaluate((el) => getComputedStyle(el).color)
  expect(color).toBe('rgb(26, 26, 46)') // --space-primary #1A1A2E — dark text on yellow
  await start.tap()
  await expect(page).toHaveURL(/\/create-character$/)
  await expect(page.getByRole('button', { name: 'Surprise me with a random character' })).toBeVisible({ timeout: 20_000 })
  await noSidewaysScroll(page)
  await page.getByRole('button', { name: 'Surprise me with a random character' }).tap()
  await page.getByRole('button', { name: 'Back to home' }).tap()
  await expect(page).toHaveURL(/\/$/)
})

test('new and touched screens: no sideways scroll at 390 px', async ({ page }) => {
  for (const path of ['/multiplication', '/multiplication/big']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await noSidewaysScroll(page)
  }
  await expect(page.locator('[data-screen=picker]')).toBeVisible()
})

test('Big Multiplication 78 × 8 by taps on the phone answer sheet', async ({ page }) => {
  await page.addInitScript(() => {
    for (const m of ['split', 'column', 'story', 'flip', 'oops']) localStorage.setItem(`mq-big-walkthrough-${m}`, '1')
  })
  await page.goto('/multiplication/big?mode=column&a=78&b=8')
  await expect(page.locator('[data-phase=ones]')).toHaveCount(1, { timeout: 20_000 })
  const sheet = await page.locator('.action-dock').boundingBox()
  expect(sheet!.height).toBeLessThanOrEqual(844 * 0.45 + 1) // compact sheet, work stays visible
  await pad(page, 64)
  await expect(page.locator('[data-testid=carry-bubble]')).toHaveText('6')
  await pad(page, 56)
  await page.locator('[data-testid=carry-tap-btn]').tap()
  await pad(page, 62)
  await expect(page.locator('[data-testid=celebration]')).toBeVisible()
  await noSidewaysScroll(page)
})

test('silent in this engine: speech stubbed, AudioContext ends at gain 0', async ({ page }) => {
  await page.goto('/login')
  const r = await page.evaluate(() => {
    const w = window as unknown as { __speak: string[] }
    window.speechSynthesis.speak(new SpeechSynthesisUtterance('probe'))
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const d = new Ctx().destination as unknown as GainNode
    return { spoke: w.__speak.slice(), muted: d instanceof GainNode && d.gain.value === 0 }
  })
  expect(r.spoke).toEqual(['probe'])
  expect(r.muted).toBe(true)
})

test('v2 picker + Flip & Split 42 × 3 + Story Missions slots by taps at 390 px', async ({ page }) => {
  await page.addInitScript(() => {
    for (const m of ['split', 'column', 'story', 'flip', 'oops']) localStorage.setItem(`mq-big-walkthrough-${m}`, '1')
  })
  await page.goto('/multiplication/big')
  await expect(page.locator('[data-testid=mode-oops]')).toBeVisible({ timeout: 20_000 })
  await noSidewaysScroll(page)

  await page.goto('/multiplication/big?mode=flip&a=42&b=3')
  await expect(page.locator('[data-phase=predict]')).toHaveCount(1, { timeout: 20_000 })
  await noSidewaysScroll(page)
  await page.locator('[data-testid=predict-same]').tap()
  await page.locator('[data-testid=flip-btn]').tap()
  await expect(page.locator('[data-phase=side]')).toHaveCount(1, { timeout: 10_000 })
  await noSidewaysScroll(page)
  await page.locator('[data-testid=side-a]').tap({ force: true })
  await page.locator('[data-testid=way-right]').tap()
  await pad(page, 120)
  await pad(page, 6)
  await pad(page, 126)
  await expect(page.locator('[data-phase=confirm]')).toHaveCount(1, { timeout: 10_000 })
  await page.locator('[data-testid=flip-check]').tap()
  await expect(page.locator('[data-testid=celebration]')).toBeVisible()

  await page.goto('/multiplication/big?mode=story&a=42&b=3')
  await expect(page.locator('[data-phase=read]')).toHaveCount(1, { timeout: 20_000 })
  await noSidewaysScroll(page)
  await page.locator('[data-testid=story-go]').tap()
  await page.locator('[data-testid=chip-3]').tap()
  await page.locator('[data-testid=chip-42]').tap()
  await expect(page.locator('[data-phase=pick]')).toHaveCount(1, { timeout: 10_000 })
  await noSidewaysScroll(page)
})

test('M1: Dragon Oops — the row being fixed stays above the answer sheet after Hint', async ({ page }) => {
  await page.addInitScript(() => {
    for (const m of ['split', 'column', 'story', 'flip', 'oops']) localStorage.setItem(`mq-big-walkthrough-${m}`, '1')
  })
  // html-validator repro (qa-v2 oopsscan 21x3-fix-hint-tier2): the oops on row 3 ("1 × 3 = 4");
  // the slip is random, so reload until it is dealt.
  await page.goto('/multiplication/big?mode=oops&a=21&b=3')
  for (let i = 0; i < 40; i++) {
    await expect(page.locator('[data-phase=find]')).toHaveCount(1, { timeout: 20_000 })
    if ((await page.locator('[data-testid=oops-text-2]').textContent())?.trim() === '1 × 3 = 4') break
    await page.reload()
  }
  await expect(page.locator('[data-testid=oops-text-2]')).toHaveText('1 × 3 = 4')
  await page.locator('[data-testid=oops-row-0]').tap()
  await page.locator('[data-testid=oops-row-1]').tap()
  await page.locator('[data-testid=oops-row-2]').tap()
  await expect(page.locator('[data-phase=fix]')).toHaveCount(1)
  await page.waitForTimeout(1200) // the step's own re-frame has run
  await page.locator('[data-testid=hint-btn]').tap()
  await expect(page.locator('[data-testid=hint-bubble]')).toBeVisible()
  await page.waitForTimeout(1500) // re-frame after the hint + the dragon's 2-line reply
  const m = await page.evaluate(() => {
    const row = document.querySelector('[data-testid=oops-row-2]')!.getBoundingClientRect()
    const sheet = document.querySelector('.action-dock')!.getBoundingClientRect()
    return { top: row.top, bottom: row.bottom, sheetTop: sheet.top }
  })
  expect(m.top).toBeGreaterThanOrEqual(0)
  expect(m.bottom).toBeLessThanOrEqual(m.sheetTop)
})
