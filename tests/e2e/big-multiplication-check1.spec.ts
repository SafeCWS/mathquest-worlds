/**
 * CHECK round 1 regressions (2026-10-22) — @hackerAI + @code-reviewer + @html-validator probes
 * turned into e2e. Each test FAILED on f9d2b1f (control run recorded in the commit message) and
 * passes after the fix. Silent browsers (./silence), synthetic data only.
 *
 * Dragon Oops deals its slip at random, so those tests reload until the slip they need is on
 * screen (pinning Math.random breaks React's event wiring — tried, clicks stop registering).
 */
import { test, expect } from './silence'
import type { Page } from '@playwright/test'
import type { SilentWindow } from './silence'

const MODES = ['split', 'column', 'story', 'flip', 'oops'] as const

async function seen(page: Page, modes: readonly string[] = MODES) {
  await page.addInitScript((ms) => {
    for (const m of ms) window.localStorage.setItem(`mq-big-walkthrough-${m}`, '1')
  }, [...modes])
}
/** Reload until the dealt Dragon Oops matches `want` (its row texts). */
async function dealOops(page: Page, url: string, want: (rows: string[]) => boolean) {
  await page.goto(url)
  for (let i = 0; i < 40; i++) {
    await expect(page.locator('[data-testid=oops-text-0]')).toBeVisible({ timeout: 15_000 })
    const rows = await page.locator('[data-testid^=oops-text-]').evaluateAll((els) => els.map((e) => (e.textContent ?? '').trim()))
    if (want(rows)) return rows
    await page.reload()
  }
  throw new Error('the wanted slip was not dealt in 40 tries')
}
async function pad(page: Page, n: number) {
  const area = page.locator('[data-testid=answer-pad]')
  for (const d of String(n)) await area.locator('button').filter({ hasText: new RegExp(`^${d}$`) }).click()
  await area.getByRole('button', { name: 'Check my answer' }).click()
}
async function phase(page: Page, value: string) {
  await expect(page.locator(`[data-phase="${value}"]`)).toHaveCount(1, { timeout: 10_000 })
}
async function gems(page: Page): Promise<number> {
  await expect(page.locator('[data-testid=hoard-count]').first()).toBeVisible({ timeout: 10_000 })
  return Number((await page.locator('[data-testid=hoard-count]').first().innerText()).trim())
}
/** Break It Apart 21 × 3 up to (not including) the final sum. */
async function splitToAdd(page: Page) {
  await phase(page, 'split')
  await page.locator('[data-testid=split-number]').click({ force: true })
  await phase(page, 'left')
  await pad(page, 60)
  await phase(page, 'right')
  await pad(page, 3)
  await phase(page, 'add')
}
async function flipToConfirm(page: Page) {
  await phase(page, 'predict')
  await page.locator('[data-testid=predict-same]').click()
  await page.locator('[data-testid=flip-btn]').click()
  await phase(page, 'side')
  await page.locator('[data-testid=side-a]').click({ force: true })
  await page.locator('[data-testid=way-right]').click()
  await phase(page, 'tensPart')
  await pad(page, 60)
  await pad(page, 3)
  await pad(page, 63)
  await phase(page, 'confirm')
}
async function storyToAdd(page: Page) {
  await phase(page, 'read')
  await page.locator('[data-testid=story-go]').click()
  await phase(page, 'slots')
  await page.locator('[data-testid=chip-3]').click()
  await page.locator('[data-testid=chip-21]').click()
  await phase(page, 'pick')
  await page.locator('[data-testid=card-mul]').click()
  await phase(page, 'bar')
  await page.locator('[data-testid=story-solve]').click()
  await splitToAdd(page)
}
const rect = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((e) => {
    const r = e.getBoundingClientRect()
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }
  })
const overlaps = (a: { top: number; bottom: number; left: number; right: number }, b: typeof a) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

