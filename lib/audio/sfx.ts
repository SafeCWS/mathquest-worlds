/**
 * sfx — Web Audio synthesis sound kit for "Big Multiplication". Zero audio files.
 *
 * Contract:
 *  - ONE shared AudioContext, created lazily on the first sound / unlockAudio() call.
 *  - Never throws: no window, no AudioContext, a locked/closed context, or a node error
 *    all degrade to silence.
 *  - `muted` gates every sound. Volume is independent of prefers-reduced-motion
 *    (reduced motion is a visual preference — sound stays at the chosen volume).
 *  - iOS/iPadOS Safari starts the context "suspended": call unlockAudio() inside the
 *    first pointerdown/touchend handler, or the first few sounds are dropped.
 *
 * Style follows the real app's lib/sounds/webAudioSounds.ts (oscillator + gain envelope),
 * with softer attacks and exponential decays so nothing clicks or sounds harsh for kids.
 */

type Ctx = AudioContext

let ctx: Ctx | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null
let unavailable = false
let muted = readInitialMuted()
let volume = 0.6

/** Seed `muted` from the real app's saved settings, if present. */
function readInitialMuted(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    const raw = window.localStorage.getItem('mathquest-sound-settings')
    if (!raw) return false
    const parsed = JSON.parse(raw) as { soundEnabled?: unknown }
    return parsed.soundEnabled === false
  } catch {
    return false
  }
}

function getCtx(): Ctx | null {
  if (ctx) return ctx.state === 'closed' ? null : ctx
  if (unavailable) return null
  try {
    if (typeof window === 'undefined') return null
    const Ctor = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) { unavailable = true; return null }
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = volume
    master.connect(ctx.destination)
    return ctx
  } catch {
    unavailable = true
    ctx = null
    master = null
    return null
  }
}

/** Ready context for scheduling, or null when muted/unavailable. Kicks a suspended context. */
function ready(): Ctx | null {
  if (muted) return null
  const c = getCtx()
  if (!c || !master) return null
  if (c.state === 'suspended') {
    try { void c.resume().catch(() => {}) } catch { /* ignore */ }
  }
  return c
}

function safe(fn: (c: Ctx, out: GainNode) => void): void {
  const c = ready()
  if (!c || !master) return
  try { fn(c, master) } catch { /* never throw into the UI */ }
}

interface ToneOpts {
  freq: number
  /** Glide target frequency (exponential). */
  toFreq?: number
  start?: number    // seconds from now
  dur: number       // seconds
  type?: OscillatorType
  gain?: number
  attack?: number
}

function tone(c: Ctx, out: AudioNode, o: ToneOpts): void {
  const t0 = c.currentTime + (o.start ?? 0)
  const attack = o.attack ?? 0.008
  const peak = Math.max(0.0002, o.gain ?? 0.25)
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, t0)
  if (o.toFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.toFreq), t0 + o.dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur)
  osc.connect(g)
  g.connect(out)
  osc.start(t0)
  osc.stop(t0 + o.dur + 0.02)
}

function getNoise(c: Ctx): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === c.sampleRate) return noiseBuffer
  const len = Math.floor(c.sampleRate * 0.6)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  noiseBuffer = buf
  return buf
}

// ---------------------------------------------------------------- settings

export function setMuted(value: boolean): void { muted = value }
export function isMuted(): boolean { return muted }

/** 0–1. Applies immediately to the shared master gain. */
export function setVolume(value: number): void {
  volume = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : volume
  try { if (master && ctx) master.gain.setValueAtTime(volume, ctx.currentTime) } catch { /* ignore */ }
}
export function getVolume(): number { return volume }

/** True once a context exists and is running (useful for a debug badge, not required). */
export function isAudioReady(): boolean {
  return !!ctx && ctx.state === 'running'
}

/**
 * Call from the FIRST user gesture (pointerdown / touchend / click). Creates the context,
 * resumes it, and plays a 1-sample silent buffer — the iOS Safari unlock idiom.
 * Safe to call on every tap; cheap after the first time.
 */
