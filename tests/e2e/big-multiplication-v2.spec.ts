/**
 * Big Multiplication v2 e2e — approved G1.5 prototype ~/prototypes/mathquest-worlds-big-mult-otp
 * (2026-10-22, probe "Same rectangle, same gems"). Flows mirror the prototype's shots.js.
 *
 * Covers:
 *   - picker v2: Break It Apart, Step-by-Step, Story Missions, Flip & Split, Dragon Oops (Extra);
 *     Block Builder + Quick Guess gone
 *   - Story Missions 42 × 3 happy path (slots → pick × → bar → split → answer → hoard +3) and its
 *     amber wrong-tap hint
 *   - Flip & Split 42 × 3 happy path (predict → flip → 40 + 2 → solve → confirm) and its amber
 *     dropped-zero hint
 *   - Dragon Oops 42 × 3 happy path (find → fix) and its amber "that is the dragon's number" hint
 *   - voice toggle: control run proves the speech stub counts; muted, all three new walkthroughs
 *     say nothing and the sfx graph ends at gain 0
 *   - 3 Level-1 games of Flip & Split open Level 2 (unlock through a new game)
 *   - a returning player whose last game was Block Builder / Quick Guess lands on the picker
 *
 * Every browser is silent (./silence). Synthetic data only.
 */
import { test, expect } from './silence'
import type { Page } from '@playwright/test'
import type { SilentWindow } from './silence'

const BIG_KEY = 'mathquest-big-multiplication'
const MODES = ['split', 'column', 'story', 'flip', 'oops'] as const

async function skipWalkthroughs(page: Page, modes: readonly string[] = MODES) {
  await page.addInitScript((ms) => {
    for (const m of ms) window.localStorage.setItem(`mq-big-walkthrough-${m}`, '1')
  }, [...modes])
}

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

async function hoard(page: Page): Promise<number> {
  await expect(page.locator('[data-testid=hoard-count]').first()).toBeVisible({ timeout: 10_000 })
  return Number((await page.locator('[data-testid=hoard-count]').first().innerText()).trim())
}

/** The hint bubble is amber and nothing in the play area or the bubble wears a red class. */
async function expectAmberHint(page: Page) {
  const hint = page.locator('[data-testid=hint-bubble]')
  await expect(hint).toBeVisible()
  await expect(hint).toHaveClass(/amber/)
  const red = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid=mode-area] *, [data-testid=hint-bubble]')].some((e) =>
      /(^|\s)(bg|text|border|ring)-red-/.test(e.getAttribute('class') || ''),
    ),
  )
  expect(red).toBe(false)
}

/** Dragon Oops: does this step's arithmetic hold? */
function holds(t: string): boolean {
  let m: RegExpMatchArray | null
  if ((m = t.match(/^(\d+) = (\d+) \+ (\d+)$/))) return +m[1] === +m[2] + +m[3] && +m[2] % 10 === 0
  if ((m = t.match(/^(\d+) × (\d+) = (\d+)$/))) return +m[1] * +m[2] === +m[3]
  if ((m = t.match(/^(\d+) \+ (\d+) = (\d+)$/))) return +m[1] + +m[2] === +m[3]
  if ((m = t.match(/^(\d+): write (\d+), carry (\d+)$/))) return Math.floor(+m[1] / 10) === +m[3] && +m[1] % 10 === +m[2]
  return true // "Answer: N" is built from the steps above it
}
function fixFor(t: string): number {
  let m: RegExpMatchArray | null
  if ((m = t.match(/^(\d+) = (\d+) \+ (\d+)$/))) return +m[1] - +m[3]
  if ((m = t.match(/^(\d+) × (\d+) = (\d+)$/))) return +m[1] * +m[2]
  if ((m = t.match(/^(\d+) \+ (\d+) = (\d+)$/))) return +m[1] + +m[2]
  if ((m = t.match(/^(\d+): write (\d+), carry (\d+)$/))) return Math.floor(+m[1] / 10)
  throw new Error('no fix for ' + t)
}
/** The number the dragon wrote in that step (what a child copying it would type). */
function dragonValue(t: string): number {
  const split = t.match(/^(\d+) = (\d+) \+ (\d+)$/)
  if (split) return +split[2]
  const carry = t.match(/carry (\d+)$/)
  if (carry) return +carry[1]
  return Number(t.match(/(\d+)\s*$/)![1])
}

