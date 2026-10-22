'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { KidButton } from '@/components/ui/KidButton'
import { levelOf, shuffled, splitTensOnes } from '@/lib/math/twoDigitProblems'
import { sfx, unlockAudio } from '@/lib/audio/sfx'
import { BreakApart } from './BreakApart'
import { DEMO_GLOW, DemoFinger, useDemoStep } from './Demo'
import { checkSlot, mathCards, pickMathOk, slotHint, storyFor, type Story, type StoryTheme } from './logic'
import { PV, pvBg, pvText } from './pv'
import { ReadAlongText, useReadAlong } from './ReadAlong'
import type { ModeProps } from './types'
import { useLater } from './useLater'

// Story Missions (v2, replaces Block Builder). Plan: mellow-roaming-hoare.md §3.
//   read   — picture first, the story read aloud with a word highlight, "Hear it again"
//   slots  — tap the story's numbers into "groups" / "in each" (L3: one extra number)
//   pick   — which math tells the story? × in both orders is right, + gets an amber hint
//   bar    — bar model: `groups` equal boxes of `each`, "?" in all
//   solve  — the real Break It Apart steps (the component itself, not a copy)
//   finale — "126 gems in all!", gems fly into the dragon's hoard, "Next story"
// Objects on screen ≤ 15: L1/L2 picture = tens-bars + one ones chip per group; when that
// would pass 15 (or on L3) each group is ONE labelled box instead.

const BOUNCY: [number, number, number, number] = [0.34, 1.56, 0.64, 1]
type Phase = 'read' | 'slots' | 'pick' | 'bar' | 'solve' | 'finale'

const ITEM: Record<StoryTheme, string> = { gems: '💎', eggs: '🥚', stickers: '⭐', cookies: '🍪', spacePets: '👾', shells: '🐚', acorns: '🌰' }
const GROUP: Record<string, string> = {
  dragons: '🐉', nests: '🪺', baskets: '🧺', pages: '📄', books: '📒', trays: '🍽️', jars: '🫙',
  rockets: '🚀', moons: '🌙', buckets: '🪣', crabs: '🦀', squirrels: '🐿️', logs: '🪵',
}
const artFor = (s: Story) => ({ group: GROUP[s.groupNoun] ?? '🐉', item: ITEM[s.theme] ?? '💎' })

export function storyObjects(story: Story, level: number | null): 'bars' | 'boxes' {
  const [tens] = splitTensOnes(story.each)
  return level !== 3 && story.groups * (tens / 10 + 1) <= 15 ? 'bars' : 'boxes'
}

/** One group: the holder (dragon, nest…) with its things as tens-bars + an ones chip, or one labelled box. */
function Group({ story, style, compact }: { story: Story; style: 'bars' | 'boxes'; compact?: boolean }) {
  const art = artFor(story)
  const [tens, ones] = splitTensOnes(story.each)
  return (
    <div className={`flex flex-col items-center gap-1 bg-white/80 rounded-2xl px-2 py-1.5 border-2 border-white shadow ${compact ? 'min-w-[64px]' : 'min-w-[78px]'}`} data-testid="story-group">
      <span className={compact ? 'text-3xl' : 'text-4xl'} aria-hidden="true">{art.group}</span>
      {style === 'bars' ? (
        <span className="flex items-end gap-1" aria-hidden="true">
          {Array.from({ length: tens / 10 }, (_, i) => (
            <span key={i} data-obj="tens" className="w-[10px] h-[44px] rounded-md border-2 border-white" style={pvBg('tens')} />
          ))}
          <span data-obj="ones" className="min-w-[30px] h-[30px] px-1 rounded-full text-white text-base font-bold flex items-center justify-center border-2 border-white" style={pvBg('ones')}>
            {ones}
          </span>
        </span>
      ) : (
        <span data-obj="box" aria-hidden="true" className="min-w-[60px] h-[40px] px-2 rounded-xl text-white text-xl font-bold flex items-center justify-center border-2 border-white shadow"
          style={{ background: `linear-gradient(90deg, ${PV.tens} 0 62%, ${PV.ones} 62% 100%)` }}>
          {story.each}
        </span>
      )}
      <span className="text-sm font-bold" style={{ color: 'var(--space-primary)' }}>
        {story.each} {art.item}
      </span>
    </div>
  )
}

function Picture({ story, style, compact }: { story: Story; style: 'bars' | 'boxes'; compact?: boolean }) {
  return (
    <div className="flex flex-wrap justify-center gap-2" role="img" aria-label={`${story.groups} ${story.groupNoun}, ${story.each} ${story.unit} each`} data-testid="story-picture">
      {Array.from({ length: story.groups }, (_, i) => (
        <motion.div key={i} initial={{ scale: 0.3, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: i * 0.08, ease: BOUNCY, duration: 0.5 }}>
          <Group story={story} style={style} compact={compact} />
        </motion.div>
      ))}
    </div>
  )
}

