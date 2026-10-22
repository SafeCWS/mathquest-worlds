/**
 * OTP sign-in UI e2e — approved G1.5 prototype (2026-10-22).
 *
 * UI-only: /api/otp/request and the next-auth credentials round-trip are stubbed
 * with route interception, so this spec proves the screen honours the contract:
 *   POST /api/otp/request {email} → 200 {ok, message, resendAfterSec}
 *   signIn('credentials', {email, code, redirect:false}) → result.code is
 *   'invalid' for every rejected code (one message, no tries-left — 2026-10-22).
 * The backend (lib/auth, app/api/otp) has its own tests. Synthetic email only.
 */
import { test, expect } from '@playwright/test'
import type { Page, Route } from '@playwright/test'

const EMAIL = 'parent@example.com'
const INVALID = "That code didn't work — check your email or get a new code."

type Verdict = 'ok' | 'invalid'

async function stubAuth(page: Page, verdicts: Verdict[]) {
  const requests: Array<Record<string, unknown>> = []
  await page.route('**/api/otp/request', async (route: Route) => {
    requests.push(JSON.parse(route.request().postData() || '{}'))
    await route.fulfill({ json: { ok: true, message: 'If that email is on the list, a code is on its way.', resendAfterSec: 60 } })
  })
  await page.route('**/api/auth/providers', (route) =>
    route.fulfill({ json: { credentials: { id: 'credentials', name: 'Credentials', type: 'credentials', signinUrl: '', callbackUrl: '' } } }),
  )
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { csrfToken: 'test-csrf' } }))
  await page.route('**/api/auth/session', (route) => route.fulfill({ json: {} }))
  const posted: string[] = []
  await page.route('**/api/auth/callback/credentials**', async (route) => {
    posted.push(route.request().postData() || '')
    const v = verdicts.shift() ?? 'invalid'
    const origin = new URL(route.request().url()).origin
    const url = v === 'ok' ? `${origin}/` : `${origin}/login?error=CredentialsSignin&code=${v}`
    await route.fulfill({ json: { url } })
  })
  return { requests, posted }
}

async function toCodeStep(page: Page) {
  await page.goto('/login')
  await page.locator('input[type=email]').fill(EMAIL)
  await page.getByRole('button', { name: 'Send my code' }).click()
  await expect(page.locator('[data-step=code]')).toBeVisible()
}

async function typeCode(page: Page, code: string) {
  const boxes = page.locator('input[inputmode=numeric]')
  for (let i = 0; i < code.length; i++) await boxes.nth(i).pressSequentially(code[i])
}

