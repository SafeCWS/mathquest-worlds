import { speak } from '@/lib/sounds/speechUtils'

/**
 * Read-aloud for Big Multiplication. The screen is English only (operator
 * ruling 2026-10-22), so every line goes through the real
 * lib/sounds/speechUtils.speak() unchanged (en-US voice, child-friendly
 * rate/pitch/volume). The `locale` argument is kept so the mode components
 * keep one call shape; a Spanish voice belongs in speechUtils if the screen
 * is ever translated.
 */
export function speakFor(_locale: string, text: string): void {
  speak(text)
}
