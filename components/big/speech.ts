import { cancelSpeech, speak } from '@/lib/sounds/speechUtils'

/**
 * Read-aloud for Big Multiplication. The screen is English only (operator
 * ruling 2026-10-22), so every line goes through the real
 * lib/sounds/speechUtils.speak() unchanged (en-US voice, child-friendly
 * rate/pitch/volume). The `locale` argument is kept so the mode components
 * keep one call shape; a Spanish voice belongs in speechUtils if the screen
 * is ever translated.
 *
 * Voice on/off (operator 2026-10-22: "I should be able to mute the voice tapping
 * on the speaker"). Voice only — game sounds (lib/audio/sfx) are not affected.
 * Stored in localStorage `mq-big-voice` ("off" | absent). Default ON; storage
 * that throws (private mode, blocked) also means ON.
 */
export const VOICE_KEY = 'mq-big-voice'

// Used only when localStorage throws, so a mute still holds for this page.
let voiceFallback = true

export function isVoiceOn(): boolean {
  try {
    return window.localStorage.getItem(VOICE_KEY) !== 'off'
  } catch {
    return voiceFallback
  }
}

export function setVoiceOn(on: boolean): void {
  voiceFallback = on
  try {
    if (on) window.localStorage.removeItem(VOICE_KEY)
    else window.localStorage.setItem(VOICE_KEY, 'off')
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
  // Muting stops a sentence in progress at once.
  if (!on) cancelSpeech()
}

export function speakFor(_locale: string, text: string): void {
  if (!isVoiceOn()) return
  speak(text)
}
