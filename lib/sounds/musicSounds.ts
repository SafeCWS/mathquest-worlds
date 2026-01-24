// Musical Sound Effects for MathQuest - REAL MELODIES!
// Inspired by games like CodeSpark, Monument Valley, and Nintendo games

class MusicManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private _musicEnabled: boolean = true
  private _volume: number = 0.6
  private backgroundLoop: OscillatorNode | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mathquest-music-settings')
      if (saved) {
        try {
          const settings = JSON.parse(saved)
          this._musicEnabled = settings.musicEnabled ?? true
          this._volume = settings.volume ?? 0.6
        } catch {
          // Use defaults
        }
      }
    }
  }

  private initAudio() {
    if (this.audioContext) return

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = this._volume
      this.masterGain.connect(this.audioContext.destination)
    } catch (e) {
      console.warn('Web Audio not supported:', e)
    }
  }

  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  get musicEnabled() { return this._musicEnabled }
  set musicEnabled(value: boolean) {
    this._musicEnabled = value
    this.saveSettings()
  }

  get volume() { return this._volume }
  set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value))
    if (this.masterGain) {
      this.masterGain.gain.value = this._volume
    }
    this.saveSettings()
  }

  private saveSettings() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mathquest-music-settings', JSON.stringify({
        musicEnabled: this._musicEnabled,
        volume: this._volume
      }))
    }
  }

  // Play a musical note
  private playNote(frequency: number, duration: number, type: OscillatorType = 'sine', delay: number = 0, gain: number = 0.3) {
    if (!this._musicEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const startTime = this.audioContext.currentTime + delay

    const osc = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(frequency, startTime)

    // Smooth envelope for musical sound
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.02)
    gainNode.gain.setValueAtTime(gain, startTime + duration * 0.7)
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

    osc.connect(gainNode)
    gainNode.connect(this.masterGain)

    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  // Musical note frequencies (C4 octave)
  private notes = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
    A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
    A5: 880.00, B5: 987.77,
    C6: 1046.50
  }

  // ===== VICTORY MELODIES =====

  // Happy victory fanfare (like Mario!)
  playVictoryFanfare() {
    if (!this._musicEnabled) return
    this.initAudio()

    const melody = [
      { note: this.notes.G4, dur: 0.15 },
      { note: this.notes.C5, dur: 0.15 },
      { note: this.notes.E5, dur: 0.15 },
      { note: this.notes.G5, dur: 0.3 },
      { note: this.notes.E5, dur: 0.15 },
      { note: this.notes.G5, dur: 0.5 },
    ]

    let time = 0
    melody.forEach(({ note, dur }) => {
      this.playNote(note, dur, 'square', time, 0.2)
      time += dur
    })

    // Chord at the end
    setTimeout(() => {
      this.playNote(this.notes.C5, 0.6, 'sine', 0, 0.15)
      this.playNote(this.notes.E5, 0.6, 'sine', 0, 0.15)
      this.playNote(this.notes.G5, 0.6, 'sine', 0, 0.15)
    }, time * 1000)
  }

  // Correct answer jingle (short & sweet)
  playCorrectMelody() {
    if (!this._musicEnabled) return
    this.initAudio()

    // Quick ascending arpeggio like Duolingo
    this.playNote(this.notes.E5, 0.1, 'sine', 0, 0.25)
    this.playNote(this.notes.G5, 0.1, 'sine', 0.08, 0.25)
    this.playNote(this.notes.C6, 0.2, 'sine', 0.16, 0.3)
  }

  // Wrong answer (gentle, encouraging)
  playWrongMelody() {
    if (!this._musicEnabled) return
    this.initAudio()

    // Soft descending
    this.playNote(this.notes.E4, 0.15, 'triangle', 0, 0.2)
    this.playNote(this.notes.C4, 0.2, 'triangle', 0.12, 0.15)
  }

  // Streak bonus (exciting!)
  playStreakMelody() {
    if (!this._musicEnabled) return
    this.initAudio()

    const notes = [
      this.notes.C5, this.notes.E5, this.notes.G5,
      this.notes.C6, this.notes.E5, this.notes.G5, this.notes.C6
    ]

    notes.forEach((note, i) => {
      this.playNote(note, 0.1, 'square', i * 0.06, 0.15)
    })
  }

  // Level complete celebration
  playLevelCompleteMelody() {
    if (!this._musicEnabled) return
    this.initAudio()

    // Epic victory melody
    const melody = [
      { note: this.notes.C5, dur: 0.2 },
      { note: this.notes.E5, dur: 0.2 },
      { note: this.notes.G5, dur: 0.2 },
      { note: this.notes.C6, dur: 0.4 },
      { note: this.notes.G5, dur: 0.2 },
      { note: this.notes.C6, dur: 0.6 },
    ]

    let time = 0
    melody.forEach(({ note, dur }) => {
      this.playNote(note, dur, 'square', time, 0.2)
      this.playNote(note / 2, dur, 'triangle', time, 0.1) // Bass
      time += dur * 0.8
    })

    // Final chord
    setTimeout(() => {
      this.playNote(this.notes.C5, 1, 'sine', 0, 0.15)
      this.playNote(this.notes.E5, 1, 'sine', 0, 0.15)
      this.playNote(this.notes.G5, 1, 'sine', 0, 0.15)
      this.playNote(this.notes.C6, 1, 'sine', 0, 0.15)
    }, time * 1000)
  }

  // ===== INTERACTION SOUNDS =====

  // Bubble pop
  playBubblePop() {
    if (!this._musicEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1)

    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.15)
  }

  // Cute click
  playCuteClick() {
    if (!this._musicEnabled) return
    this.initAudio()
    this.playNote(this.notes.G5, 0.05, 'sine', 0, 0.2)
  }

  // Collect/grab item
  playCollect() {
    if (!this._musicEnabled) return
    this.initAudio()
    this.playNote(this.notes.E5, 0.08, 'square', 0, 0.2)
    this.playNote(this.notes.B5, 0.12, 'square', 0.06, 0.2)
  }

  // Whoosh/swipe
  playWhoosh() {
    if (!this._musicEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(300, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.15)

    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)

    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.2)
  }

  // Star earned
  playStarEarned() {
    if (!this._musicEnabled) return
    this.initAudio()

    // Magical sparkle
    const sparkle = [this.notes.C6, this.notes.E5, this.notes.G5, this.notes.C6]
    sparkle.forEach((note, i) => {
      this.playNote(note, 0.15, 'sine', i * 0.08, 0.2)
    })
  }

  // ===== BACKGROUND MUSIC LOOPS =====

  // Gentle focus loop (calming for concentration)
  startFocusMusic() {
    if (!this._musicEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    // Create a gentle ambient pad
    const playAmbient = () => {
      if (!this._musicEnabled || !this.audioContext || !this.masterGain) return

      // Soft chord
      const chord = [this.notes.C4, this.notes.E4, this.notes.G4]
      chord.forEach(freq => {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, this.audioContext!.currentTime)

        gain.gain.setValueAtTime(0, this.audioContext!.currentTime)
        gain.gain.linearRampToValueAtTime(0.05, this.audioContext!.currentTime + 1)
        gain.gain.linearRampToValueAtTime(0, this.audioContext!.currentTime + 4)

        osc.connect(gain)
        gain.connect(this.masterGain!)

        osc.start()
        osc.stop(this.audioContext!.currentTime + 4)
      })
    }

    playAmbient()
    // Repeat every 5 seconds
    const interval = setInterval(() => {
      if (this._musicEnabled) {
        playAmbient()
      }
    }, 5000)

    return () => clearInterval(interval)
  }

  // Stop all background music
  stopBackgroundMusic() {
    // The loops will stop naturally since they check _musicEnabled
  }

  // ===== GAME-SPECIFIC SOUNDS =====

  // Countdown beeps (3, 2, 1, GO!)
  playCountdown(onComplete: () => void) {
    if (!this._musicEnabled) {
      setTimeout(onComplete, 3000)
      return
    }
    this.initAudio()

    // 3
    this.playNote(this.notes.C5, 0.2, 'square', 0, 0.25)
    // 2
    this.playNote(this.notes.C5, 0.2, 'square', 1, 0.25)
    // 1
    this.playNote(this.notes.C5, 0.2, 'square', 2, 0.25)
    // GO!
    setTimeout(() => {
      this.playNote(this.notes.C6, 0.4, 'square', 0, 0.3)
      this.playNote(1318.51, 0.4, 'square', 0, 0.3) // E6
      onComplete()
    }, 3000)
  }

  // Racing/urgent music
  playRaceMusic() {
    if (!this._musicEnabled) return
    this.initAudio()

    // Quick repeating pattern
    const pattern = [this.notes.C5, this.notes.E5, this.notes.G5, this.notes.E5]
    let i = 0
    const interval = setInterval(() => {
      if (!this._musicEnabled || i >= 20) {
        clearInterval(interval)
        return
      }
      this.playNote(pattern[i % pattern.length], 0.1, 'square', 0, 0.15)
      i++
    }, 200)

    return () => clearInterval(interval)
  }

  // Animal happy sound
  playAnimalHappy() {
    if (!this._musicEnabled) return
    this.initAudio()

    // Cute bouncy sound
    this.playNote(this.notes.C5, 0.1, 'sine', 0, 0.25)
    this.playNote(this.notes.G5, 0.1, 'sine', 0.1, 0.25)
    this.playNote(this.notes.E5, 0.15, 'sine', 0.2, 0.25)
  }

  // Match found
  playMatchFound() {
    if (!this._musicEnabled) return
    this.initAudio()

    this.playNote(this.notes.E5, 0.1, 'square', 0, 0.2)
    this.playNote(this.notes.E5, 0.1, 'square', 0.12, 0.2)
  }

  // Puzzle piece placed
  playPuzzlePiece() {
    if (!this._musicEnabled) return
    this.initAudio()

    this.playNote(this.notes.G4, 0.08, 'triangle', 0, 0.25)
    this.playNote(this.notes.C5, 0.15, 'triangle', 0.08, 0.25)
  }
}

// Singleton
export const music = new MusicManager()

// React hook
export function useMusic() {
  return music
}
