/**
 * Answer-not-leaked e2e — QC pass 2026-04-27.
 *
 * Per L151 (the 2026-04-20 Approvals lesson): when the bug is "the kid sees
 * the answer before they're supposed to," ONLY a real browser test catches
 * it. Curl can't see what's rendered. Unit tests of speakEquation() can't
 * see the JSX label that says "= 12" before the quiz fires.
 *
 * Each test verifies ONE failure mode the user reported on 2026-04-27:
 *   - Flip:   equation label reads "= ?" not "= 12" pre-feedback
 *   - Dice:   visual emoji groups hidden until HintButton tapped
 *   - Frog:   skip-count text "3, 6, 9" not visible until hint or feedback
 *   - Chart:  cell-tap TTS uses chosen-emoji name (mocked SpeechSynthesis)
 *
 * Pre-seeding pattern lifted from level-gate.spec.ts. Auth is dev-mode
 * permissive so we don't need a fake login flow.
 */
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

const STORAGE_KEY = 'mathquest-progress'
const CHARACTER_KEY = 'mathquest-character'

const CHARACTER_BLOB = JSON.stringify({
  state: {
    schemaVersion: 2,
    updatedAt: Date.now(),
    hasCreatedCharacter: true,
    characterName: 'Tester',
    avatarStyle: 'explorer',
    primaryColor: '#4A90D9',
    bodyType: 'body-2',
    skinTone: '#FFDFC4',
    hairStyle: 'hair-medium',
    hairColor: '#8B4513',
    eyeShape: 'eye-round',
    eyeColor: '#4A4A4A',
    outfit: 'outfit-casual',
    accessories: [],
    petBuddy: 'pet-none',
    effects: [],
  },
  version: 2,
})

const PROGRESS_BLOB = JSON.stringify({
  state: {
    _hasHydrated: false,
    totalStars: 999,
    currentStreak: 0,
    longestStreak: 0,
    lastPlayDate: null,
    moduleProgress: {},
    completedLevels: [],
    levelGateProgress: {},
    questionsAnsweredToday: 0,
    correctAnswersToday: 0,
    diagnosticResult: null,
    skillLevel: 'beginner',
  },
  version: 2,
})

async function seed(page: Page) {
  await page.addInitScript(
    (args) => {
      window.localStorage.setItem(args.charKey, args.charBlob)
      window.localStorage.setItem(args.progKey, args.progBlob)
    },
    {
      charKey: CHARACTER_KEY,
      charBlob: CHARACTER_BLOB,
      progKey: STORAGE_KEY,
      progBlob: PROGRESS_BLOB,
    },
  )
}

