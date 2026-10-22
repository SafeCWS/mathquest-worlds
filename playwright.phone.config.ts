/**
 * Phone-width cross-browser run (L194: unlayered CSS vs Tailwind 4 utilities only
 * shows up at <= 480 px, and engines differ). WebKit = iOS Safari, the main
 * child/parent device. Same dev server + real sign-in setup as playwright.config.ts.
 *   E2E_PORT=4330 npx playwright test -c playwright.phone.config.ts
 */
import { defineConfig, devices } from '@playwright/test'
import base, { AUTH_STATE } from './playwright.config'

const phone = { viewport: { width: 390, height: 844 }, hasTouch: true }

export default defineConfig({
  ...base,
  testMatch: /phone-cross-browser\.spec\.ts/,
  testIgnore: [],
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'phone-chromium', use: { ...devices['Desktop Chrome'], ...phone, isMobile: true, storageState: AUTH_STATE }, dependencies: ['setup'] },
    { name: 'phone-webkit', use: { ...devices['Desktop Safari'], ...phone, isMobile: true, storageState: AUTH_STATE }, dependencies: ['setup'] },
    // Firefox has no isMobile emulation; touch + width are what matter here.
    { name: 'phone-firefox', use: { ...devices['Desktop Firefox'], ...phone, storageState: AUTH_STATE }, dependencies: ['setup'] },
  ],
})
