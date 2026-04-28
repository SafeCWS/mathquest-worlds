/**
 * Web Speech API utilities for MathQuest Worlds
 * Provides child-friendly text-to-speech for math equations
 *
 * Settings tuned for ages 5-9:
 * - rate: 0.95 default (snappy but soft — bumped from 0.75 in QC pass 2026-04-27)
 * - pitch: 1.25 (higher pitch — softer, more child-friendly)
 * - lang: en-US
 *
 * Pace tiers (rate):
 * - 'kid-fast' (1.0)  — repeat play, snap quiz prompts
 * - 'normal'   (0.95) — new default, replaces sluggish 0.75
 * - 'slow'     (0.8)  — hint mode / first encounter
 */

/** Reveal mode for {@link speakEquation} — controls whether the product is spoken aloud. */
export type RevealMode = 'question-only' | 'with-hint' | 'full'

/** Pace tier — maps to a SpeechSynthesisUtterance.rate value. */
export type SpeechPace = 'kid-fast' | 'normal' | 'slow'

/** Options for {@link speak} and {@link speakEquation}. */
export interface SpeakOptions {
  pace?: SpeechPace
  revealMode?: RevealMode
}

/**
 * Pace -> rate map. Pitch / volume / voice picker stay constant across paces.
 * Exported for unit testing only — runtime callers use SpeakOptions.pace.
 */
export const PACE_RATE_MAP: Record<SpeechPace, number> = {
  'kid-fast': 1.0,
  'normal': 0.95,
  'slow': 0.8,
}

/** Check if Speech Synthesis is available (SSR-safe) */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** @internal alias kept for backward compat within this file */
const isSpeechAvailable = isSpeechSupported

/** Cancel any in-progress speech */
export function cancelSpeech(): void {
  if (!isSpeechAvailable()) return
  window.speechSynthesis.cancel()
}

/**
 * Speak a given text string with child-friendly settings.
 * Automatically cancels any in-progress speech first.
 *
 * @param text What to speak
 * @param opts Optional {@link SpeakOptions}. `pace` defaults to `'normal'` (rate 0.95).
 */
export function speak(text: string, opts?: SpeakOptions): void {
  if (!isSpeechAvailable()) return

  // Cancel any ongoing speech before starting new
  window.speechSynthesis.cancel()

  const pace: SpeechPace = opts?.pace ?? 'normal'
  const rate = PACE_RATE_MAP[pace] ?? PACE_RATE_MAP['normal']

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  utterance.pitch = 1.25      // Higher pitch — softer, more child-friendly
  utterance.lang = 'en-US'
  utterance.volume = 0.7      // Softer volume — not jarring

  // Pick the softest, most child-friendly voice available
  const voices = window.speechSynthesis.getVoices()
  const preferredVoice = voices.find(
    // Samantha is Apple's softest female voice (iPad/Mac)
    v => v.lang.startsWith('en') && v.name.includes('Samantha')
  ) || voices.find(
    // Karen is another soft option on Apple devices
    v => v.lang.startsWith('en') && v.name.includes('Karen')
  ) || voices.find(
    v => v.lang.startsWith('en-US')
  ) || voices.find(
    v => v.lang.startsWith('en')
  )

  if (preferredVoice) {
    utterance.voice = preferredVoice
  }

  window.speechSynthesis.speak(utterance)
}

/**
 * Speak a multiplication equation in a child-friendly way.
 *
 * Reveal matrix:
 * - `'question-only'` (default) — `"${a} times ${b}. What's the answer?"` (NEVER speaks product)
 * - `'with-hint'`               — `"${a} times ${b}. That's ${a} groups of ${b}."`
 * - `'full'`                    — `"${a} times ${b} equals ${a*b}."`
 *
 * The default is intentionally answer-safe: kids must work the product out
 * themselves before the multiple-choice quiz appears.
 *
 * @param a First factor
 * @param b Second factor
 * @param opts Optional reveal/pace control. Defaults: `revealMode: 'question-only'`, `pace: 'normal'`.
 */
export function speakEquation(a: number, b: number, opts?: SpeakOptions): void {
  const revealMode: RevealMode = opts?.revealMode ?? 'question-only'

  let text: string
  switch (revealMode) {
    case 'full':
      text = `${a} times ${b} equals ${a * b}.`
      break
    case 'with-hint':
      text = `${a} times ${b}. That's ${a} groups of ${b}.`
      break
    case 'question-only':
    default:
      text = `${a} times ${b}. What's the answer?`
      break
  }

  speak(text, { pace: opts?.pace })
}

/**
 * Speak a multiplication equation with its answer.
 * Example: speakEquationWithAnswer(3, 4) => "3 times 4 equals 12!"
 */
export function speakEquationWithAnswer(a: number, b: number, opts?: SpeakOptions): void {
  const product = a * b
  const text = `${a} times ${b} equals ${product}!`
  speak(text, opts)
}

/**
 * Speak a missing-number equation.
 * Example: speakMissing(3, 4, 'product') => "3 times 4 equals... what?"
 * Example: speakMissing(3, 4, 'b') => "3 times... what... equals 12?"
 */
export function speakMissing(
  a: number,
  b: number,
  missingPosition: 'a' | 'b' | 'product',
  opts?: SpeakOptions,
): void {
  const product = a * b
  let text: string

  switch (missingPosition) {
    case 'a':
      text = `What number times ${b} equals ${product}?`
      break
    case 'b':
      text = `${a} times what number equals ${product}?`
      break
    case 'product':
    default:
      text = `${a} times ${b} equals... what?`
      break
  }

  speak(text, opts)
}
