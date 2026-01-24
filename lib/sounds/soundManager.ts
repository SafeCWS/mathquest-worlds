// Sound Manager for MathQuest Worlds
// Uses Howler.js for 3D spatial audio and sound effects

import { Howl, Howler } from 'howler'

// Sound categories
type SoundCategory = 'effect' | 'music' | 'ambient'

interface SoundConfig {
  src: string[]
  volume?: number
  loop?: boolean
  rate?: number
  sprite?: { [key: string]: [number, number] }
  spatial?: boolean
  pannerAttr?: {
    panningModel: 'HRTF' | 'equalpower'
    distanceModel: 'linear' | 'inverse' | 'exponential'
    refDistance: number
    maxDistance: number
    rolloffFactor: number
  }
}

// Sound effect definitions with 3D spatial audio support
const SOUND_EFFECTS: Record<string, SoundConfig> = {
  // UI sounds
  buttonClick: {
    src: ['/sounds/effects/click.mp3', '/sounds/effects/click.ogg'],
    volume: 0.5
  },
  buttonHover: {
    src: ['/sounds/effects/hover.mp3'],
    volume: 0.3
  },

  // Correct/incorrect feedback
  correct: {
    src: ['/sounds/effects/correct.mp3'],
    volume: 0.6,
    spatial: true
  },
  incorrect: {
    src: ['/sounds/effects/wrong.mp3'],
    volume: 0.4
  },
  streak: {
    src: ['/sounds/effects/streak.mp3'],
    volume: 0.7
  },

  // Rewards and celebrations
  starEarn: {
    src: ['/sounds/effects/star.mp3'],
    volume: 0.6,
    spatial: true,
    pannerAttr: {
      panningModel: 'HRTF',
      distanceModel: 'linear',
      refDistance: 1,
      maxDistance: 100,
      rolloffFactor: 1
    }
  },
  levelComplete: {
    src: ['/sounds/effects/level-complete.mp3'],
    volume: 0.7
  },
  worldUnlock: {
    src: ['/sounds/effects/world-unlock.mp3'],
    volume: 0.8
  },
  celebration: {
    src: ['/sounds/effects/celebration.mp3'],
    volume: 0.6
  },

  // Character sounds
  characterHappy: {
    src: ['/sounds/effects/happy.mp3'],
    volume: 0.5,
    spatial: true
  },
  characterJump: {
    src: ['/sounds/effects/jump.mp3'],
    volume: 0.4,
    spatial: true
  },

  // Counting sounds
  count: {
    src: ['/sounds/effects/count.mp3'],
    volume: 0.4
  },
  countComplete: {
    src: ['/sounds/effects/count-done.mp3'],
    volume: 0.5
  },

  // Object interactions
  objectPickup: {
    src: ['/sounds/effects/pickup.mp3'],
    volume: 0.4,
    spatial: true
  },
  objectDrop: {
    src: ['/sounds/effects/drop.mp3'],
    volume: 0.4,
    spatial: true
  }
}

// Background music for each world
const WORLD_MUSIC: Record<string, SoundConfig> = {
  jungle: {
    src: ['/sounds/music/jungle.mp3'],
    volume: 0.3,
    loop: true
  },
  space: {
    src: ['/sounds/music/space.mp3'],
    volume: 0.3,
    loop: true
  },
  ocean: {
    src: ['/sounds/music/ocean.mp3'],
    volume: 0.3,
    loop: true
  },
  fairy: {
    src: ['/sounds/music/fairy.mp3'],
    volume: 0.3,
    loop: true
  },
  dino: {
    src: ['/sounds/music/dino.mp3'],
    volume: 0.3,
    loop: true
  },
  candy: {
    src: ['/sounds/music/candy.mp3'],
    volume: 0.3,
    loop: true
  },
  menu: {
    src: ['/sounds/music/menu.mp3'],
    volume: 0.25,
    loop: true
  }
}