/** Gems fly from the answer sentence into the hoard chip in the header. */
function GemFlight({ from }: { from: React.RefObject<HTMLElement | null> }) {
  const reduce = useReducedMotion()
  const [path, setPath] = useState<null | { x0: number; y0: number; x1: number; y1: number }>(null)
  useEffect(() => {
    const a = from.current?.getBoundingClientRect()
    const b = document.querySelector('[data-testid=hoard-chip]')?.getBoundingClientRect()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- DOM measurement after mount (start/end of the gem flight); same pattern as Demo's finger.
    if (a && b) setPath({ x0: a.left + a.width / 2, y0: a.top, x1: b.left + b.width / 2, y1: b.top + b.height / 2 })
  }, [from])
  if (!path) return null
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="fixed z-[45] text-4xl pointer-events-none"
          style={{ left: 0, top: 0 }}
          initial={{ x: path.x0 - 18 + (i - 1) * 40, y: path.y0, opacity: 1, scale: 1 }}
          animate={reduce ? { opacity: 0 } : { x: path.x1 - 18, y: path.y1 - 18, opacity: [1, 1, 0], scale: [1, 1.2, 0.5] }}
          transition={reduce ? { duration: 0.4 } : { duration: 0.9, delay: i * 0.15, ease: 'easeIn' }}
        >
          💎
        </motion.span>
      ))}
    </>
  )
}

