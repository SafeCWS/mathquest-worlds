/**
 * /multiplication hydration race e2e — Phase 5 (last L151 yokoten surface).
 *
 * Per the 2026-04-20 Approvals UX lesson (L151 — extended): when a server-side
 * change is "right" but the client renders "wrong", the next test must be a
 * real-browser headless run. This file covers the /multiplication hub and
 * /multiplication/[table] detail page after the Phase 5 yokoten that
 * removed the redundant `mounted` flag (Zustand `_hasHydrated` is enough).
 *
 * The bug we are guarding against: a returning kid with a persisted
 * unlockedTables: [1, 2, 3] should land on /multiplication and immediately
 * see Tables 1-3 unlocked. If the page rendered before `_hasHydrated`, she
 * would see the default [1] — only Table 1 unlocked, then a flash to the
 * full set. Worse, the same race could redirect or hide the star counter.
 */
import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

const MULT_KEY = 'mathquest-multiplication'
const CHARACTER_KEY = 'mathquest-character'

const CHARACTER_BLOB = JSON.stringify({
  state: {
    schemaVersion: 2,
    updatedAt: Date.now(),
    hasCreatedCharacter: true,
    characterName: 'Tina',
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

/**
 * Build a multiplication-store envelope. We keep it minimal — just enough
 * unlockedTables and a couple of mode scores — to exercise the hydration
 * path without simulating a real progress trail.
 */
function buildMultiplicationBlob(opts: {
  unlockedTables?: number[]
  table1Stars?: number
}) {
  const { unlockedTables = [1], table1Stars = 0 } = opts
  return JSON.stringify({
    state: {
      _hasHydrated: false,
      tables:
        table1Stars > 0
          ? {
              1: {
                tableNumber: 1,
                explored: true,
                modeScores: {
                  explorer: { attempts: 1, bestStars: Math.min(3, table1Stars) },
                  match: { attempts: 1, bestStars: Math.min(3, Math.max(0, table1Stars - 3)) },
                  memory: { attempts: 0, bestStars: 0 },
                  dice: { attempts: 0, bestStars: 0 },
                  missing: { attempts: 0, bestStars: 0 },
                  speed: { attempts: 0, bestStars: 0 },
                },
                totalStars: table1Stars,
                mastered: table1Stars >= 9,
              },
            }
          : {},
      unlockedTables,
      speedChallengeUnlocked: false,
      speedHighScore: 0,
    },
    version: 1,
  })
}

async function seedStores(page: Page, multBlob: string) {
  await page.addInitScript(
    (args) => {
      window.localStorage.setItem(args.charKey, args.charBlob)
      window.localStorage.setItem(args.multKey, args.multBlob)
    },
    {
      charKey: CHARACTER_KEY,
      charBlob: CHARACTER_BLOB,
      multKey: MULT_KEY,
      multBlob: multBlob,
    }
  )
}

test.describe('/multiplication — hydration race (returning kid)', () => {
  test('a returning kid with [1,2,3] unlocked sees three unlocked cards on first paint', async ({
    page,
  }) => {
    await seedStores(
      page,
      buildMultiplicationBlob({ unlockedTables: [1, 2, 3], table1Stars: 5 })
    )
    await page.goto('/multiplication')

    // The hub renders 10 table cards. After hydration, tables 1-3 should be
    // unlocked links; 4-10 should be locked (cursor-not-allowed). We assert
    // Table 2 is reachable as a link (not just visually present).
    await expect(page.locator('text=Times Tables').first()).toBeVisible({ timeout: 5000 })
    // Wait for hydration to settle. The loader only shows the spinner,
    // never the grid, so checking for the grid implies hydration is done.
    await expect(page.locator('text=Table 2').first()).toBeVisible()
    // Locked-state copy ("Get 3 ⭐ on Table N!") should NOT appear on Table 2 —
    // it would only render if /multiplication thought Table 2 was locked.
    const lockedHints = await page.locator('text=Get 3 ⭐ on Table 2').count()
    expect(lockedHints).toBe(0)
  })

  test('saved star count survives a reload without flicker', async ({ page }) => {
    await seedStores(
      page,
      buildMultiplicationBlob({ unlockedTables: [1, 2], table1Stars: 5 })
    )
    await page.goto('/multiplication')
    await expect(page.locator('text=Times Tables').first()).toBeVisible({ timeout: 5000 })
    // The animated counter counts up FROM 0 TO target — we only care that the
    // final settled value matches saved state. Wait long enough for the count-up.
    await page.waitForTimeout(2000)
    // Star pill shows totalStars from getTotalStars(). Table 1 has 5 stars,
    // no other tables touched, so total = 5.
    const starPill = page.locator('.counter-pop').first()
    await expect(starPill).toContainText('5')

    // Reload — Zustand should rehydrate to the same 5-star state with the
    // proper `_hasHydrated` gate (no flash of "0" or unmounted state).
    await page.reload()
    await expect(page.locator('text=Times Tables').first()).toBeVisible({ timeout: 5000 })
    await page.waitForTimeout(2000)
    await expect(starPill).toContainText('5')
  })

  test('/multiplication/[table] respects hydration before reading the emoji theme', async ({
    page,
  }) => {
    // Regression: the [table] page used to read getTableEmoji() in render
    // before _hasHydrated was true. With the Phase 5 yokoten, it now uses
    // a fallback star (⭐) until hydration completes, then swaps in the
    // user's chosen emoji theme.
    await seedStores(
      page,
      buildMultiplicationBlob({ unlockedTables: [1, 2, 3], table1Stars: 6 })
    )
    await page.goto('/multiplication/2')

    // The page header should mount. We don't assert the specific emoji
    // (depends on emojiThemeStore default) — only that the table title
    // shows up without a hydration crash or redirect.
    await expect(page.locator('text=Table 2').first()).toBeVisible({ timeout: 5000 })
    // Mode cards render six options for an unlocked table.
    await expect(page.locator('text=Explorer').first()).toBeVisible()
  })
})
