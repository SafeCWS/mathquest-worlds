/**
 * Big Multiplication (2-digit × 1-digit) e2e — approved G1.5 prototype
 * ~/prototypes/mathquest-worlds-big-mult-otp (2026-10-22).
 *
 * Covers:
 *   - happy path: 3 Level-1 games (3 problems each) open Level 2, and the unlock
 *     survives a reload (zustand persist, key mathquest-big-multiplication)
 *   - 78 × 8 Step-by-Step: carry bubble shows 6, wrong answer → amber hint and no
 *     progress lost, answer row reads 624
 *   - L155 / SP-29 hydration gate: a returning kid with Level 2 open must never see
 *     it painted locked. FAILS if the `_hasHydrated` / mounted gate in
 *     components/big/BigMultiplication.tsx is removed (control-run proven 2026-10-22).
 *   - English only under a Spanish cookie (operator ruling 2026-10-22)
 *
 * Auth is dev-mode permissive (same as answer-not-leaked.spec.ts). Synthetic data only.
 */
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

const BIG_KEY = 'mathquest-big-multiplication'
const MODES = ['blocks', 'split', 'column', 'guess'] as const

/** Every mode starts "walkthrough already seen" unless a test wants the demo. */
async function skipWalkthroughs(page: Page) {
  await page.addInitScript((modes) => {
    for (const m of modes) window.localStorage.setItem(`mq-big-walkthrough-${m}`, '1')
  }, [...MODES])
}

async function seedBigStore(page: Page, gamesDone: Record<1 | 2 | 3, number>) {
  await page.addInitScript(
    ({ key, blob }) => window.localStorage.setItem(key, blob),
    { key: BIG_KEY, blob: JSON.stringify({ state: { gamesDone }, version: 1 }) },
  )
}

/** Tap digits on the on-screen answer pad, then ✓. */
async function pad(page: Page, n: number) {
  const area = page.locator('[data-testid=answer-pad]')
  for (const d of String(n)) {
    await area.locator('button').filter({ hasText: new RegExp(`^${d}$`) }).click()
  }
  await area.getByRole('button', { name: 'Check my answer' }).click()
}

async function phase(page: Page, value: string) {
  await expect(page.locator(`[data-phase="${value}"]`)).toHaveCount(1, { timeout: 10_000 })
}

/** Solve whatever Step-by-Step problem is on screen. */
async function solveColumnProblem(page: Page) {
  const text = await page.locator('[data-testid=problem]').innerText()
  const [a, b] = text.split('×').map((x) => Number(x.replace(/\s/g, '')))
  const ones = (a % 10) * b
  const tens = Math.floor(a / 10) * b
  await phase(page, 'ones')
  await pad(page, ones)
  await phase(page, 'tens')
  await pad(page, tens)
  if (ones >= 10) {
    await phase(page, 'carryTap')
    await page.locator('[data-testid=carry-tap-btn]').click()
    await phase(page, 'tensAdd')
    await pad(page, tens + Math.floor(ones / 10))
  }
  await expect(page.locator('[data-testid=celebration]')).toBeVisible()
  await page.locator('[data-testid=next-btn]').click()
}