export function StoryMissions(props: ModeProps) {
  const { problem, onSolved, onWrong, onStep, setHint, setSpeech, demo, onDemoDone, narrate, onNext } = props
  const t = useTranslations('bigMult')
  const later = useLater()
  const story = useMemo(() => storyFor(problem), [problem])
  const level = levelOf(problem)
  const style = storyObjects(story, level)
  const art = artFor(story)
  const answerSentence = story.steps.find((x) => x.kind === 'answer')?.text ?? `${story.answer} ${story.unit}!`
  const [phase, setPhase] = useState<Phase>('read')
  const [slotGroups, setSlotGroups] = useState<number | null>(null)
  const [slotEach, setSlotEach] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)
  const { word, read, stop } = useReadAlong(narrate)
  const v = { groups: story.groups, each: story.each, groupNoun: story.groupNoun, unit: story.unit }

  // The numbers to tap: every number in the story, in reading order (L3 has one extra).
  const chips = useMemo(() => [...new Set(story.numbers)], [story])
  // Pick-the-math: two cards (× and +), shuffled. The × card is written either way round at
  // random — both orders are right (pickMathOk), which Flip & Split then shows.
  const cards = useMemo(() => {
    const [mul, plus] = mathCards(story)
    // eslint-disable-next-line react-hooks/purity -- the × card's order is picked once per story on purpose; useMemo keyed on story holds it across re-renders.
    const label = Math.random() < 0.5 ? mul : `${story.each} × ${story.groups}`
    return shuffled([
      { id: 'mul', label, ok: pickMathOk(story, label) },
      { id: 'add', label: plus, ok: pickMathOk(story, plus) },
    ])
  }, [story])

  useEffect(() => {
    if (phase === 'read') {
      setHint({ nudge: t('nudgeStoryRead'), step: t('stepStoryRead'), worked: t('workedStoryRead', v) })
      setSpeech(story.speak)
    } else if (phase === 'slots') {
      const g = slotGroups === null
      setHint(g
        ? { nudge: t('nudgeSlotGroups', v), step: t('stepSlotGroups', v), worked: t('workedSlotGroups', v) }
        : { nudge: t('nudgeSlotEach', v), step: t('stepSlotEach', v), worked: t('workedSlotEach', v) })
      setSpeech(g ? t('storyHowManyGroups', v) : t('storyHowManyEach', v))
    } else if (phase === 'pick') {
      setHint({ nudge: t('nudgePick'), step: t('stepPick'), worked: t('workedPick', v) })
      setSpeech(t('storyPickMath'))
    } else if (phase === 'bar') {
      setHint({ nudge: t('nudgeBar', v), step: t('stepBar'), worked: t('workedBar', v) })
      setSpeech(t('storySolveIt', v))
    } else if (phase === 'finale') {
      setHint({ nudge: t('workedBar', v), step: t('workedBar', v), worked: t('workedBar', v) }) // closes an open hint
      setSpeech(answerSentence)
    }
    // 'solve' — BreakApart sets its own hints and speech.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, slotGroups, story, answerSentence, t, setHint, setSpeech])

  // Read the story once on arrival (not during the walkthrough — the dragon reads it then).
  const demoRef = useRef(demo)
  useEffect(() => {
    demoRef.current = demo
  }, [demo])
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!demoRef.current) read(story.text, story.speak)
    }, 400)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goSlots = () => {
    if (phase !== 'read') return
    stop()
    sfx.blockPop()
    onStep('step')
    setPhase('slots')
  }
  const demoTarget = useRef<HTMLDivElement>(null)
  useDemoStep(demo, goSlots, story.speak, (txt) => read(story.text, txt), onDemoDone)

  const tapChip = (n: number) => {
    // slotEach set = both slots full; the 500 ms move to "pick" is running (code-reviewer #3).
    if (phase !== 'slots' || slotEach !== null) return
    if (slotGroups === null) {
      const r = checkSlot(story, 'groups', n)
      if (r !== 'ok') return onWrong(undefined, slotHint(story, 'groups', r) ?? undefined)
      sfx.blockPop()
      setSlotGroups(n)
      return
    }
    const r = checkSlot(story, 'each', n)
    if (r !== 'ok') return onWrong(undefined, slotHint(story, 'each', r) ?? undefined)
    sfx.blockPop()
    setSlotEach(n)
    onStep('step')
    later(() => setPhase('pick'), 500)
  }

  const pickCard = (ok: boolean) => {
    if (phase !== 'pick') return
    if (!ok) return onWrong(undefined, t('wrongPickPlus', v))
    onStep('step')
    setPhase('bar')
  }

  const toSolve = () => {
    if (phase !== 'bar') return
    sfx.tap()
    setPhase('solve')
  }

  // Break It Apart finished: show the answer sentence; the gems fly, then progress is recorded.
  const sentenceRef = useRef<HTMLParagraphElement>(null)
  const toFinale = () => {
    setPhase('finale')
    read(answerSentence)
    // Gems were already credited when BreakApart accepted the answer (onAward); this is the show.
    later(() => {
      setSolved(true)
      onSolved()
    }, 1100)
  }

  const slot = (label: string, value: number | null, active: boolean, testId: string) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-lg font-bold" style={{ color: 'var(--space-primary)' }}>{label}</span>
      <motion.span
        data-testid={testId}
        data-active={active ? '1' : undefined}
        className={`w-[96px] h-[80px] rounded-2xl flex items-center justify-center text-4xl font-bold border-4
          ${value === null ? 'border-dashed bg-white/70 text-gray-500' : 'bg-white text-gray-800 border-white shadow'}
          ${active ? 'ring-4 ring-yellow-300' : ''}`}
        style={value === null ? { borderColor: 'var(--space-primary)' } : undefined}
        animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={active ? { duration: 1.2, repeat: Infinity } : {}}
      >
        {value ?? '?'}
      </motion.span>
    </div>
  )

  if (phase === 'solve') {
    return (
      <div data-phase="solve" data-story-phase="solve">
        <p className="text-center mb-2">
          <span className="inline-block bg-white/90 rounded-2xl px-4 py-1 text-lg font-bold shadow" style={{ color: 'var(--space-primary)' }}>
            {art.group} {story.text}
          </span>
        </p>
        <BreakApart {...props} demo={false} onDemoDone={() => {}} onSolved={toFinale} />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start" data-phase={phase} data-story-phase={phase} data-theme={story.theme} onPointerDown={unlockAudio}>
      <div className="bg-white/85 rounded-3xl p-4 shadow-xl border-4 border-white/60 flex flex-col gap-3 items-center">
        {phase === 'read' && (
          <>
            <div data-active="1"><Picture story={story} style={style} /></div>
            <p className="text-2xl md:text-3xl font-bold text-gray-800 text-center leading-snug max-w-xl" data-testid="story-text">
              <ReadAlongText text={story.text} word={word} />
            </p>
          </>
        )}

        {phase === 'slots' && (
          <>
            <Picture story={story} style={style} compact />
            <p className="text-xl font-bold text-gray-700 text-center" data-testid="story-text">{story.text}</p>
            <div className="flex items-end gap-4">
              {slot(t('storyHowManyGroups', v), slotGroups, slotGroups === null, 'slot-groups')}
              <span className="text-4xl font-bold text-gray-500 pb-5">×</span>
              {slot(t('storyHowManyEach', v), slotEach, slotGroups !== null && slotEach === null, 'slot-each')}
            </div>
          </>
        )}

        {phase === 'pick' && (
          <>
            <p className="text-xl font-bold text-gray-700 text-center">{story.text}</p>
            <p className="text-2xl font-bold text-center" style={{ color: 'var(--space-primary)' }} data-active="1">
              {story.groups} {t('slotGroups')} · {story.each} {t('slotEach')}
            </p>
          </>
        )}

        {(phase === 'bar' || phase === 'finale') && (
          <div className="w-full flex flex-col items-center gap-2" data-testid="bar-model" data-active={phase === 'bar' ? '1' : undefined}>
            <div className="w-full max-w-2xl flex gap-1">
              {Array.from({ length: story.groups }, (_, i) => (
                <motion.div
                  key={i}
                  data-obj="bar"
                  className="flex-1 h-[64px] rounded-xl border-4 border-white flex items-center justify-center text-white font-bold shadow text-xl md:text-2xl"
                  style={pvBg('tens')}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.1, ease: BOUNCY, duration: 0.5 }}
                >
                  {story.each}
                </motion.div>
              ))}
            </div>
            {/* brace + total */}
            <div className="w-full max-w-2xl h-3 border-x-4 border-b-4 rounded-b-xl" style={{ borderColor: 'var(--space-primary)' }} aria-hidden="true" />
            <p className="text-2xl font-bold" style={{ color: 'var(--space-primary)' }} data-testid="bar-total">
              {phase === 'finale' ? `${story.groups} × ${story.each} = ${story.answer}` : t('storyBarTotal', v)}
            </p>
          </div>
        )}

        {phase === 'finale' && (
          <motion.p
            ref={sentenceRef}
            className="text-4xl md:text-5xl font-bold text-emerald-700 text-center"
            initial={{ scale: 0.3 }}
            animate={{ scale: 1 }}
            transition={{ ease: BOUNCY, duration: 0.6 }}
            data-testid="story-answer"
            data-active="1"
          >
            <ReadAlongText text={answerSentence} word={word} />
          </motion.p>
        )}
        {phase === 'finale' && <GemFlight from={sentenceRef} />}
      </div>

      <div className="action-dock flex flex-col items-center gap-2 md:gap-3 md:w-[300px]">
        {phase === 'read' && (
          <>
            <div ref={demoTarget} className={`w-full rounded-3xl ${demo ? DEMO_GLOW : ''}`}>
              <KidButton aria-label={t('storyGo')} onClick={goSlots} sound="pop" className="w-full min-h-[76px] text-2xl border-yellow-300" data-testid="story-go">
                {t('storyGo')}
              </KidButton>
            </div>
            <KidButton variant="soft" aria-label={t('hearAgain')} onClick={() => read(story.text, story.speak)} className="w-full min-h-[60px] text-xl" data-testid="story-hear">
              <span aria-hidden="true">🔊</span> {t('hearAgain')}
            </KidButton>
            {demo && <DemoFinger target={demoTarget} />}
          </>
        )}
        {phase === 'slots' && (
          <>
            <p className="prompt-pill dock-prompt text-center text-2xl font-bold" data-testid="story-prompt">{t('storyTapNumber')}</p>
            <div className="flex gap-3 justify-center w-full">
              {chips.map((n) => (
                <motion.button
                  key={n}
                  type="button"
                  onClick={() => tapChip(n)}
                  data-testid={`chip-${n}`}
                  disabled={(slotGroups === n && n === story.groups) || (slotEach === n && n === story.each)}
                  className="min-w-[80px] min-h-[72px] px-4 rounded-2xl text-white text-3xl font-bold shadow-xl border-4 border-white disabled:opacity-40"
                  style={{ backgroundColor: 'var(--space-primary)' }}
                  whileTap={{ scale: 0.9 }}
                >
                  {n}
                </motion.button>
              ))}
            </div>
          </>
        )}
        {phase === 'pick' && (
          <>
            <p className="prompt-pill dock-prompt text-center text-2xl font-bold">{t('storyPickMath')}</p>
            <div className="grid grid-cols-3 md:grid-cols-1 gap-2 w-full">
              {cards.map((c) => (
                <motion.button
                  key={c.id}
                  type="button"
                  onClick={() => pickCard(c.ok)}
                  data-testid={`card-${c.id}`}
                  className="min-h-[76px] rounded-2xl bg-white text-3xl font-bold shadow-xl border-4"
                  style={{ borderColor: 'var(--space-primary)', color: 'var(--space-primary)' }}
                  whileTap={{ scale: 0.9 }}
                >
                  {c.label}
                </motion.button>
              ))}
            </div>
          </>
        )}
        {phase === 'bar' && (
          <>
            <p className="prompt-pill dock-prompt text-center text-2xl font-bold">
              <span style={pvText('tens')} className="bg-white rounded-lg px-1">{story.each}</span> × {story.groups} = ?
            </p>
            <KidButton aria-label={t('storyBreakIt')} onClick={toSolve} sound="pop" className="w-full min-h-[76px] text-2xl border-yellow-300" data-testid="story-solve">
              {t('storyBreakIt')}
            </KidButton>
          </>
        )}
        {phase === 'finale' && solved && onNext && (
          <KidButton aria-label={t('storyNext')} onClick={onNext} sound="pop" className="w-full min-h-[76px] text-2xl border-yellow-300" data-testid="story-next">
            {t('storyNext')}
          </KidButton>
        )}
      </div>
    </div>
  )
}
