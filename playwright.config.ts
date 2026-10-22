/**
 * Playwright config for MathQuest Worlds.
 *
 * Phase 4.A — added per L151 (the lesson from the 2026-04-20 Approvals UX
 * stuck-unstuck cycle): when the server returns the right data but the
 * browser renders the wrong thing, only a real browser test catches it.
 * Phase 4 introduces the level-gate (a state-machine that interacts with
 * persistence + UI), which is exactly the kind of feature where a missed
 * client-side bug would be invisible to unit tests.
 *
 * Scope decisions for V1:
 * - chromium-headless-shell only — minimizes install size and CI time.
 *   Firefox/WebKit deferred until we have a real cross-browser bug.
 * - Single project, single device profile (a desktop viewport). Mobile and
 *   tablet emulation is a Phase 5 concern.
 * - `webServer` auto-starts `npm run dev`. We DO NOT use `npm run start`
 *   here so we don't have to build before every test run. CI will likely
 *   want the production server eventually — Phase 5 gate.
 * - No CI integration yet (Phase 5). `test:e2e` is locally available only.
 */
import { randomBytes } from 'node:crypto'
import { defineConfig, devices } from '@playwright/test'

// E2E_PORT lets the suite run beside another dev server (default 3000).
const PORT = Number(process.env.E2E_PORT ?? 3000)
const BASE_URL = `http://localhost:${PORT}`

// Real sign-in for e2e (2026-10-22, email one-time code). The dev server gets a
// synthetic allowlist and the backend's development-only OTP_TEST_CODE hook
// (compiled out of production builds — lib/auth/otpStore.ts). No email is sent
// (GMAIL_APP_PASSWORD empty). AUTH_SECRET is random per run and never stored.
export const E2E_EMAIL = 'parent@example.com'
export const E2E_OTP_CODE = '246810'
export const AUTH_STATE = 'test-results/.auth/parent.json'

export default defineConfig({
  testDir: './tests/e2e',
  // Phone-width cross-browser spec runs only via playwright.phone.config.ts.
  testIgnore: /phone-cross-browser\.spec\.ts/,
  // fullyParallel: false — Next.js dev server with Turbopack cannot keep up
  // with parallel test workers cold-loading new routes simultaneously
  // (each parallel goto causes Turbopack to compile the route on demand,
  // queueing behind the others). Serial execution is fast enough at this
  // suite size (~15s for 8 tests) and far more reliable. Phase 5 should
  // re-evaluate this against `npm run start` (production server).
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    // Trace on first retry, screenshot on failure — the standard Playwright
    // debugging triple. Keeps the success case fast and the failure case
    // diagnosable without us reaching for `--debug`.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // One real sign-in; every other spec reuses the session cookie.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_STATE },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: BASE_URL,
    // Long timeout because Next 16 + Turbopack can take 30-45s on a cold
    // first-run before the dev server is reachable.
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      OTP_TEST_CODE: E2E_OTP_CODE,
      SIMPLE_AUTH_USERS: JSON.stringify([{ email: E2E_EMAIL }]),
      AUTH_SECRET: process.env.E2E_AUTH_SECRET ?? randomBytes(32).toString('base64url'),
      AUTH_TRUST_HOST: 'true',
      GMAIL_APP_PASSWORD: '',
    },
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
