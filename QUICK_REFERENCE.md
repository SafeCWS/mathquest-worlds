# Quick Reference Card 🚀

## Copy-Paste This to Get Started

### 1. Import Everything
```typescript
import {
  useGameEffects,
  AnimatedAnswer,
  AnimatedNumber,
  AnimatedButton,
  ConfettiBurst,
  StarBurst,
  FloatingText
} from '@/components/game/enhanced'
```

### 2. Set Up Hook
```typescript
const {
  effects,
  combo,
  playCorrectAnswer,
  playWrongAnswer,
  playTap
} = useGameEffects()
```

### 3. Handle Answer Click
```typescript
const handleAnswerClick = (answer: number, event: React.MouseEvent) => {
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2

  const isCorrect = answer === correctAnswer

  if (isCorrect) {
    playCorrectAnswer(x, y)
    // Automatically plays sound + shows particles + tracks combo
  } else {
    playWrongAnswer(x, y)
    // Plays sound + shows ripple + resets combo
  }
}
```

### 4. Render Answer Button
```typescript
<AnimatedAnswer
  answer={5}
  isCorrect={answer === correctAnswer}
  isSelected={selectedAnswer === answer}
  onClick={handleAnswerClick}
  worldColors={{ primary: '#2D5016', secondary: '#8BC34A' }}
  size="large"
/>
```

### 5. Show Score with Count-Up
```typescript
<AnimatedNumber value={score} duration={500} className="text-3xl font-bold" />
```

### 6. Render All Effects
```typescript
{effects.map((effect) => {
  switch (effect.type) {
    case 'confetti':
      return <ConfettiBurst key={effect.id} x={effect.x} y={effect.y} />
    case 'starBurst':
      return <StarBurst key={effect.id} x={effect.x} y={effect.y} />
    case 'floatingText':
      return (
        <FloatingText
          key={effect.id}
          x={effect.x}
          y={effect.y}
          text={effect.data.text}
          emoji={effect.data.emoji}
        />
      )
    default:
      return null
  }
})}
```

### 7. Show Combo Meter (Optional)
```typescript
{combo > 0 && (
  <ComboMeter current={combo} max={10} position={{ x: 20, y: 20 }} />
)}
```

---

## Sound Quick Reference

```typescript
import { sounds } from '@/lib/sounds/webAudioSounds'

// Basic sounds
sounds.playCorrect()        // Correct answer
sounds.playWrong()          // Wrong answer
sounds.playClick()          // Button click
sounds.playSelect()         // Item selected
sounds.playTapRandom()      // Random tap variation

// Combos
sounds.playCombo3()         // 3 in a row
sounds.playCombo5()         // 5 in a row (power-up!)
sounds.playCombo10()        // 10 in a row (epic!)

// Milestones
sounds.playMilestone10()    // 10 problems
sounds.playMilestone25()    // 25 problems
sounds.playMilestone50()    // 50 problems!

// Number animations
sounds.playCountUp()        // Counting up tick
sounds.playCountDown()      // Counting down tick
sounds.playNumberReveal()   // Problem appears

// Encouragement
sounds.playWelcomeBack()    // First problem
sounds.playAlmostThere()    // Near completion
sounds.playTryAgain()       // Gentle retry
sounds.playEncouragement()  // You can do it!

// Celebrations
sounds.playCelebration()    // General celebration
sounds.playLevelComplete()  // Level finished
sounds.playStar()          // Star earned

// World-specific
sounds.playWorldSound('lovelycat')
sounds.playWorldSound('jungle')
sounds.playWorldSound('space')
sounds.playWorldSound('ocean')
```

---

## CSS Animation Classes

```tsx
// Entrance animations
<div className="pop-in">Content</div>
<div className="slide-up-in">Content</div>

// Interactive
<button className="wiggle">Hover me</button>
<div className="pulse-glow">Glowing</div>

// Feedback
<div className="scale-bounce">Success!</div>
<div className="shake-animation">Error</div>

// Staggered entrance
<div className="stagger-fade-in stagger-1">First</div>
<div className="stagger-fade-in stagger-2">Second</div>
<div className="stagger-fade-in stagger-3">Third</div>
```