// Ambient sounds for each world (3D spatial audio)
const AMBIENT_SOUNDS: Record<string, SoundConfig> = {
  jungle: {
    src: ['/sounds/ambient/jungle-birds.mp3'],
    volume: 0.2,
    loop: true,
    spatial: true
  },
  space: {
    src: ['/sounds/ambient/space-hum.mp3'],
    volume: 0.15,
    loop: true
  },
  ocean: {
    src: ['/sounds/ambient/underwater.mp3'],
    volume: 0.2,
    loop: true,
    spatial: true
  },
  fairy: {
    src: ['/sounds/ambient/magical-wind.mp3'],
    volume: 0.2,
    loop: true
  },
  dino: {
    src: ['/sounds/ambient/volcano.mp3'],
    volume: 0.15,
    loop: true
  },
  candy: {
    src: ['/sounds/ambient/bubbly.mp3'],
    volume: 0.2,
    loop: true
  }
}

class SoundManager {
  private sounds: Map<string, Howl> = new Map()
  private currentMusic: Howl | null = null
  private currentMusicKey: string | null = null
  private currentAmbient: Howl | null = null
  private currentAmbientKey: string | null = null

  private _soundEnabled: boolean = true
  private _musicEnabled: boolean = true
  private _ambientEnabled: boolean = true
  private _masterVolume: number = 1.0