test.describe('Big Multiplication — CHECK round 1 regressions', () => {
  test('hackerAI #1: Back during a celebration, then a new game → no celebration, no old answer', async ({ page }) => {
    await seen(page)
    await page.goto('/multiplication/big?mode=split&a=21&b=3')
    await splitToAdd(page)
    await pad(page, 63)
    await expect(page.locator('[data-testid=celebration]')).toBeVisible()
    await page.locator('[data-testid=back-btn]').click({ force: true })
    await expect(page.locator('[data-screen=picker]')).toBeVisible()
    await page.locator('[data-testid=mode-column]').click()
    await page.waitForTimeout(1200)
    await expect(page.locator('[data-testid=celebration]')).toHaveCount(0)
    await expect(page.getByText('21 × 3 = 63')).toHaveCount(0)
  })

  test('code-reviewer #2 / hackerAI #7: Back inside the 800 ms award window → nothing lands in the next game', async ({ page }) => {
    await seen(page)
    await page.goto('/multiplication/big?mode=split&a=21&b=3')
    const before = await gems(page)
    await splitToAdd(page)
    await pad(page, 63)
    await page.locator('[data-testid=back-btn]').click({ force: true })
    await expect(page.locator('[data-screen=picker]')).toBeVisible()
    await page.locator('[data-testid=mode-flip]').click()
    await page.waitForTimeout(1500) // well past the old 800 ms timer
    await expect(page.locator('[data-testid=celebration]')).toHaveCount(0)
    await expect(page.locator('.prompt-pill').first()).toContainText('Problem 1 of 3')
    expect(await gems(page)).toBe(before + 3) // credited once, when the answer was accepted
  })

  test('code-reviewer #4: Back during the Story finale → no late gems, no stale celebration', async ({ page }) => {
    await seen(page)
    await page.goto('/multiplication/big?mode=story&a=21&b=3')
    const before = await gems(page)
    await storyToAdd(page)
    await pad(page, 63)
    await page.waitForTimeout(300)
    await page.locator('[data-testid=back-btn]').click({ force: true })
    const atBack = await gems(page)
    await page.locator('[data-testid=mode-split]').click()
    await page.waitForTimeout(2500)
    expect(await gems(page)).toBe(atBack)
    expect(atBack).toBe(before + 3)
    await expect(page.locator('[data-testid=celebration]')).toHaveCount(0)
    await expect(page.locator('.prompt-pill').first()).toContainText('Problem 1 of 3')
  })

  test('code-reviewer #1 / hackerAI #10: two taps on "Same answer!" in one task → +3 once', async ({ page }) => {
    await seen(page)
    await page.goto('/multiplication/big?mode=flip&a=21&b=3')
    await flipToConfirm(page)
    const atConfirm = await gems(page) // already credited when 63 was accepted
    await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('[data-testid=flip-check]')!
      el.click()
      el.click()
    })
    await expect(page.locator('[data-testid=celebration]')).toBeVisible()
    await page.waitForTimeout(500)
    expect(await gems(page)).toBe(atConfirm)
    await page.locator('[data-testid=flip-check]').dblclick({ force: true }).catch(() => {})
    await page.waitForTimeout(400)
    expect(await gems(page)).toBe(atConfirm)
  })

  test('double tap on "Next story" never skips a problem and adds nothing', async ({ page }) => {
    await seen(page)
    await page.goto('/multiplication/big?mode=story&a=21&b=3')
    await storyToAdd(page)
    await pad(page, 63)
    await expect(page.locator('[data-testid=story-next]')).toBeVisible({ timeout: 5_000 })
    const g = await gems(page)
    await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('[data-testid=story-next]')!
      el.click()
      el.click()
    })
    await phase(page, 'read')
    await expect(page.locator('.prompt-pill').first()).toContainText('Problem 2 of 3')
    expect(await gems(page)).toBe(g)
  })

  test('hackerAI #13: a reload during the Story finale keeps the gems', async ({ page }) => {
    await seen(page)
    await page.goto('/multiplication/big?mode=story&a=21&b=3')
    const before = await gems(page)
    await storyToAdd(page)
    await pad(page, 63)
    await page.waitForTimeout(400) // finale running, the old award had not landed yet
    await page.reload()
    await phase(page, 'read')
    expect(await gems(page)).toBe(before + 3)
  })

  test('hackerAI #4: Dragon Oops walkthrough never calls the oops row "right" (oops on row 1)', async ({ page }) => {
    await seen(page, ['split', 'column', 'story', 'flip']) // oops walkthrough NOT seen
    // The walkthrough starts on every load until it finishes once, so reloading to deal is safe.
    await dealOops(page, '/multiplication/big?mode=oops&a=21&b=3', (r) => r[0] === '21 = 2 + 1')
    await expect(page.locator('[data-testid=demo-banner]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid=mode-area][data-demo="0"]')).toHaveCount(1, { timeout: 10_000 })
    const spoken = await page.evaluate(() => (window as unknown as SilentWindow).__speak.join(' | '))
    expect(spoken).not.toMatch(/this one is right/i)
    expect(spoken).toMatch(/look closely/i)
    await expect(page.locator('[data-testid=oops-row-0]')).not.toHaveAttribute('data-state', 'ok')
  })

  test('hackerAI #9: a right row below the oops gets a neutral note — no miss, no 🤔', async ({ page }) => {
    await seen(page)
    await dealOops(page, '/multiplication/big?mode=oops&a=21&b=3', (r) => r[1] === '20 × 3 = 6')
    await phase(page, 'find')
    await page.locator('[data-testid=oops-row-0]').click()
    await page.locator('[data-testid=oops-row-2]').click() // "1 × 3 = 3" — right on its own
    await expect(page.locator('[data-testid=oops-elsewhere]')).toContainText('the oops is somewhere else')
    await expect(page.locator('[data-testid=hint-bubble]')).toHaveCount(0)
    await expect(page.locator('[data-testid=mascot]')).not.toContainText('🤔')
    await expect(page.locator('[data-testid=oops-row-2]')).toHaveAttribute('data-state', 'ok')
    // A row built ON the wrong value still says "check above".
    await page.locator('[data-testid=oops-row-3]').click()
    await expect(page.locator('[data-testid=hint-bubble]')).toContainText(/above/i)
  })

  for (const vp of [{ width: 1180, height: 820 }, { width: 390, height: 844 }]) {
    test(`hackerAI #8 / M2: the hint bubble never covers "21" or Show me again (${vp.width} px)`, async ({ page }) => {
      await page.setViewportSize(vp)
      await seen(page)
      await page.goto('/multiplication/big?mode=split&a=21&b=3')
      await phase(page, 'split')
      for (let tier = 1; tier <= 3; tier++) {
        await page.locator('[data-testid=hint-btn]').click()
        await expect(page.locator(`[data-testid=hint-bubble][data-tier="${tier}"]`)).toBeVisible()
        await page.waitForTimeout(600)
        const b = await rect(page, '[data-testid=hint-bubble]')
        expect(overlaps(b, await rect(page, '[data-testid=split-number]')), `tier ${tier} covers 21`).toBe(false)
        expect(overlaps(b, await rect(page, '[data-testid=demo-again]')), `tier ${tier} covers Show me again`).toBe(false)
      }
      // Tapping outside closes it, and the tap still lands.
      await page.locator('[data-testid=split-number]').click({ force: true })
      await expect(page.locator('[data-testid=hint-bubble]')).toHaveCount(0)
      await phase(page, 'left')
    })
  }

  test('hackerAI #11: predicting "Different" is not an error — no hint, no 🤔, "Let\'s test it!"', async ({ page }) => {
    await seen(page)
    await page.goto('/multiplication/big?mode=flip&a=21&b=3')
    await phase(page, 'predict')
    await page.locator('[data-testid=predict-different]').click()
    await expect(page.locator('[data-testid=flip-test-it]')).toBeVisible()
    await expect(page.locator('[data-testid=hint-bubble]')).toHaveCount(0)
    await expect(page.locator('[data-testid=mascot]')).not.toContainText('🤔')
    await page.locator('[data-testid=flip-btn]').click()
    await phase(page, 'side')
  })

  test('hackerAI #12: Back mid-walkthrough → next game has no stuck demo; the walkthrough is not marked seen', async ({ page }) => {
    await seen(page, ['column', 'story', 'flip', 'oops']) // split walkthrough NOT seen
    await page.goto('/multiplication/big')
    await page.locator('[data-testid=mode-split]').click()
    await expect(page.locator('[data-testid=mode-area][data-demo="1"]')).toHaveCount(1)
    await page.locator('[data-testid=back-btn]').click({ force: true })
    await page.locator('[data-testid=mode-column]').click()
    await page.waitForTimeout(600)
    // Read once, no retry: a stuck demo ends by itself after ~3.4 s, so a retrying assert would hide it.
    expect(await page.locator('[data-testid=mode-area]').getAttribute('data-demo')).toBe('0')
    expect(await page.evaluate(() => localStorage.getItem('mq-big-walkthrough-split'))).toBeNull()
  })

  test('hackerAI #16: at 320 px (Slide Over) the split rectangle fits its card', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await seen(page)
    await page.goto('/multiplication/big?mode=flip&a=78&b=8')
    await phase(page, 'predict')
    await page.locator('[data-testid=predict-same]').click()
    await page.locator('[data-testid=flip-btn]').click()
    await phase(page, 'side')
    await page.locator('[data-testid=side-a]').click({ force: true })
    await page.locator('[data-testid=way-right]').click()
    await phase(page, 'tensPart')
    await page.waitForTimeout(800)
    const m = await page.evaluate(() => {
      const ones = document.querySelector('[data-testid=flip-piece-ones]')!.getBoundingClientRect()
      const card = document.querySelector('[data-testid=flip-piece-ones]')!.closest('.overflow-hidden')!.getBoundingClientRect()
      return { onesRight: ones.right, cardRight: card.right }
    })
    expect(m.onesRight).toBeLessThanOrEqual(m.cardRight)
  })

  test('hackerAI #17: Tab stays inside the celebration; after Next focus is on the new step', async ({ page }) => {
    await seen(page)
    await page.goto('/multiplication/big?mode=split&a=21&b=3')
    await splitToAdd(page)
    await pad(page, 63)
    await expect(page.locator('[data-testid=celebration]')).toBeVisible()
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => !!document.activeElement?.closest('[data-testid=celebration]'))).toBe(true)
    }
    await page.keyboard.press('Shift+Tab')
    expect(await page.evaluate(() => !!document.activeElement?.closest('[data-testid=celebration]'))).toBe(true)
    await page.locator('[data-testid=next-btn]').click()
    await page.waitForTimeout(500)
    expect(await page.evaluate(() => !!document.activeElement?.closest('[data-testid=mode-area]'))).toBe(true)
  })

  test('code-reviewer #6: muting stops the read-along word highlight at once', async ({ page }) => {
    await seen(page)
    await page.goto('/multiplication/big?mode=story&a=21&b=3')
    await phase(page, 'read')
    await expect(page.locator('[data-reading="1"]')).toHaveCount(1, { timeout: 5_000 })
    await page.locator('[data-testid=voice-toggle]').click()
    await page.waitForTimeout(200)
    // Read once (no retry): the highlight would end by itself when the sentence runs out.
    expect(await page.locator('[data-reading="1"]').count()).toBe(0)
  })

  test('code-reviewer #3: a chip tap during the move to "pick" does nothing', async ({ page }) => {
    await seen(page)
    // 42 × 3 is Level 3: the story carries one extra number, so a third chip is still tappable
    // (a chip already placed is disabled and would not prove anything).
    await page.goto('/multiplication/big?mode=story&a=42&b=3')
    await phase(page, 'read')
    await page.locator('[data-testid=story-go]').click()
    await phase(page, 'slots')
    const chips = await page.locator('[data-testid^=chip-]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!))
    const extra = chips.find((c) => c !== 'chip-3' && c !== 'chip-42')!
    expect(extra).toBeTruthy()
    await page.locator('[data-testid=chip-3]').click()
    await page.evaluate((x) => {
      document.querySelector<HTMLElement>('[data-testid=chip-42]')!.click()
      document.querySelector<HTMLElement>(`[data-testid=${x}]`)!.click() // inside the 500 ms window
    }, extra)
    await page.waitForTimeout(150)
    // Read once, inside the window (the move to "pick" would close any hint by itself).
    expect(await page.locator('[data-testid=hint-bubble]').count()).toBe(0)
    expect(await page.locator('[data-testid=mascot]').innerText()).not.toContain('🤔')
    await phase(page, 'pick')
  })

  test('voice toggle: one fixed label "Voice", aria-pressed = voice on', async ({ page }) => {
    await seen(page)
    await page.goto('/multiplication/big?mode=column&a=21&b=3')
    const toggle = page.locator('[data-testid=voice-toggle]')
    await expect(toggle).toHaveAttribute('aria-label', 'Voice')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-label', 'Voice')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })
})
