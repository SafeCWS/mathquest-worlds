/**
 * Every browser the e2e suite launches is SILENT (operator ruling 2026-10-22, "stop the sounds").
 * Port of ~/prototypes/mathquest-worlds-big-mult-otp/silence.js. Three layers:
 *   1. Chromium launches with --mute-audio (CHROMIUM_MUTE, used by the playwright configs).
 *      Firefox gets media.volume_scale 0 (FIREFOX_MUTE). WebKit has no launch flag — layers 2 + 3.
 *   2. Init script: window.speechSynthesis → a counting stub. speak()/cancel() never reach a voice;
 *      calls land in window.__speak (texts) and window.__cancel (count), so specs can assert on them.
 *   3. Init script: AudioContext / webkitAudioContext → a subclass whose `destination` is a gain-0
 *      node. The app's sfx still build their graphs (window.__sfx counts oscillators) but every
 *      sound is multiplied by zero.
 *
 * Specs import { test, expect } from './silence' (never from '@playwright/test' directly) —
 * silence.spec.ts fails if one does not. The `context` fixture installs the init script, and the
 * `browser` fixture wraps newContext() so a spec that opens its own context is silent too.
 */
import { test as base, expect, type Browser, type BrowserContext } from '@playwright/test'

export const CHROMIUM_MUTE = { args: ['--mute-audio'] }
export const FIREFOX_MUTE = { firefoxUserPrefs: { 'media.volume_scale': '0.0' } }

export type SilentWindow = typeof window & { __speak: string[]; __cancel: number; __sfx: number; __silenced?: boolean }

/** Runs in the page before any app script. Must stay self-contained (it is serialised). */
export function silentInit() {
  const w = window as unknown as SilentWindow & {
    webkitAudioContext?: typeof AudioContext
  }
  if (w.__silenced) return
  w.__silenced = true
  w.__speak = []
  w.__cancel = 0
  w.__sfx = 0
  const stub = {
    speak: (u: SpeechSynthesisUtterance) => {
      w.__speak.push(u && u.text)
    },
    cancel: () => {
      w.__cancel++
    },
    getVoices: () => [],
    pause() {},
    resume() {},
    speaking: false,
    pending: false,
    paused: false,
    onvoiceschanged: null,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return true
    },
  }
  try {
    Object.defineProperty(window, 'speechSynthesis', { value: stub, configurable: true })
  } catch {
    /* ignore */
  }
  const Real = w.AudioContext || w.webkitAudioContext
  if (Real) {
    class SilentAudioContext extends Real {
      __silent?: GainNode
      constructor(...a: ConstructorParameters<typeof AudioContext>) {
        super(...a)
        const g = super.createGain()
        g.gain.value = 0
        g.connect(super.destination)
        this.__silent = g
      }
      // A GainNode stands in for the destination: every graph the app builds ends at gain 0.
      get destination(): AudioDestinationNode {
        return (this.__silent ?? super.destination) as unknown as AudioDestinationNode
      }
      createOscillator() {
        w.__sfx++
        return super.createOscillator()
      }
    }
    for (const name of ['AudioContext', 'webkitAudioContext']) {
      try {
        Object.defineProperty(window, name, { value: SilentAudioContext, configurable: true, writable: true })
      } catch {
        /* ignore */
      }
    }
  }
}

async function silence(ctx: BrowserContext) {
  await ctx.addInitScript(silentInit)
}

export const test = base.extend<object, { browser: Browser }>({
  browser: [
    async ({ browser }, provide) => {
      const original = browser.newContext.bind(browser)
      browser.newContext = async (options) => {
        const ctx = await original(options)
        await silence(ctx)
        return ctx
      }
      await provide(browser)
    },
    { scope: 'worker' },
  ],
  context: async ({ context }, provide) => {
    await silence(context) // idempotent: silentInit returns early when already installed
    await provide(context)
  },
})

export { expect }