test.describe('answer-not-leaked — pre-quiz answer hiding', () => {
  test('Flip: equation label shows "= ?" not the product before feedback', async ({ page }) => {
    await seed(page)
    await page.goto('/multiplication/3/flip')

    // The equation label is the surfaced answer-leak point. Pre-flip we
    // should see "3 x 4 = ?" or similar with the literal "?" — never the
    // numeric product.
    const label = page.locator('text=/\\d+ x \\d+ = \\?/').first()
    await expect(label).toBeVisible({ timeout: 10000 })

    // Stronger guard: assert the pre-quiz DOM does NOT contain "= 12" or
    // any other "= <number>" pattern. The MIN possible product (1x1=1) and
    // MAX (10x10=100) are both numeric, so we can grep for the negative
    // match across the whole page body.
    const body = await page.locator('body').textContent()
    expect(body).not.toMatch(/= \d+ /) // pre-quiz: NO "= 12 " etc.
  })

  test('Dice: visual emoji groups hidden until HintButton tapped', async ({ page }) => {
    await seed(page)
    await page.goto('/multiplication/3/dice')

    // Click "Roll!" to trigger the visual phase.
    await page.getByRole('button', { name: /roll/i }).click()

    // Wait for the visual phase container to render (1.5s rolling animation).
    const groupsContainer = page.locator('[data-testid="visual-groups"]')
    await expect(groupsContainer).toBeVisible({ timeout: 5000 })

    // Pre-hint: the container exists but the inner VisualMultiplication is
    // empty (visualProps = all-false at hintLevel 0). We assert via the
    // data-hint-level attribute being "0".
    await expect(groupsContainer).toHaveAttribute('data-hint-level', '0')

    // The pre-hint container should NOT show emoji rows (no "groups of"
    // text). We use a partial-text negative match on the container itself.
    const groupsText = await groupsContainer.textContent()
    expect(groupsText).not.toMatch(/groups of/i)

    // Tap the HintButton to advance to hintLevel 1 (addition bridge).
    await page.getByRole('button', { name: /show me/i }).click()

    // Now the container should have data-hint-level="1" and show some
    // hint content (an addition bridge — the "+" sign).
    await expect(groupsContainer).toHaveAttribute('data-hint-level', '1')
  })

  test('Frog: skip-count text hidden until hint tapped', async ({ page }) => {
    await seed(page)
    await page.goto('/multiplication/3/numberline')

    // Wait for the round to load (Hop button visible).
    const hopButton = page.getByRole('button', { name: /hop/i })
    await expect(hopButton).toBeVisible({ timeout: 10000 })

    // Tap Hop once. Pre-hint, the running skip-count text should NOT be
    // visible — that text was the user's specific complaint ("3, 6, 9, 12
    // showing telegraphs the answer").
    await hopButton.click()

    // The skip-count text element has data-testid="skip-count-text".
    // Pre-hint AND pre-target it should have count(0).
    const skipText = page.locator('[data-testid="skip-count-text"]')
    await expect(skipText).toHaveCount(0)
  })

  test('Chart (Table 6): cell-tap TTS speaks the chosen emoji name', async ({ page }) => {
    await seed(page)

    // Stub SpeechSynthesisUtterance so we can capture what's spoken.
    await page.addInitScript(() => {
      ;(window as unknown as { __spokenTexts: string[] }).__spokenTexts = []
      const RealUtterance = window.SpeechSynthesisUtterance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).SpeechSynthesisUtterance = function (text: string) {
        ;(window as unknown as { __spokenTexts: string[] }).__spokenTexts.push(text)
        return new RealUtterance(text)
      }
      // Make speak() a no-op so the captured utterance never actually runs.
      const realSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis)
      window.speechSynthesis.speak = (() => {
        // Don't actually speak — we already captured the text on construction.
      }) as typeof realSpeak
    })

    // Table 6 — DEFAULT_EMOJIS[6] = '🎈' which maps to 'balloons'.
    await page.goto('/multiplication/6/chart')

    // Wait for any of the question-mark cells to render then tap one.
    // The cells have an infinite scale-pulse animation, so Playwright's
    // stability check would time out. force:true bypasses it — the cell
    // is visible and interactive, just permanently animating.
    const questionCell = page.locator('button', { hasText: '?' }).first()
    await expect(questionCell).toBeVisible({ timeout: 10000 })
    await questionCell.click({ force: true })

    // Drain the captured utterances.
    const spoken = await page.evaluate(
      () => (window as unknown as { __spokenTexts: string[] }).__spokenTexts,
    )

    // The cell-tap TTS includes the plural emoji name. For table 6 with the
    // default 🎈 emoji that's "balloons". This is the assertion that catches
    // audio/visual mismatch regressions.
    const allText = spoken.join(' | ')
    expect(allText).toContain('balloons')

    // And the cell-tap text should NEVER speak the product directly — it
    // says "How many balloons?" not "How many is N?".
    expect(allText).not.toMatch(/equals \d+/i)
  })

  test('Chart (Table 6, custom emoji): no hydration mismatch + spoken name matches custom theme', async ({
    page,
  }) => {
    // Regression guard added 2026-04-27 PACA G2 — same shape as the Apr-19
    // React.memo silent-damage bug (MEMORY.md "Visual overhaul silent damage
    // Mar 19-24"). Without the _hasHydrated gate in TimesTableChart, the
    // SSR pass renders the default 🎈/'balloons' name, then the client
    // rehydrates to 🚀/'rockets', producing a React hydration warning.
    await seed(page)

    // Pre-seed a custom emoji for table 6 (the default is 🎈 → 'balloons',
    // we override to 🚀 → 'rockets'). The store's persist key is
    // 'mathquest-emoji-theme'.
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'mathquest-emoji-theme',
        JSON.stringify({
          state: {
            _hasHydrated: false,
            customEmojis: { 6: '🚀' },
          },
          version: 1,
        }),
      )
    })

    // Stub SpeechSynthesisUtterance so we can capture what's spoken.
    await page.addInitScript(() => {
      ;(window as unknown as { __spokenTexts: string[] }).__spokenTexts = []
      const RealUtterance = window.SpeechSynthesisUtterance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).SpeechSynthesisUtterance = function (text: string) {
        ;(window as unknown as { __spokenTexts: string[] }).__spokenTexts.push(text)
        return new RealUtterance(text)
      }
      const realSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis)
      window.speechSynthesis.speak = (() => {
        // No-op — capture happens on Utterance construction.
      }) as typeof realSpeak
    })

    // NOTE — scope of this assertion: we capture React hydration warnings
    // and filter for ones referencing the emoji-name path specifically. A
    // separate pre-existing Math.random()-in-useState hydration mismatch in
    // generateCells() is a known-but-out-of-scope issue (TD flagged in the
    // PACA G2 loop report — see report's "TD-flagged items"). Filtering on
    // emoji-name keywords keeps this test focused on the fix this loop
    // delivered without conflating bug surfaces.
    const emojiHydrationWarnings: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const txt = msg.text()
        if (
          /hydrat|did not match/i.test(txt) &&
          /balloon|rocket|emoji|thing/i.test(txt)
        ) {
          emojiHydrationWarnings.push(txt)
        }
      }
    })
    page.on('pageerror', (err) => {
      if (
        /hydrat|did not match/i.test(err.message) &&
        /balloon|rocket|emoji|thing/i.test(err.message)
      ) {
        emojiHydrationWarnings.push(err.message)
      }
    })

    await page.goto('/multiplication/6/chart')

    // Wait for the chart to render — this is past hydration.
    const questionCell = page.locator('button', { hasText: '?' }).first()
    await expect(questionCell).toBeVisible({ timeout: 10000 })

    // The intro speak() useEffect re-fires when emojiName.plural changes
    // (from 'things' on first SSR/pre-hydration paint to 'rockets' once
    // _hasHydrated flips). Give it a beat to settle.
    await page.waitForTimeout(800)

    await questionCell.click({ force: true })
    await page.waitForTimeout(200)

    // Drain captured utterances.
    const spoken = await page.evaluate(
      () => (window as unknown as { __spokenTexts: string[] }).__spokenTexts,
    )
    const allText = spoken.join(' | ')

    // The custom-emoji name MUST appear in the spoken transcript. Either the
    // intro line ("with rockets!") or the cell-tap line ("How many rockets?")
    // satisfies the assertion. This is the load-bearing assertion that
    // catches the emoji-name hydration regression.
    expect(allText).toContain('rockets')

    // Conversely: the default 'balloons' should NOT appear in spoken text —
    // that would mean the page rendered with the default theme post-hydration,
    // ignoring the kid's customization.
    expect(allText).not.toContain('balloons')

    // And: NO emoji-name hydration mismatch warnings fired during the load.
    // (Other hydration warnings, e.g., from Math.random() in generateCells,
    // are out of scope — see TD note above.)
    expect(emojiHydrationWarnings, emojiHydrationWarnings.join('\n')).toEqual(
      [],
    )
  })
})