---

## Button Variants

```tsx
import { AnimatedButton } from '@/components/game/enhanced'

<AnimatedButton variant="primary" size="large" emoji="🎮">
  Play Game
</AnimatedButton>

<AnimatedButton variant="success" emoji="✓">
  Correct!
</AnimatedButton>

<AnimatedButton variant="warning" emoji="⚠️">
  Warning
</AnimatedButton>
```

---

## Common Patterns

### Pattern 1: Correct Answer Flow
```typescript
const handleCorrect = (x: number, y: number) => {
  // 1. Play effect (sound + particles)
  playCorrectAnswer(x, y)

  // 2. Update score
  setScore(prev => prev + 10)

  // 3. Move to next after delay
  setTimeout(() => {
    generateNewProblem()
  }, 1500)
}
```

### Pattern 2: Problem Appearance
```typescript
const showNewProblem = () => {
  // 1. Play reveal sound
  sounds.playNumberReveal()

  // 2. Reset state
  resetCombo()
  setSelectedAnswer(null)

  // 3. Component uses AnimatedProblem wrapper for entrance
}
```

### Pattern 3: Milestone Tracking
```typescript
const checkMilestones = (problemNumber: number) => {
  if (problemNumber === 10) {
    sounds.playMilestone10()
  } else if (problemNumber === 25) {
    sounds.playMilestone25()
  } else if (problemNumber === 50) {
    sounds.playMilestone50()
  }

  // Check combo milestones
  if (combo === 5) {
    sounds.playCombo5()
  }
}
```

### Pattern 4: Combo Display
```typescript
{combo >= 3 && (
  <motion.div
    className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
  >
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-bold text-xl">
      🔥 {combo} Streak! 🔥
    </div>
  </motion.div>
)}
```

---

## TypeScript Types

```typescript
// Game effect
interface GameEffect {
  id: string
  type: 'confetti' | 'starBurst' | 'floatingText' | 'ripple' | 'achievement'
  x: number
  y: number
  data?: any
}

// Answer button props
interface AnimatedAnswerProps {
  answer: number | string
  isCorrect?: boolean
  isSelected?: boolean
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  worldColors?: { primary: string; secondary: string }
  size?: 'small' | 'medium' | 'large'
}
```

---

## Troubleshooting

### Particles not showing?
```typescript
// Make sure you're rendering effects:
{effects.map(effect => /* render based on type */)}
```

### Sound not playing?
```typescript
// Resume audio context after user interaction:
sounds.resume()

// Check if enabled:
console.log(sounds.soundEnabled) // should be true

// Check volume:
console.log(sounds.volume) // should be > 0
```

### Animations jerky?
```typescript
// Use hardware-accelerated properties:
// ✓ transform, opacity
// ✗ width, height, top, left
```

---

## File Locations

```
/components/game/
  ├─ AnimatedAnswer.tsx       - Enhanced answer buttons
  ├─ AnimatedButton.tsx       - Enhanced buttons
  ├─ ParticleEffects.tsx      - Visual effects
  ├─ EnhancedGameExample.tsx  - Working demo
  └─ enhanced/
     └─ index.ts              - Export index

/lib/
  ├─ sounds/
  │  └─ webAudioSounds.ts    - Sound manager (enhanced)
  └─ hooks/
     └─ useGameEffects.ts    - Effects hook

/app/
  └─ globals.css              - CSS animations

Documentation:
  ├─ ENHANCEMENTS.md          - Full API reference
  ├─ VISUAL_GUIDE.md          - Visual details
  ├─ IMPLEMENTATION_SUMMARY.md - Overview
  └─ QUICK_REFERENCE.md       - This file!
```

---

## Need More Help?

1. See `EnhancedGameExample.tsx` for complete working code
2. Read `ENHANCEMENTS.md` for full API documentation
3. Check `VISUAL_GUIDE.md` for animation details
4. Component files have detailed JSDoc comments

That's it! You're ready to go! 🚀