test.describe('/multiplication/big', () => {
  test.describe('logged out', () => {
    test.use({ storageState: { cookies: [], origins: [] } })
    test('a logged-out visit lands on /login', async ({ page }) => {
      await page.goto('/multiplication/big')
      await expect(page).toHaveURL(/\/login/)
      await expect(page.getByRole('button', { name: 'Send my code' })).toBeVisible()
    })
  })

  test('tile on the times-tables hub opens the level picker; Level 2 starts locked', async ({ page }) => {
    await skipWalkthroughs(page)
    await page.goto('/multiplication')
    const tile = page.locator('[data-testid=big-mult-tile]')
    await expect(tile).toBeVisible({ timeout: 15_000 })
    const tileY = (await tile.boundingBox())!.y
    const gridY = (await page.locator('a[href="/multiplication/1"]').first().boundingBox())!.y
    expect(tileY).toBeLessThan(gridY)
    await tile.click()
    await expect(page.locator('[data-screen=picker]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid=level-2][aria-disabled=true]')).toHaveCount(1)
    await expect(page.locator('[data-testid=back-btn]')).toBeVisible()
  })

  test('happy path: 3 Level-1 games open Level 2, and it stays open after a reload', async ({ page }) => {
    test.setTimeout(180_000)
    await skipWalkthroughs(page)
    await page.goto('/multiplication/big')
    await expect(page.locator('[data-screen=picker]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid=level-2][aria-disabled=true]')).toHaveCount(1)

    for (let game = 0; game < 3; game++) {
      await page.locator('[data-testid=mode-column]').click()
      for (let p = 0; p < 3; p++) await solveColumnProblem(page)
      await expect(page.locator('[data-screen=picker]')).toBeVisible()
    }
    await expect(page.locator('[data-testid=level-2][aria-disabled=false]')).toHaveCount(1)
    await expect(page.locator('[data-testid=level-1]')).toContainText('3 of 3 games')

    await page.reload()
    await expect(page.locator('[data-screen=picker]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid=level-2][aria-disabled=false]')).toHaveCount(1)
  })

  test('78 × 8 Step-by-Step: carry 6, wrong answer keeps the step, answer row reads 624', async ({ page }) => {
    await skipWalkthroughs(page)
    await page.goto('/multiplication/big?mode=column&a=78&b=8')
    await phase(page, 'ones')
    await pad(page, 64)
    await phase(page, 'tens')
    await expect(page.locator('[data-testid=carry-bubble]')).toHaveText('6')
    await expect(page.locator('[data-testid=ans-ones]')).toHaveText('4')

    await pad(page, 54) // wrong on purpose
    const hint = page.locator('[data-testid=hint-bubble]')
    await expect(hint).toBeVisible()
    await expect(hint).toHaveClass(/amber/)
    await expect(hint).not.toHaveClass(/red/)
    await phase(page, 'tens') // no progress lost

    await pad(page, 56)
    await phase(page, 'carryTap')
    await page.locator('[data-testid=carry-tap-btn]').click()
    await phase(page, 'tensAdd')
    await pad(page, 62)
    await expect(page.locator('[data-testid=celebration]')).toBeVisible()
    const row =
      (await page.locator('[data-testid=ans-hundreds]').innerText()).trim() +
      (await page.locator('[data-testid=ans-tens]').innerText()).trim() +
      (await page.locator('[data-testid=ans-ones]').innerText()).trim()
    expect(row).toBe('624')
  })

  test('hydration gate: a returning kid with Level 2 open never sees it painted locked', async ({ page }) => {
    await skipWalkthroughs(page)
    await seedBigStore(page, { 1: 3, 2: 0, 3: 0 })
    // Record every paint of a locked Level 2 from the first DOM node onwards.
    await page.addInitScript(() => {
      const w = window as unknown as { __lockedLevel2Seen: number }
      w.__lockedLevel2Seen = 0
      const check = () => {
        if (document.querySelector('[data-testid=level-2][aria-disabled=true]')) w.__lockedLevel2Seen++
      }
      new MutationObserver(check).observe(document, { childList: true, subtree: true, attributes: true })
      document.addEventListener('DOMContentLoaded', check)
    })

    const response = await page.goto('/multiplication/big')
    // Server HTML must be the loader: the server cannot read localStorage, so any
    // picker it renders shows the default (Level 2 locked) — the flash L155 forbids.
    const html = (await response?.text()) ?? ''
    expect(html).not.toContain('data-screen="picker"')
    expect(html).not.toContain('data-testid="level-2"')

    await expect(page.locator('[data-screen=picker]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid=level-2][aria-disabled=false]')).toHaveCount(1)
    const seen = await page.evaluate(() => (window as unknown as { __lockedLevel2Seen: number }).__lockedLevel2Seen)
    expect(seen).toBe(0)
  })

  test('first-time walkthrough: dragon does step 1, then hands over; remembered after reload', async ({ page }) => {
    await page.goto('/multiplication/big?mode=column&a=78&b=8')
    await expect(page.locator('[data-testid=demo-banner]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid=mode-area][data-demo="0"]')).toHaveCount(1, { timeout: 10_000 })
    await phase(page, 'tens')
    await expect(page.locator('[data-testid=ans-ones]')).toHaveText('4')
    expect(await page.evaluate(() => localStorage.getItem('mq-big-walkthrough-column'))).toBe('1')
    await page.reload()
    await phase(page, 'ones')
    await page.waitForTimeout(600)
    await expect(page.locator('[data-testid=demo-banner]')).toHaveCount(0)
  })

  test('English only: a Spanish cookie leaves the new screens English; the hub keeps Spanish', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'mathquest-locale', value: 'es', url: baseURL! }])
    await skipWalkthroughs(page)
    await page.goto('/multiplication/big')
    await expect(page.getByText('Pick a level')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[role=group][aria-label]')).toHaveCount(0) // no EN/ES toggle

    await page.goto('/multiplication')
    await expect(page.locator('[data-testid=big-mult-tile]')).toContainText('Big Multiplication', { timeout: 15_000 })
    await expect(page.getByText('Tablas de multiplicar').first()).toBeVisible()
    await expect(page.locator('[role=group][aria-label]')).toHaveCount(1) // pre-existing toggle stays
  })
})
