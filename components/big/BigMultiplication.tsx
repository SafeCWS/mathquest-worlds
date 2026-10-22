'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useAnimate, useIsPresent } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { KidButton } from '@/components/ui/KidButton'
import { sfx } from '@/lib/audio/sfx'
import { misconceptionHint, type StepHighlight } from '@/lib/math/stepScripts'
import { daysPlayedStreak, markPlayedToday } from '@/lib/stores/daysPlayed'
import { cancelSpeech } from '@/lib/sounds/speechUtils'
import { BIG_LEVELS, drawProblem, emptyDeck, levelOf, nextProblem, type BigLevel, type BigProblem, type DeckState, type Difficulty } from '@/lib/math/twoDigitProblems'
import { GAMES_TO_UNLOCK, PROBLEMS_PER_GAME, useBigMultStore } from '@/lib/stores/bigMultStore'
import { BreakApart } from './BreakApart'
import { ColumnSteps } from './ColumnSteps'
import { DragonOops } from './DragonOops'
import { FlipSplit } from './FlipSplit'
import { GEMS_PER_PROBLEM, useHoardStore } from './logic'
import { ReadAlongText, useReadAlong } from './ReadAlong'
import { StoryMissions } from './StoryMissions'
import { isVoiceOn, setVoiceOn, speakFor } from './speech'
import { markWalkthroughSeen, resetWalkthrough, walkthroughSeen } from './Demo'
import { PV_TEXT } from './pv'
import { BIG_MODES, isBigMode, type BigMode, type HintLadder, type MascotEvent, type ModeProps } from './types'

const BOUNCY: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

// Review/test deep link (?level=3&mode=column&a=78&b=8) — development only, never in production.
const DEEP_LINK_ENABLED = process.env.NODE_ENV !== 'production'

// false on the server and during hydration, true once mounted in the browser.
const noopSubscribe = () => () => {}
function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

const LEVEL_STYLE: Record<BigLevel, string> = {
  // One shade darker than the prototype so white text clears 4.5:1 (html-validator M3).
  1: 'from-green-700 to-emerald-800 border-green-200',
  2: 'from-sky-700 to-blue-800 border-sky-200',
  3: 'from-purple-700 to-fuchsia-800 border-purple-200',
}
// v2: the two favorites first, then the two new games, then the optional extra.
const MODE_META: Record<BigMode, { emoji: string; style: string; title: string; desc: string; extra?: boolean }> = {
  split: { emoji: '✂️', style: 'from-pink-700 to-pink-800 border-pink-200', title: 'modeSplit', desc: 'modeSplitDesc' },
  column: { emoji: '🪜', style: 'from-teal-700 to-cyan-800 border-teal-200', title: 'modeColumn', desc: 'modeColumnDesc' },
  story: { emoji: '📖', style: 'from-orange-700 to-orange-800 border-orange-200', title: 'modeStory', desc: 'modeStoryDesc' },
  flip: { emoji: '🔄', style: 'from-indigo-600 to-violet-800 border-indigo-200', title: 'modeFlip', desc: 'modeFlipDesc' },
  oops: { emoji: '🐉', style: 'from-emerald-700 to-teal-800 border-emerald-200', title: 'modeOops', desc: 'modeOopsDesc', extra: true },
}
const MODE_COMPONENT: Record<BigMode, (p: ModeProps) => React.ReactElement> = {
  split: BreakApart,
  column: ColumnSteps,
  story: StoryMissions,
  flip: FlipSplit,
  oops: DragonOops,
}
// Story Missions and Flip & Split show the problem inside the game (the story / the rectangle):
// the header must not give "42 × 3" away before the child has built it.
const HIDE_PROBLEM: readonly BigMode[] = ['story', 'flip']

/** Wraps the hint bubble's buttons: once the bubble is leaving (exit animation, or an exit that
 *  never completes) its ✕ / Read it stop catching taps, so they can never sit invisibly on a target. */
function LiveTaps({ children }: { children: React.ReactNode }) {
  const present = useIsPresent()
  return <span className={present ? 'contents' : 'contents [&_button]:pointer-events-none'}>{children}</span>
}

/** 💎 N — the dragon's hoard. Gems are earned for finishing a problem, never lost. */
function HoardChip({ gems, label, big }: { gems: number; label: string; big?: boolean }) {
  return (
    <motion.span
      key={gems}
      className={`inline-flex items-center gap-1 bg-white/90 rounded-full shadow font-bold ${big ? 'text-xl px-4 py-1' : 'text-base px-3 py-0.5'}`}
      style={{ color: 'var(--space-primary)' }}
      initial={{ scale: 1.25 }}
      animate={{ scale: 1 }}
      transition={{ ease: BOUNCY, duration: 0.5 }}
      aria-label={label}
      data-testid="hoard-chip"
      data-gems={gems}
    >
      <span aria-hidden="true">💎</span>
      <span data-testid="hoard-count">{gems}</span>
    </motion.span>
  )
}

