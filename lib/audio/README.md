# lib/audio — synthesized sound kit (zero audio files)

API (`lib/audio/sfx.ts`): `tap()`, `correct()`, `wrong()`, `blockPop()`, `tradeWhoosh()`, `carryPlink()`, `stepComplete()`, `levelUp()`, `streak(n)`; settings `setMuted(b)`, `isMuted()`, `setVolume(0–1)`, `getVolume()`; `unlockAudio()`, `isAudioReady()`. Also grouped as `sfx.*`.
One shared AudioContext is created lazily; every call is a silent no-op (never throws) on SSR, a missing AudioContext, a locked context, or while muted.
**iOS/iPadOS:** call `unlockAudio()` in the FIRST `onPointerDown` (e.g. the mode's root `<div onPointerDown={unlockAudio}>`) — Safari keeps the context suspended until a gesture.
Wire-up: `import { sfx } from '@/lib/audio/sfx'` → `onClick={() => { sfx.tap(); … }}`; right answer → `sfx.correct()` then `sfx.streak(streakCount)`; wrong → `sfx.wrong()` + shake.
Block Builder: `sfx.blockPop()` per cube tapped; `sfx.tradeWhoosh()` when 10 cubes animate into a rod. Column: `sfx.carryPlink()` when the carry bubble appears; `sfx.stepComplete()` per finished step.
`sfx.levelUp()` only on a level unlock (it's the long one, ~1 s). Never stack it with `correct()` in the same tick.
Mute: bind the existing settings toggle to `setMuted(!soundEnabled)`; the initial value is read from `mathquest-sound-settings` in localStorage.
Volume is NOT reduced by `prefers-reduced-motion` (that is a visual preference) — gate animations on it, not sound.
Narration text lives in `lib/math/stepScripts.ts` (`step.speak` → `lib/sounds/speechUtils.speak`); call `cancelSpeech()` before a new step.