export function unlockAudio(): void {
  const c = getCtx()
  if (!c) return
  try {
    if (c.state === 'suspended') void c.resume().catch(() => {})
    const src = c.createBufferSource()
    src.buffer = c.createBuffer(1, 1, c.sampleRate)
    src.connect(c.destination)
    src.start(0)
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------- sounds

/** Light UI tap. */
export function tap(): void {
  safe((c, out) => tone(c, out, { freq: 700, toFreq: 520, dur: 0.06, type: 'triangle', gain: 0.18 }))
}

/** Bright ding for a right answer. */
export function correct(): void {
  safe((c, out) => {
    tone(c, out, { freq: 1046.5, dur: 0.12, type: 'triangle', gain: 0.16 })           // C6 pickup
    tone(c, out, { freq: 1568, start: 0.08, dur: 0.55, gain: 0.22 })                  // G6 ding
    tone(c, out, { freq: 3136, start: 0.08, dur: 0.3, gain: 0.05 })                   // shimmer partial
  })
}

/** Soft low boop for a wrong answer — gentle, never a buzzer. */
export function wrong(): void {
  safe((c, out) => {
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 900
    lp.connect(out)
    tone(c, lp, { freq: 262, toFreq: 196, dur: 0.28, gain: 0.2, attack: 0.02 })
  })
}

/** Bubble pop when a block/cube appears or is tapped. */
export function blockPop(): void {
  safe((c, out) => tone(c, out, { freq: 980, toFreq: 420, dur: 0.09, gain: 0.2, attack: 0.004 }))
}

/** 10 cubes → 1 rod: a rising filtered-noise whoosh that lands on a wooden "clack". */
export function tradeWhoosh(): void {
  safe((c, out) => {
    const t0 = c.currentTime
    const dur = 0.45
    const src = c.createBufferSource()
    src.buffer = getNoise(c)
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.2
    bp.frequency.setValueAtTime(350, t0)
    bp.frequency.exponentialRampToValueAtTime(2600, t0 + dur)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.22, t0 + dur * 0.6)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    src.connect(bp)
    bp.connect(g)
    g.connect(out)
    src.start(t0)
    src.stop(t0 + dur + 0.02)
    tone(c, out, { freq: 520, toFreq: 390, start: dur - 0.04, dur: 0.12, type: 'triangle', gain: 0.22, attack: 0.003 })
  })
}

/** Little plink when the carry digit jumps into its bubble. */
export function carryPlink(): void {
  safe((c, out) => {
    tone(c, out, { freq: 1319, toFreq: 1760, dur: 0.14, type: 'triangle', gain: 0.18, attack: 0.003 })
    tone(c, out, { freq: 2637, start: 0.03, dur: 0.1, gain: 0.04 })
  })
}

/** A step of the script is done: quick C–E–G arpeggio. */
export function stepComplete(): void {
  safe((c, out) => {
    ;[523.25, 659.25, 783.99].forEach((f, i) =>
      tone(c, out, { freq: f, start: i * 0.07, dur: 0.16, type: 'triangle', gain: 0.17 }))
  })
}

/** Level unlocked: short fanfare (C–E–G, held high C with a fifth under it). */
export function levelUp(): void {
  safe((c, out) => {
    const notes: Array<[number, number, number]> = [
      [523.25, 0.0, 0.14], [659.25, 0.12, 0.14], [783.99, 0.24, 0.14], [1046.5, 0.38, 0.6],
    ]
    for (const [f, start, dur] of notes) {
      tone(c, out, { freq: f, start, dur, type: 'triangle', gain: 0.2 })
      tone(c, out, { freq: f * 2, start, dur: dur * 0.7, gain: 0.04 })
    }
    tone(c, out, { freq: 783.99, start: 0.38, dur: 0.6, gain: 0.1 })
  })
}

/**
 * Streak sound: pitch rises one semitone per streak step (capped at 12 = one octave),
 * so a run of right answers audibly climbs. n ≤ 1 plays the base note.
 */
export function streak(n: number): void {
  const base = streakBaseFrequency(n)
  safe((c, out) => {
    tone(c, out, { freq: base, dur: 0.12, type: 'triangle', gain: 0.18 })
    tone(c, out, { freq: base * 1.5, start: 0.08, dur: 0.22, gain: 0.16 })
  })
}

/** Pitch (Hz) of streak(n)'s first note — exported for tests / visual sync. */
export function streakBaseFrequency(n: number): number {
  const steps = Math.max(0, Math.min(12, Math.floor(Number.isFinite(n) ? n : 0) - 1))
  return 659.25 * Math.pow(2, steps / 12)
}

/** Grouped handle: `import { sfx } from '@/lib/audio/sfx'; sfx.correct()`. */
export const sfx = {
  tap, correct, wrong, blockPop, tradeWhoosh, carryPlink, stepComplete, levelUp, streak,
  unlockAudio, setMuted, isMuted, setVolume, getVolume, isAudioReady,
} as const

/** Test-only: drop the shared context so a fresh fake can be injected. */
export function __resetAudioForTests(): void {
  ctx = null
  master = null
  noiseBuffer = null
  unavailable = false
}