/** Fixed, always-visible back button — same spot in portrait and landscape. */
function BackButton({ label, href, onClick }: { label: string; href?: string; onClick?: () => void }) {
  const cls = `fixed z-50 left-3 min-w-[60px] min-h-[60px] px-4 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full
               shadow-lg border-2 border-white flex items-center justify-center gap-2 text-xl font-bold`
  const style = { top: 'calc(var(--safe-area-inset-top) + 12px)' }
  const inner = (
    <>
      <span aria-hidden="true">{'⬅️'}</span>
      <span className="hidden sm:inline">{label}</span>
    </>
  )
  if (href) {
    return (
      <Link href={href} aria-label={label} className={cls} style={style} data-testid="back-btn">
        {inner}
      </Link>
    )
  }
  return (
    <motion.button type="button" onClick={onClick} aria-label={label} className={cls} style={style} whileTap={{ scale: 0.9 }} data-testid="back-btn">
      {inner}
    </motion.button>
  )
}

/** Streak sparkle: a short star fan beside the companion (decoration only). */
function StreakSparkle() {
  return (
    <span className="relative w-0 h-0" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => {
        const ang = (i / 6) * Math.PI * 2
        return (
          <motion.span key={i} className="absolute text-xl" initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
            animate={{ x: Math.cos(ang) * 50, y: Math.sin(ang) * 40, opacity: 0, scale: 1.2 }} transition={{ duration: 0.9, ease: 'easeOut' }}>
            {i % 2 ? '✨' : '⭐'}
          </motion.span>
        )
      })}
    </span>
  )
}

function Pips({ done }: { done: number }) {
  return (
    <span className="flex gap-1.5" aria-hidden="true">
      {Array.from({ length: GAMES_TO_UNLOCK }, (_, i) => (
        <span key={i} className={`w-4 h-4 rounded-full border-2 border-white ${i < done ? 'bg-yellow-300' : 'bg-white/30'}`} />
      ))}
    </span>
  )
}

function Celebration({ text, sub, cta, onNext, extra }: { text: string; sub: string; cta: string; onNext: () => void; extra?: string | null }) {
  const bits = ['✨', '⭐', '🌟', '💫', '🎉', '✨', '⭐', '🌟']
  // Modal focus trap (hackerAI #17) — same hand-rolled Tab cycle as components/ui/SlideOver.tsx.
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialog.current) return
      const f = Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'))
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      const inside = dialog.current.contains(document.activeElement)
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return (
    <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="relative game-card max-w-md w-full text-center"
        initial={{ scale: 0.3, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ease: BOUNCY, duration: 0.55 }}
        data-testid="celebration"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={text}
      >
        {bits.map((b, i) => {
          const ang = (i / bits.length) * Math.PI * 2
          return (
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 text-3xl pointer-events-none"
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
              animate={{ x: Math.cos(ang) * 170, y: Math.sin(ang) * 140, opacity: 0, scale: 1.3 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              aria-hidden="true"
            >
              {b}
            </motion.span>
          )
        })}
        <p className="text-6xl mb-2" aria-hidden="true">🏆</p>
        <p className="text-3xl font-bold text-emerald-600">{text}</p>
        <p className="text-2xl font-bold text-gray-700 mt-1">{sub}</p>
        {extra && <p className="text-xl font-bold text-purple-600 mt-2">{extra}</p>}
        <KidButton aria-label={cta} onClick={onNext} sound="pop" autoFocus className="mt-5 w-full text-2xl border-yellow-300" data-testid="next-btn">
          {cta}
        </KidButton>
      </motion.div>
    </motion.div>
  )
}

// Phone (≤ 480 px): after every step change, scroll so the step's active cells ([data-active]:
// the glowing digit, the carry bubble, the piece being solved) sit fully between the fixed top
// controls and the bottom answer sheet. iPad never scrolls here (the pad is a side column).
function ensureActiveVisible(): void {
  if (typeof window === 'undefined' || window.innerWidth > 480) return
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-testid=mode-area] [data-active="1"]'))
  if (!els.length) return
  const rects = els.map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0)
  if (!rects.length) return
  const top = Math.min(...rects.map((r) => r.top))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  const dock = document.querySelector('.action-dock')?.getBoundingClientRect()
  const floor = (dock && dock.height > 0 ? dock.top : window.innerHeight) - 10
  const ceiling = 92 // below the fixed Back / 🔊 / Hint buttons
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let dy = 0
  if (bottom > floor) dy = bottom - floor
  if (top - dy < ceiling) dy = top - ceiling // taller than the gap: keep the top edge in view
  if (Math.abs(dy) > 2) window.scrollBy({ top: dy, behavior: reduce ? 'auto' : 'smooth' })
}

