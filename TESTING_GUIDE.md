# MathQuest Worlds - Testing Guide

## Quick Test Checklist

### 1. Shorter Modules ✅
```bash
# Verify all modules are 5-7 questions
grep "questionsCount:" lib/constants/levels.ts
```

**Expected:** All modules should show 5, 6, or 7 (NO 10s)

**Manual Test:**
1. Start any module
2. Count questions - should be 5-7, not 10
3. Check completion time - should be faster and less tiring

---

### 2. Adaptive Diagnostic System 🧪

**Test Setup:**
```typescript
// In browser console or dev tools
localStorage.removeItem('mathquest-progress')
// Refresh page
```

**Test Flow:**
1. **First Time User:**
   - [ ] Diagnostic quiz appears automatically
   - [ ] Shows "Question 1 of 10"
   - [ ] Progress bar fills correctly
   - [ ] Can select answers
   - [ ] Correct answers show green ✓
   - [ ] Wrong answers show red ✗
   - [ ] All 10 questions complete

2. **Results Screen:**
   - [ ] Shows score (X/10)
   - [ ] Shows percentage
   - [ ] Shows skill level badge
   - [ ] Shows personalized feedback
   - [ ] Avatar appears and animates
   - [ ] "Let's Start Learning" button works

3. **Skill Levels:**

   **Test Beginner (0-4 correct):**
   - Answer 3-4 questions correctly
   - [ ] Should show "Beginner Level" 🌱
   - [ ] Feedback mentions visual counting
   - [ ] Modules should be easier when started

   **Test Intermediate (5-7 correct):**
   - Answer 5-6 questions correctly
   - [ ] Should show "Intermediate Level" ⭐
   - [ ] Feedback mentions balanced challenge
   - [ ] Modules use standard difficulty

   **Test Advanced (8-10 correct):**
   - Answer 8-10 questions correctly
   - [ ] Should show "Advanced Level" 🚀
   - [ ] Feedback mentions harder problems
   - [ ] Modules should have bigger numbers

4. **Persistence:**
   - Complete diagnostic
   - Refresh page
   - [ ] Diagnostic should NOT show again
   - [ ] Skill level should be remembered

---

### 3. Better Avatar (Duolingo-Style) 👁️

**Visual Inspection:**
1. Navigate to character creator or any avatar display
2. **Check Eyes:**
   - [ ] Eyes are BIGGER (noticeably larger than before)
   - [ ] Eyes have double sparkle highlights (white dots)
   - [ ] Pupils are black with depth
   - [ ] Eyes blink occasionally
   - [ ] Eyebrows appear above eyes
   - [ ] Eyebrows animate slightly

3. **Check Smile:**
   - [ ] Smile is WIDER (30px)
   - [ ] Smile has more personality (curved edges)
   - [ ] Smile animates (pulses slightly)
   - [ ] Tongue appears occasionally (watch for ~6 seconds)

4. **Compare to Before:**
   - Eyes should be ~44% bigger
   - Smile should be ~50% wider
   - Overall more expressive and appealing

---

### 4. World-Specific Sounds 🔊

**Test Each World:**

**Jungle World:**
```typescript
// In browser console
import { sounds } from '@/lib/sounds/webAudioSounds'

sounds.playJungleBird()     // Should hear chirping trill
sounds.playJungleMonkey()   // Should hear "ooh ooh" sound
sounds.playTropicalAmbient() // Should hear soft jungle ambience

// Or use auto-selector
sounds.playWorldSound('jungle') // Random jungle sound
```

- [ ] Bird call is high-pitched, quick ascending trill
- [ ] Monkey sound has low-high-low pattern
- [ ] Ambient is subtle, layered tones

**Space World:**
```typescript
sounds.playSpaceBeep()      // Futuristic beep-beep
sounds.playCosmicWhoosh()   // Swoosh upward
sounds.playStarTwinkle()    // High sparkles

sounds.playWorldSound('space') // Random space sound
```

- [ ] Beeps sound electronic/sci-fi
- [ ] Whoosh sweeps from low to high frequency
- [ ] Twinkle is high-pitched, delicate

**Ocean World:**
```typescript
sounds.playBubble()          // Bubble pop
sounds.playWhaleCall()       // Deep whale song
sounds.playUnderwaterAmbient() // Low rumbling

sounds.playWorldSound('ocean') // Random ocean sound
```

