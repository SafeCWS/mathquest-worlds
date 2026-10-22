/**
 * Real-backend sign-in (no mocks): /login → POST /api/otp/request → type the
 * dev-only OTP_TEST_CODE → next-auth credentials → signed-in session cookie.
 * Saved to AUTH_STATE so every chromium spec starts signed in.
 * Synthetic allowlist only (playwright.config.ts webServer env).
 */
import { test as setup, expect } from '@playwright/test'
import { AUTH_STATE, E2E_EMAIL, E2E_OTP_CODE } from '../../playwright.config'

setup('real sign-in with the email code lands signed in', async ({ page }) => {
  setup.setTimeout(90_000)
  await page.goto('/login?callbackUrl=%2Fmultiplication')
  await page.locator('input[type=email]').fill(E2E_EMAIL)
  await page.getByRole('button', { name: 'Send my code' }).click()
  await expect(page.locator('[data-step=code]')).toBeVisible({ timeout: 30_000 })

  const boxes = page.locator('input[inputmode=numeric]')
  for (let i = 0; i < 6; i++) await boxes.nth(i).pressSequentially(E2E_OTP_CODE[i])

  await page.waitForURL('**/multiplication', { timeout: 30_000 })
  await expect(page.locator('[data-testid=big-mult-tile]')).toBeVisible({ timeout: 30_000 })

  // The session is real: the JWT cookie is set and /api/auth/session names the user.
  const session = await page.request.get('/api/auth/session')
  expect((await session.json())?.user?.email).toBe(E2E_EMAIL)

  await page.context().storageState({ path: AUTH_STATE })
})
