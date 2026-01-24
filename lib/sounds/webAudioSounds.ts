// Web Audio API Sound Generator for MathQuest Worlds
// Generates fun sounds programmatically - no audio files needed!

class WebAudioSoundManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private _soundEnabled: boolean = true
  private _volume: number = 0.5

  constructor() {
    if (typeof window !== 'undefined') {
      // Load saved settings
      const saved = localStorage.getItem('mathquest-sound-settings')
      if (saved) {
        try {
          const settings = JSON.parse(saved)
          this._soundEnabled = settings.soundEnabled ?? true
          this._volume = settings.volume ?? 0.5
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
      console.warn('Web Audio API not supported:', e)
    }
  }

  // Resume audio context (required after user interaction)
  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  get soundEnabled() { return this._soundEnabled }
  set soundEnabled(value: boolean) {
    this._soundEnabled = value
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
      localStorage.setItem('mathquest-sound-settings', JSON.stringify({
        soundEnabled: this._soundEnabled,
        volume: this._volume
      }))
    }
  }

  // Play a note with oscillator
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', gain: number = 0.3) {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime)

    gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    osc.connect(gainNode)
    gainNode.connect(this.masterGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + duration)
  }

  // Play an arpeggio (sequence of notes)
  private playArpeggio(frequencies: number[], noteDuration: number, type: OscillatorType = 'sine') {
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, noteDuration, type)
      }, i * noteDuration * 500)
    })
  }

  // ===== SOUND EFFECTS =====

  // Correct answer - happy ascending chime
  playCorrect() {
    if (!this._soundEnabled) return
    this.initAudio()
    // C5 - E5 - G5 (major chord arpeggio)
    this.playArpeggio([523, 659, 784], 0.15, 'sine')
    // Add sparkle
    setTimeout(() => this.playTone(1047, 0.2, 'sine', 0.2), 300)
  }

  // Wrong answer - gentle descending tone
  playWrong() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Two descending notes
    this.playTone(392, 0.15, 'triangle', 0.25)
    setTimeout(() => this.playTone(330, 0.2, 'triangle', 0.2), 100)
  }

  // Button click - short pop
  playClick() {
    if (!this._soundEnabled) return
    this.initAudio()
    this.playTone(800, 0.05, 'sine', 0.15)
  }

  // Celebration - big fanfare!
  playCelebration() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Triumphant fanfare: C4 - E4 - G4 - C5
    const notes = [262, 330, 392, 523, 659, 784]
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'triangle', 0.3)
      }, i * 120)
    })
    // Final chord
    setTimeout(() => {
      this.playTone(523, 0.5, 'sine', 0.2)
      this.playTone(659, 0.5, 'sine', 0.2)
      this.playTone(784, 0.5, 'sine', 0.2)
    }, 700)
  }

  // Star earned - magical sparkle
  playStar() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Twinkling high notes
    const sparkle = [1047, 1319, 1568, 1760]
    sparkle.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.1, 'sine', 0.15)
      }, i * 80)
    })
  }

  // Level complete - victory jingle
  playLevelComplete() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Victory melody
    const melody = [392, 440, 494, 523, 587, 659, 784]
    melody.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'square', 0.15)
      }, i * 100)
    })
    // Final chord
    setTimeout(() => {
      this.playCelebration()
    }, 800)
  }

  // Streak bonus - exciting ascending
  playStreak() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Fast ascending
    const streak = [330, 392, 440, 494, 523, 587, 659, 784, 880]
    streak.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.08, 'sawtooth', 0.1)
      }, i * 50)
    })
  }

  // Counting sound - soft blip for each counted item
  playCount() {
    if (!this._soundEnabled) return
    this.initAudio()
    this.playTone(600 + Math.random() * 200, 0.08, 'sine', 0.2)
  }

  // Select/tap item
  playSelect() {
    if (!this._soundEnabled) return
    this.initAudio()
    this.playTone(440, 0.08, 'sine', 0.2)
    setTimeout(() => this.playTone(554, 0.08, 'sine', 0.15), 50)
  }

  // Thinking/processing
  playThinking() {
    if (!this._soundEnabled) return
    this.initAudio()
    this.playTone(300, 0.3, 'sine', 0.1)
  }

  // Navigation/transition whoosh
  playWhoosh() {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.15)

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)

    osc.connect(gainNode)
    gainNode.connect(this.masterGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + 0.2)
  }

  // Pop sound for bubbles/items appearing
  playPop() {
    if (!this._soundEnabled) return
    this.initAudio()
    this.playTone(400 + Math.random() * 200, 0.06, 'sine', 0.25)
  }

  // ===== WORLD-SPECIFIC AMBIENT SOUNDS =====

  // JUNGLE WORLD - Bird calls, tropical sounds
  playJungleBird() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Chirping bird sound - quick ascending trill
    const birdNotes = [600, 750, 900, 850, 700]
    birdNotes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.08, 'sine', 0.12)
      }, i * 40)
    })
  }

  playJungleMonkey() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Monkey "ooh ooh" - low then high
    this.playTone(200, 0.15, 'sawtooth', 0.15)
    setTimeout(() => this.playTone(400, 0.12, 'sawtooth', 0.12), 180)
    setTimeout(() => this.playTone(300, 0.15, 'sawtooth', 0.15), 350)
  }

  playTropicalAmbient() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Gentle rainforest ambience - multiple soft tones
    const ambient = [150, 180, 200, 220]
    ambient.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.5, 'sine', 0.05)
      }, i * 100)
    })
  }

  // SPACE WORLD - Sci-fi beeps, cosmic whooshes
  playSpaceBeep() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Futuristic beep - square wave
    this.playTone(880, 0.08, 'square', 0.2)
    setTimeout(() => this.playTone(660, 0.08, 'square', 0.15), 100)
  }

  playCosmicWhoosh() {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(100, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.4)

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)

    osc.connect(gainNode)
    gainNode.connect(this.masterGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + 0.5)
  }

  playStarTwinkle() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Higher pitched sparkles for space
    const twinkle = [1200, 1500, 1800, 2100]
    twinkle.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.1, 'sine', 0.08)
      }, i * 60)
    })
  }

  // OCEAN WORLD - Underwater bubbles, whale sounds
  playBubble() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Gentle bubble pop
    const bubbleFreq = 300 + Math.random() * 400
    this.playTone(bubbleFreq, 0.15, 'sine', 0.15)
    setTimeout(() => {
      this.playTone(bubbleFreq * 1.5, 0.08, 'sine', 0.1)
    }, 80)
  }

  playWhaleCall() {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    osc.type = 'sine'
    // Whale sound - slow frequency sweep
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime)
    osc.frequency.linearRampToValueAtTime(400, this.audioContext.currentTime + 0.5)
    osc.frequency.linearRampToValueAtTime(250, this.audioContext.currentTime + 1.2)

    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.25, this.audioContext.currentTime + 0.5)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.3)

    osc.connect(gainNode)
    gainNode.connect(this.masterGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + 1.3)
  }

  playUnderwaterAmbient() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Low rumbling water sounds
    const underwater = [80, 100, 120, 90]
    underwater.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.8, 'sine', 0.06)
      }, i * 200)
    })
  }

  // ===== LOVELY CAT WORLD SOUNDS =====

  // Cute cat meow - high pitched, friendly
  playCatMeow() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Cute ascending meow
    const meow = [400, 600, 800, 700, 500]
    meow.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.1, 'sine', 0.12)
      }, i * 50)
    })
  }

  playCatMeow2() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Short chirpy meow
    this.playTone(500, 0.08, 'sine', 0.15)
    setTimeout(() => this.playTone(700, 0.12, 'sine', 0.12), 80)
  }

  // Cat purr - gentle rumbling
  playCatPurr() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Low frequency purr
    const purr = [80, 90, 85, 95, 80]
    purr.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'sine', 0.08)
      }, i * 100)
    })
  }

  // Playful pounce sound
  playCatPounce() {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1)
    osc.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.2)
    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.25)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.25)
  }

  // Yarn ball rolling
  playYarnRoll() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Gentle rolling sound
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(300 + i * 50, 0.08, 'triangle', 0.1)
      }, i * 80)
    }
  }

  // Cat bell jingle
  playCatBell() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Cute bell tinkle
    const bells = [1200, 1500, 1200, 1800, 1500]
    bells.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'sine', 0.08)
      }, i * 60)
    })
  }

  // Dreamy sparkle for cat world
  playCatSparkle() {
    if (!this._soundEnabled) return
    this.initAudio()
    // High pitched dreamy twinkles
    const sparkles = [1500, 1800, 2100, 1900, 2200, 1700]
    sparkles.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.1, 'sine', 0.08)
      }, i * 50)
    })
  }

  // Helper: Play random world sound based on world ID
  playWorldSound(worldId: string) {
    if (!this._soundEnabled) return

    switch (worldId) {
      case 'lovelycat':
        const catSounds = [
          () => this.playCatMeow(),
          () => this.playCatMeow2(),
          () => this.playCatPurr(),
          () => this.playCatPounce(),
          () => this.playYarnRoll(),
          () => this.playCatBell(),
          () => this.playCatSparkle()
        ]
        catSounds[Math.floor(Math.random() * catSounds.length)]()
        break

      case 'jungle':
        const jungleSounds = [
          () => this.playJungleBird(),
          () => this.playJungleMonkey(),
          () => this.playTropicalAmbient()
        ]
        jungleSounds[Math.floor(Math.random() * jungleSounds.length)]()
        break

      case 'space':
        const spaceSounds = [
          () => this.playSpaceBeep(),
          () => this.playCosmicWhoosh(),
          () => this.playStarTwinkle()
        ]
        spaceSounds[Math.floor(Math.random() * spaceSounds.length)]()
        break

      case 'ocean':
        const oceanSounds = [
          () => this.playBubble(),
          () => this.playWhaleCall(),
          () => this.playUnderwaterAmbient()
        ]
        oceanSounds[Math.floor(Math.random() * oceanSounds.length)]()
        break

      case 'fairy':
        const fairySounds = [
          () => this.playFairySparkle(),
          () => this.playFairySparkle2(),
          () => this.playFairySparkle3(),
          () => this.playFairyDustWhoosh(),
          () => this.playEnchantedChime(),
          () => this.playEnchantedChime2(),
          () => this.playWandWave()
        ]
        fairySounds[Math.floor(Math.random() * fairySounds.length)]()
        break

      case 'dino':
        const dinoSounds = [
          () => this.playDinoRoar(),
          () => this.playDinoRoar2(),
          () => this.playDinoRoar3(),
          () => this.playDinoFootstep(),
          () => this.playDinoFootstep2(),
          () => this.playPrehistoricJungle(),
          () => this.playEggHatch()
        ]
        dinoSounds[Math.floor(Math.random() * dinoSounds.length)]()
        break

      case 'rainbow':
      case 'candy':
        const rainbowSounds = [
          () => this.playColorBurst(),
          () => this.playColorBurst2(),
          () => this.playRainbowSlide(),
          () => this.playRainbowSlide2(),
          () => this.playSparkleRain(),
          () => this.playSparkleRain2(),
          () => this.playHappyJingle(),
          () => this.playHappyJingle2()
        ]
        rainbowSounds[Math.floor(Math.random() * rainbowSounds.length)]()
        break

      default:
        // Generic pleasant sound for other worlds
        this.playSelect()
    }
  }

  // ===== CONCENTRATION / FOCUS SOUNDS =====

  // Gentle focus pulse - calming rhythmic tone
  private focusInterval: ReturnType<typeof setInterval> | null = null

  playFocusPulse() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Soft, slow pulse that helps concentration
    this.playTone(200, 0.8, 'sine', 0.08)
    setTimeout(() => this.playTone(250, 0.6, 'sine', 0.06), 400)
  }

  // Start continuous focus sounds (gentle ambient)
  startFocusMode() {
    if (!this._soundEnabled || this.focusInterval) return
    this.initAudio()

    // Play initial calming tone
    this.playFocusPulse()

    // Continue with gentle pulses every 4 seconds
    this.focusInterval = setInterval(() => {
      if (this._soundEnabled) {
        this.playFocusPulse()
      }
    }, 4000)
  }

  // Stop focus mode
  stopFocusMode() {
    if (this.focusInterval) {
      clearInterval(this.focusInterval)
      this.focusInterval = null
    }
  }

  // Calming breathing sound (in... out...)
  playBreathingGuide() {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    // Breathing in (rising pitch)
    const oscIn = this.audioContext.createOscillator()
    const gainIn = this.audioContext.createGain()
    oscIn.type = 'sine'
    oscIn.frequency.setValueAtTime(150, this.audioContext.currentTime)
    oscIn.frequency.linearRampToValueAtTime(200, this.audioContext.currentTime + 2)
    gainIn.gain.setValueAtTime(0.01, this.audioContext.currentTime)
    gainIn.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 2)
    gainIn.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 2.5)
    oscIn.connect(gainIn)
    gainIn.connect(this.masterGain)
    oscIn.start()
    oscIn.stop(this.audioContext.currentTime + 2.5)

    // Breathing out (falling pitch) after a pause
    setTimeout(() => {
      if (!this.audioContext || !this.masterGain) return
      const oscOut = this.audioContext.createOscillator()
      const gainOut = this.audioContext.createGain()
      oscOut.type = 'sine'
      oscOut.frequency.setValueAtTime(200, this.audioContext.currentTime)
      oscOut.frequency.linearRampToValueAtTime(120, this.audioContext.currentTime + 3)
      gainOut.gain.setValueAtTime(0.1, this.audioContext.currentTime)
      gainOut.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 3)
      oscOut.connect(gainOut)
      gainOut.connect(this.masterGain)
      oscOut.start()
      oscOut.stop(this.audioContext.currentTime + 3)
    }, 2700)
  }

  // Gentle rain/static for focus (pink noise approximation)
  playWhiteNoiseShort() {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const bufferSize = this.audioContext.sampleRate * 0.5 // 0.5 second
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    // Generate pink-ish noise (more pleasant than white noise)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }

    const source = this.audioContext.createBufferSource()
    const gain = this.audioContext.createGain()
    source.buffer = buffer
    gain.gain.setValueAtTime(0.05, this.audioContext.currentTime)
    gain.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)
    source.connect(gain)
    gain.connect(this.masterGain)
    source.start()
  }

  // ===== MAGIC CLICK & INTERACTION SOUNDS =====

  // Sparkly magic wand sound
  playMagicWand() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Ascending sparkle with shimmer
    const sparkleNotes = [880, 1100, 1320, 1540, 1760, 2000]
    sparkleNotes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'sine', 0.12)
      }, i * 40)
    })
    // Final shimmer
    setTimeout(() => {
      this.playTone(2200, 0.3, 'sine', 0.08)
    }, 250)
  }

  // Magical fairy dust / power-up
  playFairyDust() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Random high-pitched twinkles
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const freq = 1500 + Math.random() * 1000
        this.playTone(freq, 0.1, 'sine', 0.1)
      }, i * 50)
    }
  }

  // Level up / achievement unlocked
  playLevelUp() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Triumphant ascending arpeggio
    const notes = [262, 330, 392, 523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.25, 'square', 0.15)
      }, i * 80)
    })
    // Final chord
    setTimeout(() => {
      this.playTone(523, 0.6, 'sine', 0.15)
      this.playTone(659, 0.6, 'sine', 0.15)
      this.playTone(784, 0.6, 'sine', 0.15)
      this.playTone(1047, 0.6, 'sine', 0.1)
    }, 600)
  }

  // Cute "boing" for bouncy interactions
  playBoing() {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.2)
    gain.gain.setValueAtTime(0.25, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.3)
  }

  // Coin / reward collect
  playCoinCollect() {
    if (!this._soundEnabled) return
    this.initAudio()
    this.playTone(988, 0.08, 'square', 0.2)
    setTimeout(() => this.playTone(1319, 0.15, 'square', 0.15), 80)
  }

  // Error / try again (gentle)
  playGentleError() {
    if (!this._soundEnabled) return
    this.initAudio()
    this.playTone(330, 0.2, 'triangle', 0.2)
    setTimeout(() => this.playTone(262, 0.25, 'triangle', 0.15), 150)
  }

  // Success chime (quick positive feedback)
  playSuccessChime() {
    if (!this._soundEnabled) return
    this.initAudio()
    this.playTone(784, 0.08, 'sine', 0.2)
    setTimeout(() => this.playTone(988, 0.12, 'sine', 0.2), 60)
    setTimeout(() => this.playTone(1319, 0.15, 'sine', 0.15), 120)
  }

  // Button hover / focus sound
  playHover() {
    if (!this._soundEnabled) return
    this.initAudio()
    this.playTone(600, 0.03, 'sine', 0.1)
  }

  // Magic portal / transition
  playPortal() {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.3)
    osc.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.6)
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.3)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.6)
  }

  // Answer selected / tap
  playAnswerTap() {
    if (!this._soundEnabled) return
    this.initAudio()
    this.playTone(523, 0.05, 'sine', 0.2)
  }

  // ===== FAIRY WORLD SOUNDS =====

  // Fairy sparkle - cascading high-pitched twinkles
  playFairySparkle() {
    if (!this._soundEnabled) return
    this.initAudio()
    const sparkles = [1800, 2200, 2600, 2400, 2800, 2200]
    sparkles.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.12, 'sine', 0.1)
      }, i * 60)
    })
  }

  playFairySparkle2() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Descending magic sparkle
    const sparkles = [2800, 2400, 2000, 1600, 1800]
    sparkles.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.1, 'sine', 0.08)
      }, i * 50)
    })
  }

  playFairySparkle3() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Random twinkle pattern
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this.playTone(1600 + Math.random() * 1200, 0.08, 'sine', 0.1)
      }, i * 70)
    }
  }

  // Fairy dust whoosh - sweeping magical sound
  playFairyDustWhoosh() {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(2000, this.audioContext.currentTime + 0.3)
    osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.5)
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.5)

    // Trailing sparkles
    setTimeout(() => this.playFairySparkle3(), 300)
  }

  // Enchanted chime - ethereal bell tones
  playEnchantedChime() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Bell harmonics
    const harmonics = [523, 659, 784, 1047, 1319]
    harmonics.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.4 - i * 0.05, 'sine', 0.12 - i * 0.02)
      }, i * 30)
    })
  }

  playEnchantedChime2() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Deeper mystical chimes
    const chimes = [392, 494, 587, 784]
    chimes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.35, 'triangle', 0.1)
      }, i * 100)
    })
  }

  // Wand wave - magical swish
  playWandWave() {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.15)
    osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.3)
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.35)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.35)

    // Sparkle burst at end
    setTimeout(() => this.playFairySparkle(), 200)
  }

  // ===== DINO WORLD SOUNDS =====

  // Friendly dino roar - playful, not scary!
  playDinoRoar() {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime)
    osc.frequency.linearRampToValueAtTime(200, this.audioContext.currentTime + 0.1)
    osc.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.3)
    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    gain.gain.linearRampToValueAtTime(0.25, this.audioContext.currentTime + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.4)

    // Cute chirp ending
    setTimeout(() => this.playTone(400, 0.1, 'sine', 0.15), 350)
  }

  playDinoRoar2() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Little dino squeak
    this.playTone(250, 0.15, 'sawtooth', 0.15)
    setTimeout(() => this.playTone(350, 0.1, 'sine', 0.12), 150)
  }

  playDinoRoar3() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Happy ascending call
    const notes = [120, 150, 180, 220, 280]
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.12, 'sawtooth', 0.12)
      }, i * 80)
    })
  }

  // Dino footstep - deep thud
  playDinoFootstep() {
    if (!this._soundEnabled) return
    this.initAudio()
    this.playTone(60, 0.15, 'sine', 0.3)
    setTimeout(() => this.playTone(80, 0.08, 'triangle', 0.15), 50)
  }

  playDinoFootstep2() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Lighter step
    this.playTone(80, 0.1, 'sine', 0.2)
  }

  playDinoFootstep3() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Running steps
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playTone(70 + Math.random() * 20, 0.08, 'sine', 0.2)
      }, i * 100)
    }
  }

  // Prehistoric jungle ambient
  playPrehistoricJungle() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Deep ambient with creature sounds
    this.playTone(80, 0.6, 'sine', 0.08)
    setTimeout(() => this.playTone(100, 0.4, 'sine', 0.06), 200)
    setTimeout(() => this.playDinoRoar2(), 400)
  }

  // Egg hatching crack
  playEggHatch() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Crack sequence
    const cracks = [800, 1000, 1200, 900, 1100]
    cracks.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.05, 'square', 0.15)
      }, i * 80)
    })
    // Baby chirp at end
    setTimeout(() => {
      this.playTone(600, 0.1, 'sine', 0.2)
      this.playTone(800, 0.1, 'sine', 0.15)
    }, 500)
  }

  // ===== RAINBOW WORLD SOUNDS =====

  // Color burst - ROYGBIV ascending rainbow
  playColorBurst() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Rainbow scale - each note represents a color
    const rainbow = [262, 294, 330, 349, 392, 440, 494, 523]
    rainbow.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'sine', 0.15)
      }, i * 60)
    })
    // Sparkle at peak
    setTimeout(() => {
      this.playTone(1047, 0.2, 'sine', 0.1)
    }, 500)
  }

  playColorBurst2() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Quick color flash
    const colors = [523, 659, 784, 880, 1047]
    colors.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.08, 'sine', 0.12)
      }, i * 40)
    })
  }

  // Rainbow slide - descending glissando
  playRainbowSlide() {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.5)
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.6)

    // Bouncy color sparkles
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(800 - i * 100, 0.06, 'sine', 0.08)
      }, i * 100)
    }
  }

  playRainbowSlide2() {
    if (!this._soundEnabled) return
    this.initAudio()
    if (!this.audioContext || !this.masterGain) return

    // Ascending slide
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.4)
    gain.gain.setValueAtTime(0.12, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.5)
  }

  // Sparkle rain - many gentle sparkles
  playSparkleRain() {
    if (!this._soundEnabled) return
    this.initAudio()
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        this.playTone(1000 + Math.random() * 1500, 0.1, 'sine', 0.06)
      }, i * 50)
    }
  }

  playSparkleRain2() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Heavy sparkle rain
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        this.playTone(800 + Math.random() * 2000, 0.08, 'sine', 0.05)
      }, i * 30)
    }
  }

  // Happy jingle - bouncy cheerful melody
  playHappyJingle() {
    if (!this._soundEnabled) return
    this.initAudio()
    const jingle = [523, 659, 784, 659, 523, 784, 1047]
    jingle.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'triangle', 0.15)
      }, i * 100)
    })
  }

  playHappyJingle2() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Quick happy ascending
    const happy = [392, 494, 587, 784]
    happy.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.1, 'sine', 0.15)
      }, i * 70)
    })
  }

  // ===== GLOBAL CELEBRATION SOUNDS =====

  // Victory fanfare - triumphant!
  playVictoryFanfare() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Brass-like triumphant fanfare
    const fanfare = [262, 330, 392, 523, 392, 523, 659, 784]
    fanfare.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'square', 0.18)
      }, i * 100)
    })
    // Final triumphant chord
    setTimeout(() => {
      this.playTone(523, 0.6, 'square', 0.12)
      this.playTone(659, 0.6, 'square', 0.12)
      this.playTone(784, 0.6, 'square', 0.12)
      this.playTone(1047, 0.6, 'sine', 0.1)
    }, 850)
  }

  playVictoryFanfare2() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Quick victory
    const quick = [523, 659, 784, 1047]
    quick.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, 'triangle', 0.2)
      }, i * 80)
    })
  }

  // Achievement unlock - magical reveal
  playAchievementUnlock() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Building shimmer
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this.playTone(600 + i * 150, 0.12, 'sine', 0.1)
      }, i * 60)
    }
    // Big reveal
    setTimeout(() => {
      this.playTone(1047, 0.3, 'sine', 0.2)
      this.playTone(1319, 0.3, 'sine', 0.15)
      this.playTone(1568, 0.3, 'sine', 0.1)
    }, 400)
    // Sparkle shower
    setTimeout(() => this.playSparkleRain(), 600)
  }

  playAchievementUnlock2() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Badge stamp and shine
    this.playTone(200, 0.08, 'square', 0.2) // stamp
    setTimeout(() => {
      const shine = [800, 1000, 1200, 1400, 1600]
      shine.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, 0.1, 'sine', 0.1), i * 40)
      })
    }, 100)
  }

  // Daily bonus - exciting welcome back!
  playDailyBonus() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Drum roll buildup
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.playTone(150 + i * 10, 0.05, 'triangle', 0.15)
      }, i * 40)
    }
    // Ta-da!
    setTimeout(() => {
      this.playTone(523, 0.15, 'square', 0.2)
      this.playTone(659, 0.15, 'square', 0.2)
    }, 350)
    setTimeout(() => {
      this.playTone(784, 0.3, 'square', 0.25)
      this.playTone(1047, 0.3, 'sine', 0.15)
    }, 500)
    // Coin shower
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => this.playCoinCollect(), i * 80)
      }
    }, 700)
  }

  playDailyBonus2() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Treasure chest opening
    this.playTone(150, 0.2, 'sawtooth', 0.1) // creak
    setTimeout(() => {
      this.playTone(300, 0.15, 'sawtooth', 0.08)
    }, 100)
    setTimeout(() => {
      // Treasure reveal
      this.playTone(784, 0.2, 'sine', 0.2)
      this.playTone(988, 0.2, 'sine', 0.15)
      this.playTone(1175, 0.25, 'sine', 0.15)
    }, 250)
  }

  // Star collection - satisfying ping
  playStarCollect() {
    if (!this._soundEnabled) return
    this.initAudio()
    this.playTone(880, 0.08, 'sine', 0.2)
    setTimeout(() => this.playTone(1175, 0.1, 'sine', 0.18), 50)
    setTimeout(() => this.playTone(1397, 0.12, 'sine', 0.12), 100)
    // Shimmer
    setTimeout(() => {
      this.playTone(2000, 0.15, 'sine', 0.08)
    }, 150)
  }

  playStarCollect2() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Quick collect
    this.playTone(1047, 0.06, 'sine', 0.2)
    setTimeout(() => this.playTone(1319, 0.08, 'sine', 0.15), 40)
  }

  // Streak milestone - combo building!
  playStreakMilestone() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Building combo
    const combo = [330, 392, 440, 494, 523, 587, 659, 784, 880]
    combo.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.1, 'square', 0.12 + i * 0.01)
      }, i * 50)
    })
    // Explosion at peak
    setTimeout(() => {
      this.playTone(1047, 0.3, 'square', 0.2)
      this.playTone(1319, 0.3, 'triangle', 0.15)
      this.playSparkleRain()
    }, 500)
  }

  playStreakMilestone2() {
    if (!this._soundEnabled) return
    this.initAudio()
    // Quick streak pop
    this.playTone(659, 0.08, 'square', 0.15)
    setTimeout(() => this.playTone(784, 0.08, 'square', 0.15), 60)
    setTimeout(() => this.playTone(1047, 0.12, 'square', 0.2), 120)
  }
}

// Singleton instance
export const sounds = new WebAudioSoundManager()

// React hook
export function useSounds() {
  return sounds
}