test.describe('/login — email code sign-in', () => {
  // This screen is used logged out; drop the session the setup project saved.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('step 1 → step 2: six numeric boxes, one-time-code autofill, resend countdown, no prototype banner', async ({ page }) => {
    const { requests } = await stubAuth(page, [])
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'MathQuest Worlds' })).toBeVisible()
    await expect(page.locator('input[type=password]')).toHaveCount(0)
    await page.locator('input[type=email]').fill(EMAIL)
    await page.getByRole('button', { name: 'Send my code' }).click()

    await expect(page.locator('[data-step=code]')).toBeVisible()
    expect(requests).toEqual([{ email: EMAIL }])
    const boxes = page.locator('input[inputmode=numeric]')
    await expect(boxes).toHaveCount(6)
    await expect(page.locator('input[autocomplete=one-time-code]')).toHaveCount(1)
    await expect(page.getByTestId('login-notice')).toHaveText('If that email is on the family list, a code is on its way.')
    await expect(page.getByText(`Check the inbox for ${EMAIL}`)).toBeVisible()
    await expect(page.getByRole('button', { name: /Resend code in \d+ s/ })).toBeDisabled()
    await expect(page.getByTestId('proto-banner')).toHaveCount(0)
    await expect(page.getByText(/PROTOTYPE/)).toHaveCount(0)

    // typing auto-advances
    await boxes.nth(0).pressSequentially('1')
    await boxes.nth(1).pressSequentially('2')
    const focused = await page.evaluate(() => [...document.querySelectorAll('input[inputmode=numeric]')].indexOf(document.activeElement as HTMLInputElement))
    expect(focused).toBe(2)

    // back to step 1
    await page.getByRole('button', { name: 'Use a different email' }).click()
    await expect(page.locator('[data-step=email]')).toBeVisible()
  })

  test('rejected code → one amber message, boxes cleared, box 1 focused; right code → signed in and away', async ({ page }) => {
    const { posted } = await stubAuth(page, ['invalid', 'ok'])
    await toCodeStep(page)
    await typeCode(page, '000000')
    const notice = page.getByTestId('login-notice')
    await expect(notice).toHaveText(INVALID)
    await expect(notice).not.toContainText(/tr(y|ies) left/)
    await expect(notice).toHaveAttribute('data-tone', 'warn')
    await expect(notice).toHaveClass(/amber/)
    await expect(notice).not.toHaveClass(/red/)
    for (let i = 0; i < 6; i++) await expect(page.locator('input[inputmode=numeric]').nth(i)).toHaveValue('')
    await expect(page.locator('input[inputmode=numeric]').first()).toBeFocused()
    await expect(page.getByRole('button', { name: /Resend code in \d+ s/ })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Use a different email' })).toBeVisible()
    expect(new URLSearchParams(posted[0]).get('code')).toBe('000000')
    expect(new URLSearchParams(posted[0]).get('email')).toBe(EMAIL)

    const leaving = page.waitForRequest((r) => r.isNavigationRequest() && new URL(r.url()).pathname === '/')
    await typeCode(page, '424242')
    await expect(notice).toHaveText('Signed in. Opening MathQuest…')
    await leaving
  })

  test('paste all six digits into the first box submits once', async ({ page }) => {
    const { posted } = await stubAuth(page, ['invalid'])
    await toCodeStep(page)
    await page.locator('input[inputmode=numeric]').first().focus()
    await page.evaluate(() => {
      const dt = new DataTransfer()
      dt.setData('text', '13 57 91')
      document.activeElement!.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }))
    })
    await expect(page.getByTestId('login-notice')).toHaveText(INVALID)
    expect(posted).toHaveLength(1)
    expect(new URLSearchParams(posted[0]).get('code')).toBe('135791')
  })

  for (const evil of ['//evil.com', '/\\evil.com', 'https://evil.com', 'ORIGIN//evil.com', 'javascript:alert(1)']) {
    test(`callbackUrl ${evil} never leaves our origin after sign-in`, async ({ page, baseURL }) => {
      const origin = new URL(baseURL!).origin
      const cb = evil.replace('ORIGIN', origin)
      await stubAuth(page, ['ok'])
      let offSite = ''
      page.on('request', (r) => { if (r.isNavigationRequest() && new URL(r.url()).origin !== origin) offSite = r.url() })
      await page.goto(`/login?callbackUrl=${encodeURIComponent(cb)}`)
      await page.locator('input[type=email]').fill(EMAIL)
      await page.getByRole('button', { name: 'Send my code' }).click()
      await expect(page.locator('[data-step=code]')).toBeVisible()
      const leaving = page.waitForRequest((r) => r.isNavigationRequest() && !r.url().includes('callbackUrl='))
      await typeCode(page, '424242')
      await leaving
      await page.waitForLoadState('domcontentloaded')
      expect(new URL(page.url()).origin).toBe(origin)
      expect(offSite).toBe('')
    })
  }

  test('an unknown failure (no result.code) shows the connection message, not the code message', async ({ page }) => {
    await stubAuth(page, [])
    await page.route('**/api/auth/callback/credentials**', (route) => route.fulfill({ status: 500, body: 'x' }))
    await toCodeStep(page)
    await typeCode(page, '111111')
    await expect(page.getByTestId('login-notice')).toHaveText('Sign-in did not finish. Check the connection, then tap Sign in.')
  })

  test('English only under a Spanish cookie, and no EN/ES toggle', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'mathquest-locale', value: 'es', url: baseURL! }])
    await page.goto('/login')
    await expect(page.getByRole('button', { name: 'Send my code' })).toBeVisible()
    await expect(page.locator('[role=group][aria-label]')).toHaveCount(0)
  })
})