  constructor() {
    // Configure Howler for best 3D audio
    Howler.orientation(0, 0, -1, 0, 1, 0)

    // Load persisted settings
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mathquest-sound-settings')
      if (saved) {
        try {
          const settings = JSON.parse(saved)
          this._soundEnabled = settings.soundEnabled ?? true
          this._musicEnabled = settings.musicEnabled ?? true
          this._ambientEnabled = settings.ambientEnabled ?? true
          this._masterVolume = settings.masterVolume ?? 1.0
        } catch {
          // Use defaults
        }
      }
    }
  }

  // Getters/setters for settings
  get soundEnabled() { return this._soundEnabled }
  set soundEnabled(value: boolean) {
    this._soundEnabled = value
    this.saveSettings()
  }

  get musicEnabled() { return this._musicEnabled }
  set musicEnabled(value: boolean) {
    this._musicEnabled = value
    if (!value) {
      this.stopMusic()
    }
    this.saveSettings()
  }

  get ambientEnabled() { return this._ambientEnabled }
  set ambientEnabled(value: boolean) {
    this._ambientEnabled = value
    if (!value) {
      this.stopAmbient()
    }
    this.saveSettings()
  }

  get masterVolume() { return this._masterVolume }
  set masterVolume(value: number) {
    this._masterVolume = Math.max(0, Math.min(1, value))
    Howler.volume(this._masterVolume)
    this.saveSettings()
  }

  private saveSettings() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mathquest-sound-settings', JSON.stringify({
        soundEnabled: this._soundEnabled,
        musicEnabled: this._musicEnabled,
        ambientEnabled: this._ambientEnabled,
        masterVolume: this._masterVolume
      }))
    }
  }

  // Load and cache a sound
  private loadSound(key: string, config: SoundConfig): Howl {
    const cached = this.sounds.get(key)
    if (cached) return cached

    const howlConfig: any = {
      src: config.src,
      volume: (config.volume ?? 1.0) * this._masterVolume,
      loop: config.loop ?? false,
      rate: config.rate ?? 1.0,
      preload: true
    }

    // Add 3D spatial audio configuration
    if (config.spatial) {
      howlConfig.pannerAttr = config.pannerAttr ?? {
        panningModel: 'HRTF',
        distanceModel: 'linear',
        refDistance: 1,
        maxDistance: 100,
        rolloffFactor: 1
      }
    }

    if (config.sprite) {
      howlConfig.sprite = config.sprite
    }

    const sound = new Howl(howlConfig)
    this.sounds.set(key, sound)
    return sound
  }

  // Play a sound effect with optional 3D position
  play(soundKey: keyof typeof SOUND_EFFECTS, options?: {
    volume?: number
    rate?: number
    position?: { x: number; y: number; z: number }
    onEnd?: () => void
  }): number | undefined {
    if (!this._soundEnabled) return undefined

    const config = SOUND_EFFECTS[soundKey]
    if (!config) {
      console.warn(`Sound "${soundKey}" not found`)
      return undefined
    }

    const sound = this.loadSound(soundKey, config)

    // Apply options
    if (options?.volume) {
      sound.volume(options.volume * this._masterVolume)
    }
    if (options?.rate) {
      sound.rate(options.rate)
    }
    if (options?.onEnd) {
      sound.once('end', options.onEnd)
    }

    const id = sound.play()

    // Set 3D position if provided and sound is spatial
    if (options?.position && config.spatial) {
      sound.pos(options.position.x, options.position.y, options.position.z, id)
    }

    return id
  }

  // Play background music for a world
  playMusic(worldKey: string) {
    if (!this._musicEnabled) return

    // Don't restart if already playing
    if (this.currentMusicKey === worldKey && this.currentMusic?.playing()) {
      return
    }

    // Stop current music
    this.stopMusic()

    const config = WORLD_MUSIC[worldKey] || WORLD_MUSIC.menu
    this.currentMusic = this.loadSound(`music-${worldKey}`, config)
    this.currentMusicKey = worldKey

    // Fade in
    this.currentMusic.volume(0)
    this.currentMusic.play()
    this.currentMusic.fade(0, (config.volume ?? 0.3) * this._masterVolume, 1000)
  }

  // Stop background music
  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.fade(this.currentMusic.volume(), 0, 500)
      setTimeout(() => {
        this.currentMusic?.stop()
        this.currentMusic = null
        this.currentMusicKey = null
      }, 500)
    }
  }

  // Play ambient sounds for a world (3D positioned)
  playAmbient(worldKey: string) {
    if (!this._ambientEnabled) return

    // Don't restart if already playing
    if (this.currentAmbientKey === worldKey && this.currentAmbient?.playing()) {
      return
    }

    // Stop current ambient
    this.stopAmbient()

    const config = AMBIENT_SOUNDS[worldKey]
    if (!config) return

    this.currentAmbient = this.loadSound(`ambient-${worldKey}`, config)
    this.currentAmbientKey = worldKey
    this.currentAmbient.play()
  }

  // Stop ambient sounds
  stopAmbient() {
    if (this.currentAmbient) {
      this.currentAmbient.fade(this.currentAmbient.volume(), 0, 300)
      setTimeout(() => {
        this.currentAmbient?.stop()
        this.currentAmbient = null
        this.currentAmbientKey = null
      }, 300)
    }
  }

  // Update listener position for 3D audio
  updateListenerPosition(x: number, y: number, z: number) {
    Howler.pos(x, y, z)
  }

  // Preload all sounds for a world
  preloadWorld(worldKey: string) {
    // Preload world-specific music and ambient
    const musicConfig = WORLD_MUSIC[worldKey]
    if (musicConfig) {
      this.loadSound(`music-${worldKey}`, musicConfig)
    }

    const ambientConfig = AMBIENT_SOUNDS[worldKey]
    if (ambientConfig) {
      this.loadSound(`ambient-${worldKey}`, ambientConfig)
    }

    // Preload common effects
    Object.entries(SOUND_EFFECTS).forEach(([key, config]) => {
      this.loadSound(key, config)
    })
  }

  // Stop all sounds
  stopAll() {
    this.stopMusic()
    this.stopAmbient()
    Howler.stop()
  }

  // Mute/unmute all
  mute(muted: boolean) {
    Howler.mute(muted)
  }
}

// Singleton instance
export const soundManager = new SoundManager()

// React hook for sound manager
export function useSoundManager() {
  return soundManager
}