- [ ] Bubble has two-part pop (low then high)
- [ ] Whale call is slow frequency sweep (haunting)
- [ ] Ambient is very low, rumbling

**General:**
- [ ] All sounds respect volume setting
- [ ] Sounds don't overlap badly
- [ ] Audio context resumes after user interaction
- [ ] Sounds play correctly on mobile

---

### 5. Integration Tests 🔗

**Test Adaptive Difficulty in Action:**

1. **Set Skill to Beginner:**
   ```typescript
   // Console
   const store = useProgressStore.getState()
   store.recordDiagnostic(3, 10) // 3/10 = beginner
   ```

2. Start Module 1-1 (Count to 5)
   - [ ] Max number should be reduced (around 3 instead of 5)
   - [ ] Should use tap/choice interactions only
   - [ ] Problems feel easier

3. **Set Skill to Advanced:**
   ```typescript
   store.recordDiagnostic(9, 10) // 9/10 = advanced
   ```

4. Start same module
   - [ ] Max number should be increased (around 7-8)
   - [ ] May include trace interactions
   - [ ] Problems feel harder

**Test Sound Integration:**

1. Navigate to Jungle World
   - [ ] Play a question
   - [ ] Random jungle sounds should play during gameplay
   - [ ] Sounds enhance immersion

2. Navigate to Space World
   - [ ] Different sounds than jungle
   - [ ] Sci-fi theme consistent

3. Navigate to Ocean World
   - [ ] Underwater sounds distinct
   - [ ] Bubble sounds on interactions

---

## Performance Tests

**Load Time:**
- [ ] Diagnostic loads quickly (<1 second)
- [ ] Avatar renders without lag
- [ ] Sounds initialize without delay

**Memory:**
- [ ] No memory leaks after multiple diagnostics
- [ ] Audio context properly managed
- [ ] Store persists correctly

**Mobile:**
- [ ] Diagnostic works on iOS Safari
- [ ] Diagnostic works on Android Chrome
- [ ] Sounds work on mobile (after user interaction)
- [ ] Avatar displays correctly on small screens
- [ ] Touch interactions work smoothly

---

## Regression Tests

**Make sure we didn't break:**
- [ ] Character creation still works
- [ ] World selection still works
- [ ] Module progression still works
- [ ] Star rewards still work
- [ ] Streak tracking still works
- [ ] Settings (sound toggle) still work
- [ ] Progress persistence still works

---

## User Acceptance Tests (7-Year-Old)

**Attention Span:**
- [ ] Kid completes 5-7 question module without frustration
- [ ] Doesn't say "this is taking too long"
- [ ] Stays engaged throughout

**Diagnostic:**
- [ ] Kid understands the questions
- [ ] Can select answers without help
- [ ] Reacts positively to results screen
- [ ] Excited to start after seeing skill level

**Avatar:**
- [ ] Kid comments on or notices the avatar
- [ ] Shows interest in customization
- [ ] Refers to avatar as "my character"

**Sounds:**
- [ ] Kid reacts to different world sounds
- [ ] Can identify which world they're in by sound
- [ ] Asks for sound to be on (not off)

---

## Bug Report Template

If you find issues, document them:

```
**Issue:** [Brief description]

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**


**Actual Behavior:**


**Screenshots/Videos:**


**Environment:**
- Browser:
- Device:
- OS:

**Severity:** [Low / Medium / High / Critical]

**Related Files:**

```

---

## Success Criteria

All improvements are successful if:

✅ **Shorter Modules:**
- Kids complete modules faster (2-3 minutes instead of 5+)
- Completion rate increases
- Less mid-module abandonment

✅ **Adaptive Diagnostic:**
- Skill levels distribute evenly (not all beginner)
- Kids at right difficulty level (not too hard/easy)
- Re-assessment needed < 10% of time

✅ **Better Avatar:**
- Kids comment positively on avatar
- More time spent customizing
- Avatar becomes memorable

✅ **World Sounds:**
- Kids can identify worlds by sound alone
- Sound adds to enjoyment (not distraction)
- Request to keep sound on

---

## Next Steps After Testing

1. Collect feedback from 3-5 kids (ages 6-8)
2. Monitor analytics:
   - Module completion rates
   - Time spent per module
   - Diagnostic score distribution
   - Sound on/off preference
3. Iterate based on data
4. Consider adding more world sounds
5. Explore avatar reactions to answers

---

**Happy Testing!** 🚀