/** Solve whatever Flip & Split problem is on screen (the card starts as b × a). */
async function solveFlip(page: Page) {
  await phase(page, 'predict')
  const [b, a] = (await page.locator('[data-testid=flip-equation]').innerText()).split('×').map((x) => Number(x.trim()))
  await page.locator('[data-testid=predict-same]').click()
  await page.locator('[data-testid=flip-btn]').click()
  await phase(page, 'side')
  await page.locator('[data-testid=side-a]').click({ force: true }) // pulses forever
  await phase(page, 'splitWay')
  await page.locator('[data-testid=way-right]').click()
  const tens = Math.floor(a / 10) * 10 * b
  const ones = (a % 10) * b
  await phase(page, 'tensPart')
  await pad(page, tens)
  await phase(page, 'onesPart')
  await pad(page, ones)
  await phase(page, 'add')
  await pad(page, tens + ones)
  await phase(page, 'confirm')
  await page.locator('[data-testid=flip-check]').click()
  await expect(page.locator('[data-testid=celebration]')).toBeVisible()
}

const counts = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as SilentWindow
    return { speak: w.__speak.length, cancel: w.__cancel }
  })
const resetCounts = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as SilentWindow
    w.__speak = []
    w.__cancel = 0
  })

test.describe('/multiplication/big v2', () => {
  test('picker v2: the 5 games in order, Block Builder + Quick Guess gone, hoard shown', async ({ page }) => {
    await skipWalkthroughs(page)
    await page.goto('/multiplication/big')
    await expect(page.locator('[data-screen=picker]')).toBeVisible({ timeout: 15_000 })
    const modes = await page
      .locator('[data-testid^=mode-]:not([data-testid=mode-grid]):not([data-testid=mode-area])')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')))
    expect(modes).toEqual(['mode-split', 'mode-column', 'mode-story', 'mode-flip', 'mode-oops'])
    await expect(page.locator('[data-testid=mode-blocks], [data-testid=mode-guess]')).toHaveCount(0)
    await expect(page.locator('[data-testid=mode-oops] [data-testid=new-ribbon]')).toHaveCount(1)
    await expect(page.locator('[data-testid=hoard-chip]')).toBeVisible()
  })

  test('Story Missions 42 × 3: wrong tap → amber hint, then slots → × → bar → split → 126, hoard +3', async ({ page }) => {
    await skipWalkthroughs(page)
    await page.goto('/multiplication/big')
    const start = await hoard(page)
    await page.goto('/multiplication/big?mode=story&a=42&b=3')
    await phase(page, 'read')
    await expect(page.locator('[data-testid=problem]')).toHaveCount(0) // header does not give 42 × 3 away
    expect(await page.locator('[data-testid=mode-area] [data-obj]').count()).toBeLessThanOrEqual(15)
    await page.locator('[data-testid=story-go]').click()
    await phase(page, 'slots')

    await page.locator('[data-testid=chip-42]').click() // 42 in the "groups" slot: swapped on purpose
    await expectAmberHint(page)
    expect(await hoard(page)).toBe(start) // a wrong tap never takes gems
    await page.locator('[data-testid=hint-close]').click()

    await page.locator('[data-testid=chip-3]').click()
    await page.locator('[data-testid=chip-42]').click()
    await phase(page, 'pick')
    await page.locator('[data-testid=card-add]').click()
    await expect(page.locator('[data-testid=hint-bubble][data-tier="2"]')).toBeVisible()
    await phase(page, 'pick') // "+" rejected, still picking
    await page.locator('[data-testid=hint-close]').click()
    await page.locator('[data-testid=card-mul]').click()
    await phase(page, 'bar')
    await expect(page.locator('[data-obj=bar]')).toHaveCount(3)
    await page.locator('[data-testid=story-solve]').click()
    await phase(page, 'split')
    await page.locator('[data-testid=split-number]').click({ force: true })
    await phase(page, 'left')
    await pad(page, 120)
    await phase(page, 'right')
    await pad(page, 6)
    await phase(page, 'add')
    await pad(page, 126)
    await phase(page, 'finale')
    await expect(page.locator('[data-testid=story-answer]')).toContainText(/126 \S+/)
    await expect(page.locator('[data-testid=bar-total]')).toHaveText('3 × 42 = 126')
    // Gems fly first; progress (+3) is recorded ~1 s later, when Next story appears.
    await expect(page.locator('[data-testid=story-next]')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('[data-testid=celebration]')).toHaveCount(0) // story keeps its own finale
    await expect.poll(() => hoard(page)).toBe(start + 3)

    await page.locator('[data-testid=story-next]').click()
    await phase(page, 'read')
    await page.reload()
    await phase(page, 'read')
    expect(await hoard(page)).toBe(start + 3) // the hoard is persisted and never goes down
  })

  test('Flip & Split 42 × 3: predict → flip → 40 + 2 → solve → confirm; dropped zero → amber hint', async ({ page }) => {
    await skipWalkthroughs(page)
    await page.goto('/multiplication/big?mode=flip&a=42&b=3')
    await phase(page, 'predict')
    await expect(page.locator('[data-testid=flip-equation]')).toHaveText('3 × 42')
    await expect(page.locator('[data-testid=problem]')).toHaveCount(0)
    const start = await hoard(page)

    await page.locator('[data-testid=predict-same]').click()
    await page.locator('[data-testid=flip-btn]').click()
    await phase(page, 'side')
    await expect(page.locator('[data-testid=flip-equation]')).toHaveText('42 × 3')
    await expect(page.getByText('Same rectangle, same gems!')).toBeVisible()
    await page.locator('[data-testid=side-a]').click({ force: true })
    await phase(page, 'splitWay')
    await page.locator('[data-testid=way-right]').click()
    await phase(page, 'tensPart')

    await pad(page, 12) // dropped a zero
    await expectAmberHint(page)
    const h = await page.locator('[data-testid=hint-bubble]').innerText()
    expect(h).toMatch(/zero|not 4/i)
    expect(h).not.toContain('126') // a hint never gives the final answer
    await phase(page, 'tensPart') // no progress lost

    await pad(page, 120)
    await phase(page, 'onesPart')
    await pad(page, 6)
    await phase(page, 'add')
    await pad(page, 126)
    await phase(page, 'confirm')
    const c = await page.locator('[data-testid=flip-confirm]').innerText()
    expect(c).toContain('3 × 42 = 126')
    expect(c).toContain('42 × 3 = 126')
    await page.locator('[data-testid=flip-check]').click()
    await expect(page.locator('[data-testid=celebration]')).toBeVisible()
    expect(await hoard(page)).toBe(start + 3)
  })

  test("Dragon Oops 42 × 3: find the wrong step, typing the dragon's number → amber hint, fix it", async ({ page }) => {
    await skipWalkthroughs(page)
    await page.goto('/multiplication/big?mode=oops&a=42&b=3')
    await phase(page, 'find')
    const start = await hoard(page)
    const texts = await page.locator('[data-testid^=oops-text-]').evaluateAll((els) => els.map((e) => (e.textContent ?? '').trim()))
    const w = texts.findIndex((t) => !holds(t))
    expect(w, `one broken step in ${texts.join(' | ')}`).toBeGreaterThanOrEqual(0)
    for (let i = 0; i < w; i++) await page.locator(`[data-testid=oops-row-${i}]`).click()
    await expect(page.locator('[data-state=ok]')).toHaveCount(w)
    await page.locator(`[data-testid=oops-row-${w}]`).click()
    await phase(page, 'fix')

    await pad(page, dragonValue(texts[w]))
    await expectAmberHint(page)
    await expect(page.locator('[data-testid=hint-bubble]')).toContainText(/dragon/i)
    await phase(page, 'fix')

    await pad(page, fixFor(texts[w]))
    await phase(page, 'fixed')
    const after = await page.locator('[data-testid^=oops-text-]').evaluateAll((els) => els.map((e) => (e.textContent ?? '').trim()))
    expect(after.every(holds), after.join(' | ')).toBe(true)
    await expect(page.locator('[data-testid=celebration]')).toBeVisible({ timeout: 10_000 })
    expect(await hoard(page)).toBe(start + 3)
  })

  test('voice ON control: the story walkthrough speaks (proves the stub counts) and highlights words', async ({ page }) => {
    await page.goto('/multiplication/big?mode=story&a=42&b=3')
    await expect(page.locator('[data-testid=demo-banner]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-reading="1"]')).toHaveCount(1, { timeout: 5_000 })
    await expect(page.locator('[data-testid=mode-area][data-demo="0"]')).toHaveCount(1, { timeout: 10_000 })
    expect((await counts(page)).speak).toBeGreaterThan(0)
  })

  test('voice OFF: mute cancels speech, persists, and the 3 new walkthroughs say nothing; sfx at gain 0', async ({ page }) => {
    await skipWalkthroughs(page, ['column'])
    await page.goto('/multiplication/big?mode=column&a=42&b=3')
    await phase(page, 'ones')
    const toggle = page.locator('[data-testid=voice-toggle]')
    await expect(toggle).toHaveAttribute('data-voice', 'on')
    await resetCounts(page)
    await toggle.click()
    await expect(toggle).toHaveAttribute('data-voice', 'off')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(toggle).toHaveAttribute('aria-label', 'Voice off — tap to turn on')
    const c0 = await counts(page)
    expect(c0.cancel).toBeGreaterThanOrEqual(1)
    expect(c0.speak).toBe(0)
    expect(await page.evaluate(() => localStorage.getItem('mq-big-voice'))).toBe('off')

    await page.locator('[data-testid=hint-btn]').click()
    await expect(page.locator('[data-testid=hint-bubble]')).toBeVisible()
    await expect(page.locator('[data-testid=hint-read-it]')).toHaveCount(0) // no "Read it" while muted

    for (const [m, done] of [['story', 'slots'], ['flip', 'flip'], ['oops', 'find']] as const) {
      await page.goto(`/multiplication/big?mode=${m}&a=42&b=3`)
      await expect(page.locator('[data-testid=demo-banner]')).toBeVisible({ timeout: 15_000 })
      await expect(toggle).toHaveAttribute('data-voice', 'off') // survives navigation
      await expect(page.locator('[data-testid=mode-area][data-demo="0"]')).toHaveCount(1, { timeout: 10_000 })
      await phase(page, done)
      await page.waitForTimeout(500)
      expect((await counts(page)).speak, `${m} walkthrough while muted`).toBe(0)
      if (m === 'story') await expect(page.locator('[data-reading="1"]')).toHaveCount(0)
    }

    const audio = await page.evaluate(() => {
      const ac = new window.AudioContext()
      const d = ac.destination as unknown as GainNode
      return { muted: d instanceof GainNode && d.gain.value === 0 }
    })
    expect(audio.muted).toBe(true)
  })

  test('unlock through a new game: 3 Level-1 games of Flip & Split open Level 2', async ({ page }) => {
    test.setTimeout(300_000)
    await skipWalkthroughs(page)
    await page.goto('/multiplication/big')
    await expect(page.locator('[data-screen=picker]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid=level-2][aria-disabled=true]')).toHaveCount(1)
    const start = await hoard(page)
    for (let game = 0; game < 3; game++) {
      await page.locator('[data-testid=mode-flip]').click()
      for (let p = 0; p < 3; p++) {
        await solveFlip(page)
        await page.locator('[data-testid=next-btn]').click()
      }
      await expect(page.locator('[data-screen=picker]')).toBeVisible()
    }
    await expect(page.locator('[data-testid=level-2][aria-disabled=false]')).toHaveCount(1)
    expect(await hoard(page)).toBe(start + 27)
    await page.reload()
    await expect(page.locator('[data-testid=level-2][aria-disabled=false]')).toHaveCount(1, { timeout: 15_000 })
  })

  test('returning player whose last game was Block Builder / Quick Guess lands on the picker, progress kept', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    // A v1 save plus extra legacy fields and the old walkthrough keys.
    await page.addInitScript(
      ({ key, blob }) => {
        window.localStorage.setItem(key, blob)
        for (const m of ['blocks', 'guess']) window.localStorage.setItem(`mq-big-walkthrough-${m}`, '1')
      },
      { key: BIG_KEY, blob: JSON.stringify({ state: { gamesDone: { 1: 3, 2: 1, 3: 0 }, mode: 'blocks', lastMode: 'guess' }, version: 1 }) },
    )
    for (const legacy of ['blocks', 'guess']) {
      await page.goto(`/multiplication/big?mode=${legacy}&a=42&b=3`)
      await expect(page.locator('[data-screen=picker]')).toBeVisible({ timeout: 15_000 })
      await expect(page.locator('[data-testid=mode-area]')).toHaveCount(0)
      await expect(page.locator('[data-testid=level-2][aria-disabled=false]')).toHaveCount(1)
    }
    await page.goto('/multiplication/big')
    await expect(page.locator('[data-screen=picker]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-testid=level-2][aria-disabled=false]')).toHaveCount(1)
    await page.locator('[data-testid=mode-flip]').click()
    await phase(page, 'predict')
    expect(errors).toEqual([])
  })
})
