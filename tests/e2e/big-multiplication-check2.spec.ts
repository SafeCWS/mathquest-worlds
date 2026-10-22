/**
 * CHECK round 2 regressions (2026-10-22) — @html-validator M1/M2 + @hackerAI phone probes.
 *
 * The round-1 hint test used elementFromPoint, which looks straight THROUGH the bubble
 * (pointer-events: none) and so could never fail. These tests are GEOMETRIC: bounding-box
 * intersection of the bubble against every glowing step cell (with 12 px clearance), every enabled
 * button on screen, "Show me again", and the picture the child is asked about. They also require
 * the bubble to sit fully on screen, below the fixed top buttons and above the phone answer sheet.
 * Control run: these FAIL on a8f1a80 (recorded in the commit message) and pass after the fix.
 * Silent browsers (./silence), synthetic data only.
 */
import { test, expect } from './silence'
import type { Page } from '@playwright/test'

const MODES = ['split', 'column', 'story', 'flip', 'oops'] as const
const PHONE = { width: 390, height: 844 }
const IPAD = { width: 1180, height: 820 }
const CLEAR = 12 // px of air between the bubble and a glowing cell

async function seen(page: Page) {
  await page.addInitScript((ms) => {
    for (const m of ms) window.localStorage.setItem(`mq-big-walkthrough-${m}`, '1')
  }, [...MODES])
}
async function phase(page: Page, value: string) {
  await expect(page.locator(`[data-phase="${value}"]`)).toHaveCount(1, { timeout: 10_000 })
}
async function pad(page: Page, n: number) {
  const area = page.locator('[data-testid=answer-pad]')
  for (const d of String(n)) await area.locator('button').filter({ hasText: new RegExp(`^${d}$`) }).click()
  await area.getByRole('button', { name: 'Check my answer' }).click()
}

async function splitToAdd(page: Page) {
  await phase(page, 'split')
  await page.locator('[data-testid=split-number]').click({ force: true })
  await phase(page, 'left')
  await pad(page, 60)
  await phase(page, 'right')
  await pad(page, 3)
  await phase(page, 'add')
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

/**
 * Everything the open bubble covers, as readable strings (empty = clear). `extra` names targets
 * that are bigger than a step cell but are what the child must look at (the Flip rectangle).
 */
async function bubbleHits(page: Page, extra: string[] = []): Promise<string[]> {
  return page.evaluate(
    ({ extra, CLEAR }) => {
      const bubEl = document.querySelector<HTMLElement>('[data-testid=hint-bubble]')
      if (!bubEl) return ['no bubble']
      const b = bubEl.getBoundingClientRect()
      const out: string[] = []
      const name = (e: Element) => e.getAttribute('data-testid') || (e.textContent ?? '').trim().slice(0, 16)
      const hit = (r: DOMRect, pad: number) =>
        r.left - pad < b.right && b.left < r.right + pad && r.top - pad < b.bottom && b.top < r.bottom + pad
      const pct = (r: DOMRect) => {
        const ix = Math.max(0, Math.min(r.right, b.right) - Math.max(r.left, b.left))
        const iy = Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top))
        return Math.round(((ix * iy) / (r.width * r.height)) * 100)
      }
      // 1. Glowing step cells (the round-1 rule: up to 200 px tall), with clearance.
      for (const e of document.querySelectorAll('[data-testid=mode-area] [data-active="1"]')) {
        const r = e.getBoundingClientRect()
        if (r.width > 0 && r.height > 0 && r.height <= 200 && hit(r, CLEAR)) out.push(`active ${name(e)} ${pct(r)}%`)
      }
      // 2. The picture the step is about.
      for (const sel of extra) {
        const els = Array.from(document.querySelectorAll(sel))
        if (!els.length) out.push(`missing ${sel}`)
        for (const e of els) {
          const r = e.getBoundingClientRect()
          if (r.width > 0 && hit(r, CLEAR)) out.push(`target ${sel} "${(e.textContent ?? '').trim()}" ${pct(r)}%`)
        }
      }
      // 3. Every enabled, visible button on the page except the bubble's own and the fixed top row.
      for (const e of document.querySelectorAll<HTMLElement>('button:not([disabled]), [data-testid=demo-again]')) {
        if (bubEl.contains(e) || e.closest('.fixed.z-50') || e.matches('[data-testid=back-btn], [data-testid=voice-toggle], [data-testid=hint-btn]')) continue
        const r = e.getBoundingClientRect()
        if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && hit(r, 0)) out.push(`button ${name(e)} ${pct(r)}%`)
      }
      // 4. Fully on screen: below the fixed Back / Voice / Hint row, above the phone answer sheet.
      const top = Math.max(...Array.from(document.querySelectorAll('[data-testid=hint-btn], [data-testid=back-btn]')).map((e) => e.getBoundingClientRect().bottom))
      const dock = document.querySelector<HTMLElement>('[data-testid=mode-area] .action-dock')
      const floor = dock && getComputedStyle(dock).position === 'fixed' ? dock.getBoundingClientRect().top : window.innerHeight
      if (b.top < top - 0.5) out.push(`under the top buttons by ${Math.round(top - b.top)} px`)
      if (b.bottom > floor + 0.5) out.push(`below the floor by ${Math.round(b.bottom - floor)} px`)
      return out
    },
    { extra, CLEAR },
  )
}

