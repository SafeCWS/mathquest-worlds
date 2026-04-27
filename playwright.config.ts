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
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',
    // Trace on first retry, screenshot on failure — the standard Playwright
    // debugging triple. Keeps the success case fast and the failure case
    // diagnosable without us reaching for `--debug`.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    // Long timeout because Next 16 + Turbopack can take 30-45s on a cold
    // first-run before the dev server is reachable.
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