export function BigMultiplication() {
  const t = useTranslations('bigMult')
  const locale = useLocale()
  const params = useSearchParams()
  const { _hasHydrated, gamesDone, recordGameComplete, isUnlocked } = useBigMultStore()
  const gems = useHoardStore((s) => s.gems)
  const addGems = useHoardStore((s) => s.add)
  const hoardHydrated = useHoardStore((s) => s._hasHydrated)
  const mounted = useMounted()

  // Development-only deep link for review/screenshots/e2e: ?level=3&mode=column&a=78&b=8
  const deepLink = useMemo(() => {
    if (!DEEP_LINK_ENABLED) return { mode: null, problem: null, level: 1 as BigLevel }
    const mode = params.get('mode')
    const a = Number(params.get('a'))
    const b = Number(params.get('b'))
    const p: BigProblem | null = Number.isInteger(a) && Number.isInteger(b) && levelOf({ a, b }) ? { a, b } : null
    const lvlParam = Number(params.get('level'))
    const level: BigLevel = p ? (levelOf(p) as BigLevel) : lvlParam === 2 || lvlParam === 3 ? lvlParam : 1
    return { mode: isBigMode(mode) ? mode : null, problem: p, level }
  }, [params])

  const [level, setLevel] = useState<BigLevel>(deepLink.level)
  const [mode, setMode] = useState<BigMode | null>(deepLink.mode)
  const [problem, setProblem] = useState<BigProblem | null>(deepLink.mode ? deepLink.problem ?? nextProblem(deepLink.level, null, 0) : null)
  const [, setServed] = useState(1) // problems served this visit (kept for adaptivity tuning)
  // Shuffle deck: lives for the whole visit, so a new game never restarts the same order.
  const deck = useRef<DeckState>(emptyDeck())
  const deal = (lvl: BigLevel, difficulty: Difficulty = 'same'): BigProblem => {
    const { problem: p, state } = drawProblem(deck.current, lvl, difficulty)
    deck.current = state
    return p
  }
  const [solvedInGame, setSolvedInGame] = useState(0)
  const [problemKey, setProblemKey] = useState(0)
  // Hint ladder: 0 = closed, 1 nudge, 2 show the step, 3 worked step. Amber, never red.
  const [ladder, setLadder] = useState<HintLadder | null>(null)
  const [tier, setTier] = useState<0 | 1 | 2 | 3>(0)
  const [misconception, setMisconception] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<StepHighlight | null>(null)
  const [speech, setSpeechText] = useState('')
  const [shakeScope, animateShake] = useAnimate<HTMLDivElement>()
  // `serial` names the problem being played: it changes on a new game / next problem, NOT on
  // "Show me again" (same problem). Credit and the celebration are keyed by it, exactly once.
  const [serial, setSerial] = useState(0)
  const [awardedSerial, setAwardedSerial] = useState(-1)
  const [celebrate, setCelebrate] = useState<null | { serial: number; gameDone: boolean; unlocked: BigLevel | null }>(null)
  const live = useRef<{ serial: number; mode: BigMode | null }>({ serial: 0, mode: deepLink.mode })
  const award = useRef<null | { serial: number; gameDone: boolean; unlocked: BigLevel | null }>(null)
  const presented = useRef(-1)
  const focusPromptNext = useRef(false)
  const nextFor = useRef(-1) // one Next per problem: a double tap never skips a problem
  const [mascot, setMascot] = useState<{ text: string; mood: 'happy' | 'think' | 'party'; key: number }>({ text: '', mood: 'happy', key: 0 })
  // Quiet adaptivity (never shown): first-try run and misses on the current step.
  const missesOnStep = useRef(0)
  const problemHadMiss = useRef(false)
  const struggled = useRef(false)
  const firstTryRun = useRef(0)
  const stepStreak = useRef(0)
  // Read once on the client; nothing renders `days` before the mounted gate below.
  const [days, setDays] = useState(() => (typeof window === 'undefined' ? 0 : daysPlayedStreak()))
  // Voice on/off (localStorage mq-big-voice). Read on the client only; nothing renders it
  // before the mounted gate below, so there is no SSR mismatch.
  const [voiceOn, setVoiceState] = useState(() => (typeof window === 'undefined' ? true : isVoiceOn()))
  // First-time walkthrough per mode (localStorage `mq-big-walkthrough-<mode>`).
  const [demo, setDemo] = useState(false)
  const demoRef = useRef(false)
  useEffect(() => {
    demoRef.current = demo
  }, [demo])

  // What is on screen right now — a deferred onSolved from an earlier problem (or after Back)
  // compares against this and is ignored (code-reviewer #2 / hackerAI #7).
  useLayoutEffect(() => {
    live.current = { serial, mode }
  }, [serial, mode])

  const say = useCallback((text: string, mood: 'happy' | 'think' | 'party' = 'happy') => {
    setMascot((m) => ({ text, mood, key: m.key + 1 }))
  }, [])
  // Phone: re-frame the active cells once a layout change (hint, mascot line) has settled (M1).
  const reframe = useCallback(() => {
    window.setTimeout(ensureActiveVisible, 450)
    window.setTimeout(ensureActiveVisible, 1000)
  }, [])

  useEffect(() => {
    const onResize = () => ensureActiveVisible()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- React Compiler is not enabled in this app; this useCallback IS the memoization (mode effects list it as a dependency).
  const setHint = useCallback((l: HintLadder) => {
    // New step: re-frame the work on phone once the step's entry animations have settled.
    window.setTimeout(ensureActiveVisible, 450)
    window.setTimeout(ensureActiveVisible, 1000)
    // New step: close the ladder, forget the step's misses.
    setLadder(l)
    setTier(0)
    setMisconception(null)
    setHighlight(null)
    missesOnStep.current = 0
  }, [])
  const setSpeech = useCallback((txt: string) => setSpeechText(txt), [])

  useEffect(() => () => cancelSpeech(), [])
  useEffect(() => {
    if (mode && problem && solvedInGame === 0 && !walkthroughSeen(mode)) {
      // Syncs from localStorage (an external store) when a game starts; runs only on game/problem change.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDemo(true)
      say(t('demoMascot'))
      return
    }
    if (mode && problem) say(t('mascotHi'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemKey, mode])

  const resetProblemTrackers = () => {
    problemHadMiss.current = false
    missesOnStep.current = 0
  }

  const startGame = (m: BigMode) => {
    if (!isUnlocked(level)) return
    setCelebrate(null) // never carry a celebration (or its answer) into a new game — hackerAI #1
    setDemo(false) // the effect below turns it back on only if this mode's walkthrough is unseen
    setTier(0)
    setMode(m)
    setProblem(deal(level))
    setServed(1)
    setSolvedInGame(0)
    setSerial((x) => x + 1)
    setProblemKey((k) => k + 1)
    resetProblemTrackers()
  }

  // Back from a game: stop the voice, drop any celebration / walkthrough / open hint.
  // A walkthrough left mid-way is NOT marked seen (hackerAI #12): it runs again next time.
  const leaveGame = () => {
    cancelSpeech()
    setCelebrate(null)
    setDemo(false)
    setTier(0)
    setMode(null)
    setProblem(null)
  }

  const onWrong = useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization -- React Compiler is not enabled in this app; this useCallback IS the memoization (modes call it from effects).
    (finalAnswer?: number, modeHint?: string) => {
      sfx.wrong()
      stepStreak.current = 0
      if (shakeScope.current) void animateShake(shakeScope.current, { x: [0, -12, 12, -8, 8, 0] }, { duration: 0.45 })
      problemHadMiss.current = true
      missesOnStep.current += 1
      if (missesOnStep.current >= 2) struggled.current = true // next problem: easier, same level
      // Known error pattern first (lib/math/stepScripts), else the current step's tier-2 hint.
      // A mode's own misconception hint (Flip & Split, Dragon Oops, Story Missions) wins.
      const mh = modeHint ? null : problem && finalAnswer !== undefined ? misconceptionHint(problem.a, problem.b, finalAnswer, locale) : null
      setMisconception(modeHint ?? (mh ? mh.text : null))
      setHighlight(mh ? mh.highlight : null)
      setTier((cur) => (cur >= 2 ? cur : 2)) // progress is never touched
      say(t('mascotWrong'), 'think')
      reframe()
    },
    [animateShake, shakeScope, problem, locale, say, t, reframe],
  )

  const onStep = useCallback(
    (event?: MascotEvent) => {
      sfx.stepComplete()
      if (demoRef.current) return // the dragon's own demo step never counts toward streaks/adaptivity
      stepStreak.current += missesOnStep.current === 0 ? 1 : 0
      if (stepStreak.current >= 3) {
        sfx.streak(stepStreak.current)
        say(t('mascotStreak', { n: stepStreak.current }), 'party')
      } else {
        say(event === 'trade' ? t('mascotTrade') : event === 'oops' ? t('mascotOops') : t('mascotStep'), 'happy')
      }
    },
    [say, t],
  )

  // The answer was accepted: record gems + game progress NOW, exactly once per problem (`serial`),
  // so a reload or Back during the finale animation keeps the credit (hackerAI #13) and a double
  // tap / repeated call never doubles it (code-reviewer #1 / hackerAI #10).
  const onAward = useCallback(() => {
    if (live.current.serial !== serial || !live.current.mode) return null // stale: earlier problem / after Back
    if (award.current?.serial === serial) return award.current
    markPlayedToday()
    setDays(daysPlayedStreak())
    firstTryRun.current = problemHadMiss.current ? 0 : firstTryRun.current + 1
    const n = solvedInGame + 1
    setSolvedInGame(n)
    setAwardedSerial(serial)
    addGems(GEMS_PER_PROBLEM) // the hoard only ever grows
    let unlocked: BigLevel | null = null
    if (n >= PROBLEMS_PER_GAME) {
      const wasLocked = level < 3 && !isUnlocked((level + 1) as BigLevel)
      recordGameComplete(level)
      const nowOpen = level < 3 && useBigMultStore.getState().isUnlocked((level + 1) as BigLevel)
      if (wasLocked && nowOpen) unlocked = (level + 1) as BigLevel
    }
    award.current = { serial, gameDone: n >= PROBLEMS_PER_GAME, unlocked }
    return award.current
  }, [serial, solvedInGame, level, isUnlocked, recordGameComplete, addGems])

  // The mode's finale is over: sounds, the dragon's line, the celebration — once per problem.
  const onSolved = useCallback(() => {
    const a = onAward()
    if (!a || presented.current === serial) return
    presented.current = serial
    say(t('mascotSolved'), 'party')
    if (a.gameDone) {
      // levelUp() is the long one — never in the same tick as correct().
      if (a.unlocked) window.setTimeout(() => sfx.levelUp(), 0)
      else sfx.correct()
      setCelebrate({ serial, gameDone: true, unlocked: a.unlocked })
    } else {
      sfx.correct()
      stepStreak.current += 1
      if (stepStreak.current >= 2) window.setTimeout(() => sfx.streak(stepStreak.current), 350)
      // Story Missions shows its own finale ("126 gems in all!" + Next story).
      if (mode !== 'story') setCelebrate({ serial, gameDone: false, unlocked: null })
    }
  }, [onAward, serial, say, t, mode])

  const next = () => {
    if (nextFor.current === serial) return
    nextFor.current = serial
    const wasDone = celebrate?.gameDone
    setCelebrate(null)
    if (wasDone) {
      setMode(null)
      setProblem(null)
      return
    }
    // Quiet adaptivity: 2 misses on one step → easier; 3 first-try solves in a row → harder.
    let difficulty: Difficulty = 'same'
    if (struggled.current) difficulty = 'easier'
    else if (firstTryRun.current >= 3) {
      difficulty = 'harder'
      firstTryRun.current = 0
    }
    struggled.current = false
    setProblem(deal(level, difficulty))
    setServed((x) => x + 1)
    setSerial((x) => x + 1)
    setProblemKey((k) => k + 1)
    resetProblemTrackers()
    focusPromptNext.current = true // keyboard / switch users land on the new step (hackerAI #17)
  }

  // After Next: move focus from the closed dialog to the new step's prompt.
  useEffect(() => {
    if (!focusPromptNext.current) return
    focusPromptNext.current = false
    const id = window.setTimeout(() => {
      const el =
        document.querySelector<HTMLElement>('[data-testid=mode-area] .dock-prompt') ??
        document.querySelector<HTMLElement>('[data-testid=mode-area] button[data-active="1"]') ??
        document.querySelector<HTMLElement>('[data-testid=problem]')
      if (!el) return
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
      el.focus({ preventScroll: true })
    }, 120)
    return () => window.clearTimeout(id)
  }, [problemKey])

  const endDemo = useCallback(() => {
    setDemo(false)
    if (mode) markWalkthroughSeen(mode)
    say(t('yourTurn'), 'party')
  }, [mode, say, t])
  const narrate = useCallback((text: string) => speakFor(locale, text), [locale])
  const hintReader = useReadAlong(narrate)
  const showAgain = () => {
    if (!mode) return
    resetWalkthrough(mode)
    cancelSpeech()
    setProblemKey((k) => k + 1) // same problem, fresh step 1
    resetProblemTrackers()
    setDemo(true)
    say(t('demoMascot'))
  }

  const tapHint = () => {
    setTier((cur) => {
      const nt = (cur >= 3 ? 1 : cur + 1) as 1 | 2 | 3
      if (nt === 3 && ladder?.highlight) setHighlight(ladder.highlight)
      return nt
    })
    say(t('mascotHint'), 'happy')
    reframe()
  }

  const hintText = !ladder || tier === 0 ? '' : tier === 1 ? ladder.nudge : tier === 2 ? misconception ?? ladder.step : ladder.worked

  // Hint placement (hackerAI #8 / html-validator M2): the bubble never sits on what the child has
  // to tap or look at. It starts at the top of the play area and slides down past every enabled
  // button, "Show me again", and every glowing step cell ([data-active], up to 200 px tall — the
  // whole-picture wrappers are bigger and are not targets). On phone the fixed answer sheet is a
  // floor: if no clear spot fits above it, the spot covering the least wins. The bubble itself lets
  // taps through (pointer-events only on ✕ and Read it).
  const playArea = useRef<HTMLDivElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const [hintTop, setHintTop] = useState(0)
  const placeHint = useCallback(() => {
    const box = playArea.current
    const bub = bubble.current
    if (!box || !bub) return
    const c = box.getBoundingClientRect()
    const r = bub.getBoundingClientRect()
    const w = bub.offsetWidth
    const h = bub.offsetHeight
    const cx = (r.left + r.right) / 2
    const left = cx - w / 2
    const right = cx + w / 2
    const dock = box.querySelector<HTMLElement>('.action-dock')
    const dockFixed = !!dock && getComputedStyle(dock).position === 'fixed'
    const floor = dockFixed && dock ? dock.getBoundingClientRect().top - c.top : Infinity
    const GAP = 8
    const avoid = Array.from(
      box.querySelectorAll<HTMLElement>('[data-testid=demo-again], [data-testid=demo-banner], [data-testid=mode-area] button:not([disabled]), [data-testid=mode-area] [data-active="1"]'),
    )
      .filter((e) => !(dockFixed && dock?.contains(e)))
      .map((e) => e.getBoundingClientRect())
      .filter((b) => b.width > 0 && b.height > 0 && b.height <= 200 && b.right > left && b.left < right)
      .map((b) => ({ top: b.top - c.top, bottom: b.bottom - c.top }))
    const covered = (y: number) =>
      avoid.reduce((sum, b) => sum + Math.max(0, Math.min(y + h + GAP, b.bottom + GAP) - Math.max(y, b.top)), 0)
    const candidates = [0, ...avoid.map((b) => b.bottom + GAP)].sort((x, y) => x - y)
    const fits = candidates.filter((v) => v + h <= floor)
    const y =
      fits.find((v) => covered(v) === 0) ??
      (fits.length ? fits.reduce((best, v) => (covered(v) < covered(best) ? v : best), fits[0]) : 0)
    setHintTop((cur) => (Math.abs(cur - y) < 1 ? cur : y))
  }, [])
  useLayoutEffect(() => {
    if (tier === 0 || !hintText) return
    placeHint()
    const ids = [window.setTimeout(placeHint, 450), window.setTimeout(placeHint, 1000)] // after step animations
    window.addEventListener('resize', placeHint)
    return () => {
      ids.forEach((id) => window.clearTimeout(id))
      window.removeEventListener('resize', placeHint)
    }
  }, [tier, hintText, placeHint])
  // A tap anywhere outside the bubble (and the Hint / voice buttons) closes it; the tap still
  // reaches what it was aimed at.
  useEffect(() => {
    if (tier === 0) return
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null
      if (!el || el.closest('[data-testid=hint-bubble], [data-testid=hint-btn], [data-testid=voice-toggle]')) return
      hintReader.stop()
      setTier(0)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [tier, hintReader])
  const readAloud = () => {
    // Speak the open hint when there is one (word highlight follows), otherwise the current prompt.
    if (hintText) hintReader.read(hintText)
    else speakFor(locale, speech)
  }
  const toggleVoice = () => {
    const next = !voiceOn
    setVoiceOn(next) // muting cancels a sentence in progress (and every read-along highlight)
    if (!next) hintReader.stop()
    setVoiceState(next)
    if (next) speakFor(locale, hintText || speech) // turning on reads the current step once
  }

  // L155 / SP-29: never paint locks or progress before the persisted store has hydrated —
  // a returning kid with Level 2 open must not see it flash locked.
  if (!mounted || !_hasHydrated || !hoardHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-300 via-teal-300 to-cyan-400" data-testid="big-loading">
        <motion.div
          className="text-7xl"
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          aria-hidden="true"
        >
          🏗️
        </motion.div>
      </div>
    )
  }

  // ───────────── Level + mode picker ─────────────
  if (!mode || !problem) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-300 via-teal-300 to-cyan-400 relative overflow-hidden no-x-scroll" data-screen="picker">
        <BackButton label={t('back')} href="/multiplication" />
        {/* English only (operator ruling 2026-10-22): no EN/ES toggle here. */}
        <main className="relative z-10 max-w-3xl mx-auto px-4 pt-24 pb-10">
          <motion.h1
            className="text-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: BOUNCY, duration: 0.5 }}
          >
            <span className="prompt-pill text-4xl md:text-5xl font-bold px-6 py-2">🏗️ {t('title')}</span>
          </motion.h1>
          <p className="text-center -mt-3 mb-4">
            <HoardChip gems={gems} label={t('hoardLabel', { n: gems })} big />
          </p>
          {days > 0 && (
            <p className="text-center -mt-3 mb-5" data-testid="days-streak">
              <span className="inline-block bg-white/85 text-emerald-700 font-bold text-lg rounded-full px-4 py-1 shadow">{t('daysStreak', { n: days })}</span>
            </p>
          )}

          <h2 className="mb-3"><span className="prompt-pill text-2xl font-bold">{t('pickLevel')}</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {BIG_LEVELS.map((l, i) => {
              const open = isUnlocked(l)
              const selected = l === level
              return (
                <motion.button
                  key={l}
                  type="button"
                  onClick={() => {
                    if (!open) {
                      sfx.tap()
                      return
                    }
                    sfx.tap()
                    setLevel(l)
                  }}
                  aria-pressed={selected}
                  aria-disabled={!open}
                  data-testid={`level-${l}`}
                  className={`relative min-h-[120px] rounded-3xl p-4 text-left border-4 shadow-xl flex flex-col gap-1
                    ${open ? `bg-gradient-to-br ${LEVEL_STYLE[l]}` : 'bg-gray-600/90 border-gray-300/60 cursor-not-allowed'}
                    ${selected && open ? 'ring-4 ring-yellow-300 ring-offset-2' : ''}`}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: selected ? 1.03 : 1 }}
                  transition={{ delay: i * 0.08, ease: BOUNCY, duration: 0.45 }}
                  whileTap={{ scale: 0.93 }}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white drop-shadow">{t(`level${l}`)}</span>
                    <span className="text-2xl" aria-hidden="true">{open ? (gamesDone[l] >= GAMES_TO_UNLOCK ? '👑' : '⭐') : '🔒'}</span>
                  </span>
                  <span className="text-white font-semibold">{t(`level${l}Desc`)}</span>
                  {open ? (
                    <span className="flex items-center gap-2 mt-auto">
                      <Pips done={Math.min(gamesDone[l], GAMES_TO_UNLOCK)} />
                      <span className="text-white text-sm font-bold">{t('gamesDone', { done: Math.min(gamesDone[l], GAMES_TO_UNLOCK) })}</span>
                    </span>
                  ) : (
                    <span className="text-sm font-bold mt-auto bg-white/90 text-gray-800 rounded-full px-2 py-0.5 self-start">{t('locked', { n: l - 1 })}</span>
                  )}
                </motion.button>
              )
            })}
          </div>

          <h2 className="mb-3"><span className="prompt-pill text-2xl font-bold">{t('pickMode')}</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-testid="mode-grid">
            {BIG_MODES.map((m, i) => {
              const meta = MODE_META[m]
              return (
                <motion.button
                  key={m}
                  type="button"
                  onClick={() => {
                    sfx.tap()
                    startGame(m)
                  }}
                  data-testid={`mode-${m}`}
                  className={`relative min-h-[140px] rounded-3xl p-4 bg-gradient-to-br ${meta.style} ${meta.extra ? 'border-dashed' : ''} border-4 shadow-xl
                              flex flex-col items-center justify-center gap-1 text-center overflow-hidden`}
                  initial={{ opacity: 0, scale: 0.3, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.07, ease: BOUNCY, duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {meta.extra && (
                    <span className="absolute top-2 -right-8 rotate-45 w-[120px] text-center bg-yellow-300 text-gray-900 text-sm font-bold py-0.5 shadow" data-testid="new-ribbon">
                      {t('newRibbon')}
                    </span>
                  )}
                  {meta.extra && <span className="absolute top-2 left-3 text-xs font-bold uppercase tracking-wide text-white bg-black/35 rounded-full px-2">{t('extraLabel')}</span>}
                  <span className="text-5xl" aria-hidden="true">{meta.emoji}</span>
                  <span className="text-2xl font-bold text-white drop-shadow">{t(meta.title)}</span>
                  <span className="text-white font-semibold">{t(meta.desc)}</span>
                </motion.button>
              )
            })}
          </div>
        </main>
      </div>
    )
  }

  // ───────────── Game ─────────────
  const Mode = MODE_COMPONENT[mode]
  const meta = MODE_META[mode]
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-300 via-teal-300 to-cyan-400 relative no-x-scroll" data-screen={`game-${mode}`}>
      <BackButton label={t('back')} onClick={leaveGame} />
      <div className="fixed z-50 right-3 flex gap-2" style={{ top: 'calc(var(--safe-area-inset-top) + 12px)' }}>
        <KidButton
          variant="soft"
          aria-label={t('voiceLabel')}
          aria-pressed={voiceOn}
          onClick={toggleVoice}
          className="min-w-[60px] text-2xl rounded-full"
          data-testid="voice-toggle"
          data-voice={voiceOn ? 'on' : 'off'}
        >
          <span aria-hidden="true">{voiceOn ? '🔊' : '🔇'}</span>
        </KidButton>
        <KidButton
          aria-label={t('hint')}
          onClick={tapHint}
          sound="pop"
          className="text-2xl border-yellow-200 rounded-full flex items-center gap-2"
          data-testid="hint-btn"
        >
          <span aria-hidden="true">💡</span>
          <span className="text-xl">{t('hint')}</span>
          {tier > 0 && <span className="text-sm bg-white/90 text-amber-700 rounded-full px-2" aria-hidden="true">{tier}/3</span>}
        </KidButton>
      </div>

      {/* Phone: the title pill gets its own row below the fixed Back / voice / Hint buttons. */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 pt-[96px] sm:pt-[80px] pb-6 has-dock">
        {/* Compact header (QA M5/M6): one line of context, then problem + companion side by side. */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <h1 className="prompt-pill text-base font-bold">
              {meta.emoji} {t(meta.title)} · {t(`level${level}`)} · {t('problemOf', { n: Math.min(PROBLEMS_PER_GAME, solvedInGame + (awardedSerial === serial ? 0 : 1)), total: PROBLEMS_PER_GAME })}
            </h1>
            <HoardChip gems={gems} label={t('hoardLabel', { n: gems })} />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {!HIDE_PROBLEM.includes(mode) && (
            <motion.p
              key={problemKey}
              className="bg-white/95 rounded-3xl px-5 py-1 shadow-lg text-5xl md:text-6xl font-bold"
              style={{ color: 'var(--space-primary)' }}
              initial={{ scale: 0.3 }}
              animate={{ scale: 1 }}
              transition={{ ease: BOUNCY, duration: 0.5 }}
              data-testid="problem"
            >
              <span style={{ color: PV_TEXT.tens }}>{Math.floor(problem.a / 10)}</span>
              <span style={{ color: PV_TEXT.ones }}>{problem.a % 10}</span>
              {' × '}
              {problem.b}
            </motion.p>
            )}
            {/* Companion — reacts to the PROCESS (a trade, a step, asking for a hint), never to speed. */}
            {/* Fixed height (2 lines max): a new dragon line never shoves the play area (M1). */}
            <div className="flex items-center gap-2 h-[68px]" aria-live="polite" data-testid="mascot">
              <motion.span
                key={`m-${mascot.key}`}
                className="text-4xl"
                aria-hidden="true"
                initial={{ scale: 0.7, rotate: -10 }}
                animate={mascot.mood === 'party' ? { scale: [1, 1.3, 1], rotate: [0, -15, 15, 0], y: [0, -12, 0] } : mascot.mood === 'think' ? { rotate: [0, -8, 0], scale: 1 } : { scale: 1, rotate: 0, y: [0, -6, 0] }}
                transition={{ duration: 0.7, ease: BOUNCY }}
              >
                {mascot.mood === 'think' ? '🤔' : '🐉'}
              </motion.span>
              <AnimatePresence mode="wait">
                {mascot.text && (
                  <motion.span
                    key={`b-${mascot.key}`}
                    className="bg-white/95 text-gray-800 font-bold text-base md:text-lg leading-snug rounded-2xl px-3 py-1.5 shadow-md border-2 border-white max-w-[220px] line-clamp-2"
                    initial={{ scale: 0.5, opacity: 0, x: -10 }}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ ease: BOUNCY, duration: 0.4 }}
                  >
                    {mascot.text}
                  </motion.span>
                )}
              </AnimatePresence>
              {mascot.mood === 'party' && <StreakSparkle key={`s-${mascot.key}`} />}
            </div>
          </div>
        </div>

        {/* Screen-reader channel for the hint ladder (QA m5): one persistent live region. */}
        <p className="sr-only" aria-live="polite">{tier > 0 ? hintText : ''}</p>

        <div className="relative" ref={playArea}>
        {/* Hint OVERLAYS the play area instead of pushing the pad below the fold (QA M5/M6),
            placed clear of every target (placeHint). */}
        <AnimatePresence>
          {tier > 0 && hintText && (
            <motion.div
              key={`${tier}-${hintText}`}
              ref={bubble}
              className="absolute z-30 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 w-[min(36rem,calc(100%-0.5rem))] md:w-[calc(100%-324px)] bg-amber-50 border-4 border-amber-300 text-amber-900
                         rounded-3xl pl-5 pr-16 py-3 text-lg md:text-xl font-bold text-center shadow-xl pointer-events-none"
              style={{ top: hintTop }}
              data-tier={tier}
              initial={{ scale: 0.6, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ ease: BOUNCY, duration: 0.4 }}
              data-testid="hint-bubble"
            >
              <LiveTaps>
              <span className="block text-sm font-bold text-amber-800 mb-1">{t('hintTier', { n: tier })}</span>
              💡 <ReadAlongText text={hintText} word={hintReader.word} />
              {voiceOn && (
                <button
                  type="button"
                  onClick={readAloud}
                  className="pointer-events-auto mt-1 mx-auto flex items-center gap-1 min-h-[56px] px-4 rounded-full text-base font-bold text-amber-900 underline underline-offset-4 hover:bg-amber-100"
                  data-testid="hint-read-it"
                >
                  <span aria-hidden="true">🔊</span> {t('readIt')}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  hintReader.stop()
                  setTier(0)
                }}
                aria-label={t('hintClose')}
                className="pointer-events-auto absolute top-1 right-1 w-[56px] h-[56px] rounded-full text-2xl text-amber-900 hover:bg-amber-100"
                data-testid="hint-close"
              >
                ✕
              </button>
              </LiveTaps>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center mb-2 min-h-[56px]">
          {demo ? (
            <div className="flex items-center gap-3 bg-white/95 rounded-full pl-5 pr-2 py-1 shadow-lg" data-testid="demo-banner" role="status">
              <span className="text-lg font-bold" style={{ color: 'var(--space-primary)' }}>🐉 {t('demoTitle')}</span>
              <KidButton variant="soft" aria-label={t('demoSkip')} onClick={endDemo} sound="pop" className="min-h-[56px] text-lg rounded-full" data-testid="demo-skip">
                {t('demoSkip')}
              </KidButton>
            </div>
          ) : (
            <button type="button" onClick={showAgain} className="min-h-[56px] px-5 rounded-full bg-white/85 text-base font-bold shadow" style={{ color: 'var(--space-primary)' }} data-testid="demo-again">
              {t('demoAgain')}
            </button>
          )}
        </div>

        <div ref={shakeScope} data-testid="mode-area" className={demo ? 'pointer-events-none' : ''} data-demo={demo ? '1' : '0'}>
          <Mode
            key={`${mode}-${problemKey}`}
            problem={problem}
            onSolved={onSolved}
            onWrong={onWrong}
            onStep={onStep}
            setHint={setHint}
            setSpeech={setSpeech}
            highlight={highlight}
            demo={demo}
            onDemoDone={endDemo}
            narrate={narrate}
            onAward={onAward}
            onNext={next}
          />
        </div>
        </div>
      </main>

      <AnimatePresence>
        {celebrate && celebrate.serial === serial && (
          <Celebration
            text={t('correct')}
            sub={`${problem.a} × ${problem.b} = ${problem.a * problem.b}`}
            extra={
              celebrate.gameDone
                ? `${t('gameDone', { done: Math.min(gamesDone[level], GAMES_TO_UNLOCK) })}${celebrate.unlocked ? ` ${t('levelUnlocked', { n: celebrate.unlocked })}` : ''}`
                : null
            }
            cta={celebrate.gameDone ? t('backToGames') : t('nextProblem')}
            onNext={next}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
