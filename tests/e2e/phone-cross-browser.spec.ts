/**
 * Phone width (390 × 844, touch) in Chromium, WebKit and Firefox — run with
 * playwright.phone.config.ts. Guards the app-wide 2026-10-22 changes:
 *   - KidButton fires on onClick (a real tap), not pointerdown, on EXISTING screens
 *   - primary KidButton text is dark (--space-primary) on the yellow/orange fill
 *   - no sideways scroll on the new and touched screens
 *   - Big Multiplication phone answer sheet: 78 × 8 is solvable by taps alone
 */
import { test, expect } from '@playwright/test'
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
    for (const m of ['blocks', 'split', 'column', 'guess']) localStorage.setItem(`mq-big-walkthrough-${m}`, '1')
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