/** Open (or advance) the hint and let placement + phone re-framing settle. */
async function hintTo(page: Page, tier: number) {
  await page.locator('[data-testid=hint-btn]').click()
  await expect(page.locator(`[data-testid=hint-bubble][data-tier="${tier}"]`)).toBeVisible()
  await page.waitForTimeout(1400) // bubble entry 0.4 s + phone re-frame at 450 / 1000 ms
}
async function settle(page: Page) {
  await expect(page.locator('[data-testid=hint-bubble]')).toBeVisible()
  await page.waitForTimeout(1400)
}

for (const vp of [PHONE, IPAD]) {
  const at = `${vp.width} px`

  test.describe(`hint placement, geometric (${at})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(vp)
      await seen(page)
    })

    test(`Dragon Oops find phase, hint 1–3: clear of the glowing row and Show me again (${at})`, async ({ page }) => {
      for (let deal = 0; deal < 3; deal++) {
        await page.goto('/multiplication/big?mode=oops&a=78&b=8')
        await phase(page, 'find')
        for (let tier = 1; tier <= 3; tier++) {
          await hintTo(page, tier)
          expect(await bubbleHits(page), `deal ${deal} tier ${tier}`).toEqual([])
        }
      }
    })

    test(`Dragon Oops fix phase after a wrong answer, then hint: clear of the oops row (${at})`, async ({ page }) => {
      await page.goto('/multiplication/big?mode=oops&a=78&b=8')
      await phase(page, 'find')
      // Tap rows top-down until the oops is found (rows built on it are below it).
      for (let i = 0; i < 6; i++) {
        if ((await page.locator('[data-phase="fix"]').count()) > 0) break
        await page.locator(`[data-testid=oops-row-${i}]`).click()
        await page.waitForTimeout(300)
      }
      await phase(page, 'fix')
      // Round 3: the row just above the oops is the context the child re-reads — keep it clear too.
      const k = Number((await page.locator('[data-testid^=oops-row-][data-active="1"]').getAttribute('data-testid'))!.split('-').pop())
      const context = k > 0 ? [`[data-testid=oops-row-${k - 1}]`] : []
      await pad(page, 1) // never right: every oops answer here is ≥ 2 digits
      await settle(page)
      expect(await bubbleHits(page, context), `after wrong (tier 2), oops row ${k}`).toEqual([])
      await hintTo(page, 3)
      expect(await bubbleHits(page, context), 'tier 3').toEqual([])
      await hintTo(page, 1)
      expect(await bubbleHits(page, context), 'tier 1').toEqual([])
    })

    test(`Step-by-Step 78 × 8, hint 1–3: clear of the glowing 8 (${at})`, async ({ page }) => {
      await page.goto('/multiplication/big?mode=column&a=78&b=8')
      await phase(page, 'ones')
      for (let tier = 1; tier <= 3; tier++) {
        await hintTo(page, tier)
        expect(await bubbleHits(page), `tier ${tier}`).toEqual([])
      }
    })

    test(`Flip & Split predict, hint 1–3: clear of the 3 × 42 rectangle (${at})`, async ({ page }) => {
      await page.goto('/multiplication/big?mode=flip&a=42&b=3')
      await phase(page, 'predict')
      for (let tier = 1; tier <= 3; tier++) {
        await hintTo(page, tier)
        expect(await bubbleHits(page, ['[data-testid=flip-rect]']), `tier ${tier}`).toEqual([])
      }
    })

    test(`Flip & Split 42 × 3 after a wrong answer, hint 1–3: clear of the side labels 40 | 2 and 3 (${at})`, async ({ page }) => {
      await page.goto('/multiplication/big?mode=flip&a=42&b=3')
      await phase(page, 'predict')
      await page.locator('[data-testid=predict-same]').click()
      await page.locator('[data-testid=flip-btn]').click()
      await phase(page, 'side')
      await page.locator('[data-testid=side-a]').click({ force: true })
      await page.locator('[data-testid=way-right]').click()
      await phase(page, 'tensPart')
      await pad(page, 12) // 4 × 3 — the "forgot the zero" slip → hint tier 2
      await settle(page)
      // Structural selectors (exist with or without data-keep-clear): the split labels + the 3.
      const labels = ['[data-testid=mode-area] span.flex.text-2xl.font-bold > span.text-center', '[data-testid=side-b]']
      expect(await bubbleHits(page, labels), 'after wrong (tier 2)').toEqual([])
      await hintTo(page, 3)
      expect(await bubbleHits(page, labels), 'tier 3').toEqual([])
      await hintTo(page, 1)
      expect(await bubbleHits(page, labels), 'tier 1').toEqual([])
    })

    test(`Break It Apart 78 × 8, hint 1–3: clear of the number to split (${at})`, async ({ page }) => {
      await page.goto('/multiplication/big?mode=split&a=78&b=8')
      await phase(page, 'split')
      for (let tier = 1; tier <= 3; tier++) {
        await hintTo(page, tier)
        expect(await bubbleHits(page), `tier ${tier}`).toEqual([])
      }
    })
  })
}

test.describe('Big Multiplication — CHECK round 2 regressions', () => {
  test('L1: the first tap on the new problem lands while the celebration is still fading out', async ({ page }) => {
    await seen(page)
    await page.goto('/multiplication/big?mode=split&a=21&b=3')
    await phase(page, 'split')
    await page.locator('[data-testid=split-number]').click({ force: true })
    await phase(page, 'left')
    await pad(page, 60)
    await phase(page, 'right')
    await pad(page, 3)
    await phase(page, 'add')
    await pad(page, 63)
    await expect(page.locator('[data-testid=celebration]')).toBeVisible()
    await page.waitForTimeout(600)
    await page.locator('[data-testid=next-btn]').click()
    await phase(page, 'split')
    // Tap the new number while the overlay is mid-exit. A real pointer tap at its centre
    // (mouse.click, no actionability wait) — exactly what a child's finger does.
    const r = await page.locator('[data-testid=split-number]').boundingBox()
    expect(r).not.toBeNull()
    await page.mouse.click(r!.x + r!.width / 2, r!.y + r!.height / 2)
    await phase(page, 'left')
  })

  test('Back clears the delayed streak chime: no oscillator starts after leaving', async ({ page }) => {
    await seen(page)
    await page.goto('/multiplication/big?mode=split&a=21&b=3')
    await phase(page, 'split')
    // Three first-try steps + the final answer: onSolved (800 ms after acceptance) plays correct()
    // and queues sfx.streak 350 ms later. Back lands inside that 350 ms.
    await page.locator('[data-testid=split-number]').click({ force: true })
    await phase(page, 'left')
    await pad(page, 60)
    await phase(page, 'right')
    await pad(page, 3)
    await phase(page, 'add')
    // In-page and synchronous: the moment the celebration mounts (= onSolved just ran and queued
    // the chime), record the oscillator count and tap Back. No Playwright round-trip in between.
    await page.evaluate(() => {
      const w = window as unknown as { __sfx: number; __atBack?: number }
      new MutationObserver((_, obs) => {
        if (!document.querySelector('[data-testid=celebration]')) return
        obs.disconnect()
        w.__atBack = w.__sfx
        document.querySelector<HTMLElement>('[data-testid=back-btn]')!.click()
      }).observe(document.body, { childList: true, subtree: true })
    })
    await pad(page, 63)
    await expect(page.locator('[data-screen=picker]')).toBeVisible()
    await page.waitForTimeout(900) // well past the 350 ms streak chime
    const { atBack, after } = await page.evaluate(() => {
      const w = window as unknown as { __sfx: number; __atBack?: number }
      return { atBack: w.__atBack ?? -1, after: w.__sfx }
    })
    expect(atBack, 'Back was tapped at the celebration').toBeGreaterThan(0)
    expect(after, 'oscillators started after Back').toBe(atBack)
  })

  test('L2: "Show me again" after a Story finale replays without the gem flight; count unchanged', async ({ page }) => {
    await seen(page)
    await page.goto('/multiplication/big?mode=story&a=21&b=3')
    await storyToAdd(page)
    await pad(page, 63)
    // The flying gems: fixed 💎 spans (selector works with or without the gem-flight test id).
    await expect(page.locator('span.fixed.pointer-events-none', { hasText: '💎' }).first()).toBeAttached({ timeout: 3_000 }) // first time: gems fly
    await expect(page.locator('[data-testid=story-next]')).toBeVisible({ timeout: 5_000 })
    const g = Number(await page.locator('[data-testid=hoard-count]').first().innerText())
    await page.locator('[data-testid=demo-again]').click()
    await page.locator('[data-testid=demo-skip]').click()
    await page.evaluate(() => {
      const w = window as unknown as { __flights: number }
      w.__flights = 0
      new MutationObserver(() => {
        if ([...document.querySelectorAll('span.fixed.pointer-events-none')].some((e) => e.textContent?.includes('💎'))) w.__flights++
      }).observe(document.body, { childList: true, subtree: true })
    })
    await storyToAdd(page)
    await pad(page, 63)
    await expect(page.locator('[data-testid=story-answer]')).toBeVisible() // the finale still plays
    await page.waitForTimeout(1500)
    expect(await page.evaluate(() => (window as unknown as { __flights: number }).__flights), 'gem flight on a credited replay').toBe(0)
    expect(Number(await page.locator('[data-testid=hoard-count]').first().innerText())).toBe(g)
  })
})
