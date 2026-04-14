/**
 * Web Speech API utilities for MathQuest Worlds
 * Provides child-friendly text-to-speech for math equations
 *
 * Settings tuned for ages 5-9:
 * - rate: 0.85 (slightly slower for young listeners)
 * - pitch: 1.1 (slightly higher, more child-friendly)
 * - lang: en-US
 */

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
 */
export function speak(text: string): void {
  if (!isSpeechAvailable()) return

  // Cancel any ongoing speech before starting new
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.75       // Slower — gentle pace for young children
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
 * Example: speakEquation(3, 4) => "3 times 4. How many is 3 groups of 4?"
 */
export function speakEquation(a: number, b: number): void {
  const text = `${a} times ${b}. How many is ${a} groups of ${b}?`
  speak(text)
}

/**
 * Speak a multiplication equation with its answer.
 * Example: speakEquationWithAnswer(3, 4) => "3 times 4 equals 12!"
 */
export function speakEquationWithAnswer(a: number, b: number): void {
  const product = a * b
  const text = `${a} times ${b} equals ${product}!`
  speak(text)
}

/**
 * Speak a missing-number equation.
 * Example: speakMissing(3, 4, 'product') => "3 times 4 equals... what?"
 * Example: speakMissing(3, 4, 'b') => "3 times... what... equals 12?"
 */
export function speakMissing(
  a: number,
  b: number,
  missingPosition: 'a' | 'b' | 'product'
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

  speak(text)
}
