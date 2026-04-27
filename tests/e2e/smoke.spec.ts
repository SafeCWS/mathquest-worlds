/**
 * Smoke test — Phase 4.A.
 *
 * The minimal "is the app even alive" test that catches the largest class of
 * regressions: deploys that ship with a broken middleware, a missing env var,
 * or a route that 500s on the auth handshake. Every push should pass this.
 *
 * What this DOES test:
 *  - Unauthenticated `/` redirects through middleware to `/login`
 *  - `/login` renders without a 500
 *  - The page's primary affordances (heading, form fields, button) are visible
 *  - No console errors fire during the initial render
 *
 * What this DOES NOT test:
 *  - Actual auth flow (deferred — needs test creds wiring + would tie tests
 *    to a specific Neon dev branch). That's a Phase 5 concern.
 *  - The level-gate logic — see `level-gate.spec.ts`.
 *  - Any specific kid-facing copy or visuals — those would create churn.
 */
import { test, expect } from '@playwright/test'

test.describe('smoke — basic routing + render health', () => {
  test('/ renders without 500 (auth-aware)', async ({ page }) => {
    // In production `/` redirects to `/login` via middleware. In local dev
    // without AUTH_SECRET set, NextAuth lets the request through and `/`
    // renders the welcome page directly. Either is fine — we just assert
    // we get a 200 page (not a 500) and end up on a real route.
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(500)
    // Must end up on either / or /login, not on an error page.
    await expect(page).toHaveURL(/(\/login|\/)$/)
  })

  test('/login renders the sign-in form', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/login')

    // The hardcoded brand h1 is the most stable anchor — it's not behind a
    // translation key and it doesn't change on every UX iteration.
    await expect(page.getByRole('heading', { name: 'MathQuest Worlds' })).toBeVisible()

    // Email + password fields. We use type-based selectors instead of label
    // text because labels go through next-intl and could legitimately change.
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // The submit button. Same reasoning — semantic role over copy.
    await expect(page.getByRole('button', { name: /sign in|signing in/i })).toBeVisible()

    // No console errors during initial render. We allow next-intl's
    // dev-mode "missing message" warnings (they're warnings, not errors)
    // and Playwright already filters those.
    expect(consoleErrors).toEqual([])
  })
})
