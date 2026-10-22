'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { KidButton } from '@/components/ui/KidButton'
import { splitTensOnes } from '@/lib/math/twoDigitProblems'
import { sfx, unlockAudio } from '@/lib/audio/sfx'
import { AnswerPad } from './AnswerPad'
import { DEMO_GLOW, DemoFinger, useDemoStep } from './Demo'
import { flipHint, flipSplitSteps, type FlipStage } from './logic'
import type { FlipInput } from '@/lib/math/flipSplit'
import { PV, pvBg, pvText } from './pv'
import type { ModeProps } from './types'
import { useLater } from './useLater'

// Flip & Split (v2, replaces Quick Guess). Plan: mellow-roaming-hoare.md §4.
//   predict  — 3 × 42 as a labelled rectangle (3 wide, 42 tall). Will flipping change the answer?
//   flip     — the big Flip button turns it 90° → 42 × 3 (reduced motion: crossfade)
//   side     — tap the side to split (the 42)
//   splitWay — 40 + 2 or 4 + 2? → the rectangle splits 40 | 2
//   tensPart / onesPart — solve 40 × 3 and 2 × 3 on the pad
//   add      — 120 + 6
//   confirm  — both orders shown with the same pieces ✓
// Misconceptions → amber hints via flipSplitMisconception (lib/math/flipSplit.ts).

const BOUNCY: [number, number, number, number] = [0.34, 1.56, 0.64, 1]
type Phase = 'predict' | 'flip' | 'flipping' | 'side' | 'splitWay' | 'tensPart' | 'onesPart' | 'add' | 'confirm'

// Rectangle size: phone keeps the flipped rectangle + its side label inside 390 px; iPad gets more room.
const size = () => (typeof window !== 'undefined' && window.innerWidth >= 768 ? { LONG: 340, SHORT: 150 } : { LONG: 236, SHORT: 112 })
// The flipped rectangle sits beside a 60 px side label (+ 8 px gap) inside the card's padding.
const LABEL_W = 68
/** Same sizes as before when they fit; scaled down to the card's real width when they do not
 *  (iPad Slide Over at 320 px, a rotation mid-game — hackerAI #16). */
function fitSize(cardInner: number) {
  const base = size()
  const room = cardInner - LABEL_W - 4
  if (room >= base.LONG || room <= 0) return base
  const k = room / base.LONG
  return { LONG: Math.floor(base.LONG * k), SHORT: Math.floor(base.SHORT * k) }
}
const stripes = (n: number, dir: 'rows' | 'cols') =>
  `repeating-linear-gradient(${dir === 'rows' ? 180 : 90}deg, transparent 0 calc(${100 / n}% - 2px), rgba(255,255,255,0.55) calc(${100 / n}% - 2px) ${100 / n}%)`

export function FlipSplit({ problem, onAward, onSolved, onWrong, onStep, setHint, setSpeech, highlight, demo, onDemoDone, narrate }: ModeProps) {
  const t = useTranslations('bigMult')
  const reduce = useReducedMotion()
  const { a, b } = problem
  const [tens, ones] = splitTensOnes(a)
  const L = tens * b
  const R = ones * b
  const [phase, setPhase] = useState<Phase>('predict')
  const later = useLater()
  const card = useRef<HTMLDivElement>(null)
  const [{ LONG, SHORT }, setDims] = useState(size)
  useLayoutEffect(() => {
    const fit = () => {
      const el = card.current
      if (!el) return
      const cs = getComputedStyle(el)
      const inner = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const next = fitSize(inner)
      setDims((d) => (d.LONG === next.LONG && d.SHORT === next.SHORT ? d : next))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  // Terminal guard: "Same answer!" ends the problem once, however fast it is tapped.
  const doneRef = useRef(false)
  const [done, setDone] = useState(false)
  const [prediction, setPrediction] = useState<'same' | 'different' | null>(null)
  const flipped = !['predict', 'flip', 'flipping'].includes(phase)
  const split = ['tensPart', 'onesPart', 'add', 'confirm'].includes(phase)

  useEffect(() => {
    const v = { a, b, t: tens / 10, o: ones, tv: tens }
    if (phase === 'predict') {
      setHint({ nudge: t('nudgeFlipPredict'), step: t('stepFlipPredict'), worked: t('workedFlipPredict', v) })
      setSpeech(`${b} times ${a}. ${t('flipPredictQ')}`)
    } else if (phase === 'flip') {
      setHint({ nudge: t('nudgeFlipBtn'), step: t('stepFlipBtn'), worked: t('workedFlipBtn') })
      setSpeech(t('flipTapFlip'))
    } else if (phase === 'side') {
      setHint({ nudge: t('nudgeFlipSide'), step: t('stepFlipSide', v), worked: t('workedFlipSide', v) })
      setSpeech(`${t('flipSameMsg')} ${t('flipChooseSide')}.`)
    } else if (phase === 'splitWay') {
      setHint({ nudge: t('nudgeFlipWay'), step: t('stepFlipWay', v), worked: t('workedFlipWay', v), highlight: 'split' })
      setSpeech(t('flipSplitQ', v))
    } else if (phase === 'tensPart') {
      setHint({ nudge: t('nudgeLeft', { a: tens, b }), step: t('hintSplit', { a: tens, b, a1: tens / 10 }), worked: `${tens} × ${b}: ${tens / 10} × ${b} = ${(tens / 10) * b}, then add a zero.`, highlight: 'tensPart' })
      setSpeech(`${tens} times ${b}.`)
    } else if (phase === 'onesPart') {
      setHint({ nudge: t('nudgeRight', { a: ones, b }), step: t('hintSplitOnes', { a: ones, b }), worked: `Count by ${b}s, ${ones} times.`, highlight: 'onesPart' })
      setSpeech(`${ones} times ${b}.`)
    } else if (phase === 'add') {
      setHint({ nudge: t('nudgeAdd'), step: t('hintAdd', { a: L, b: R }), worked: `${L} + ${R}: add the ones, then the tens.`, highlight: 'sum' })
      setSpeech(`${L} plus ${R}.`)
    } else if (phase === 'confirm') {
      // New step: closes any hint left open from the add step.
      setHint({ nudge: t('flipConfirm'), step: t('workedFlipPredict', v), worked: t('workedFlipPredict', v) })
      setSpeech(`${t('flipConfirm')} ${b} times ${a} and ${a} times ${b} are both ${a * b}.`)
    }
    // 'flipping': keep whatever hint is open (a "Different" prediction's hint stays while it turns).
  }, [phase, a, b, tens, ones, L, R, t, setHint, setSpeech])

  // Misses per stage → which of the 3 amber tiers flipSplitMisconception returns next.
  const misses = useRef<Record<string, number>>({})
  const mis = (stage: FlipStage, input: FlipInput) => {
    const n = misses.current[stage] ?? 0
    misses.current[stage] = n + 1
    return flipHint(stage, input, problem, n) ?? flipSplitSteps(problem).find((x) => x.stage === stage)?.text
  }

  const pickSame = () => {
    if (phase !== 'predict') return
    setPrediction('same')
    onStep('step')
    setPhase('flip')
  }
  // A prediction is a guess, not an error (hackerAI #11): no wrong sound, no shake, no miss —
  // just "Let's test it!" and the Flip button.
  const pickDifferent = () => {
    if (phase !== 'predict') return
    sfx.tap()
    setPrediction('different')
  }
  const doFlip = () => {
    if (phase !== 'flip' && !(phase === 'predict' && prediction === 'different')) return
    sfx.tradeWhoosh()
    setPhase('flipping')
    if (reduce) later(() => setPhase('side'), 450)
  }
  const tapSide = (side: number) => {
    if (phase !== 'side') return
    if (side !== a) return onWrong(undefined, mis('chooseSide', side))
    sfx.blockPop()
    onStep('step')
    setPhase('splitWay')
  }
  const pickWay = (tensValue: number) => {
    if (phase !== 'splitWay') return
    if (tensValue !== tens) return onWrong(undefined, mis('split', [tensValue, ones]))
    sfx.blockPop()
    onStep('step')
    setPhase('tensPart')
  }
  const answer = (n: number) => {
    if (phase === 'tensPart') {
      if (n !== L) return onWrong(undefined, mis('tensPart', n))
      onStep('step')
      setPhase('onesPart')
    } else if (phase === 'onesPart') {
      if (n !== R) return onWrong(undefined, mis('onesPart', n))
      onStep('step')
      setPhase('add')
    } else if (phase === 'add') {
      if (n !== L + R) return onWrong(n, mis('add', n))
      sfx.tradeWhoosh()
      onAward?.() // the answer is in: credit now, the confirm card is the ceremony
      setPhase('confirm')
    }
  }
  const confirm = () => {
    if (phase !== 'confirm' || doneRef.current) return
    doneRef.current = true
    setDone(true)
    onSolved()
  }

  const demoTarget = useRef<HTMLDivElement>(null)
  useDemoStep(demo, pickSame, t('demoFlip'), narrate, onDemoDone)

  const leftPct = Math.max(62, Math.min(80, (tens / a) * 100))
  const glowL = phase === 'tensPart' || highlight === 'tensPart'
  const glowR = phase === 'onesPart' || highlight === 'onesPart'

  // ── the rectangle ──
  const tall = (
    <div className="relative" style={{ width: SHORT, height: LONG }}>
      <div className="absolute inset-0 rounded-2xl border-4 border-white shadow-xl" data-obj="rect"
        style={{ background: `linear-gradient(180deg, ${PV.tens} 0 ${leftPct}%, ${PV.ones} ${leftPct}% 100%)`}}>
        <div className="absolute inset-0 rounded-xl" style={{ backgroundImage: stripes(b, 'cols') }} />
        <span className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold drop-shadow">{b} × {a}</span>
      </div>
    </div>
  )

  const sideLabel = (n: number, testId: string, active: boolean) =>
    phase === 'side' ? (
      <motion.button type="button" onClick={() => tapSide(n)} data-testid={testId} data-active="1"
        className="min-w-[64px] min-h-[60px] px-3 rounded-2xl bg-white text-3xl font-bold shadow-lg border-4 ring-4 ring-yellow-300"
        style={{ borderColor: 'var(--space-primary)', color: 'var(--space-primary)' }}
        animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.2, repeat: Infinity }} whileTap={{ scale: 0.9 }}>
        {n}
      </motion.button>
    ) : (
      <span data-testid={testId} data-keep-clear="1" className={`min-w-[48px] text-center text-3xl font-bold ${active ? 'ring-4 ring-yellow-300 rounded-xl bg-white px-2' : ''}`} style={{ color: 'var(--space-primary)' }}>{n}</span>
    )

  const wide = (
    <div className="flex flex-col items-start gap-1">
      {/* top side label: a (or the split 40 | 2) */}
      <div className="flex items-center gap-2" style={{ marginLeft: 68 }}>
        {split ? (
          <span className="flex text-2xl font-bold" style={{ width: LONG }}>
            {/* Side labels stay readable: the hint bubble never covers them (data-keep-clear, round 3). */}
            <span style={{ width: `${leftPct}%`, ...pvText('tens') }} className="text-center" data-keep-clear="1">{tens}</span>
            <span style={{ width: `${100 - leftPct}%`, ...pvText('ones') }} className="text-center" data-keep-clear="1">{ones}</span>
          </span>
        ) : (
          <span style={{ width: LONG }} className="flex justify-center">{sideLabel(a, 'side-a', phase === 'splitWay')}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="w-[60px] flex justify-center">{sideLabel(b, 'side-b', false)}</span>
        <motion.div className="flex" style={{ width: LONG, height: SHORT }} animate={{ gap: split && phase !== 'confirm' ? '12px' : '0px' }} transition={{ ease: BOUNCY, duration: 0.6 }} data-obj="rect">
          <motion.div
            className={`relative flex items-center justify-center border-4 border-white ${split && phase !== 'confirm' ? 'rounded-2xl' : 'rounded-l-2xl'} ${!split ? 'rounded-2xl' : ''} ${glowL ? 'ring-4 ring-yellow-300' : ''}`}
            style={{ ...pvBg('tens'), backgroundImage: stripes(b, 'rows') }}
            animate={{ width: split ? `${leftPct}%` : '100%' }}
            transition={{ ease: BOUNCY, duration: 0.6 }}
            data-testid="flip-piece-tens"
            data-active={phase === 'tensPart' || phase === 'add' || phase === 'splitWay' ? '1' : undefined}
          >
            <span className="text-white text-2xl md:text-3xl font-bold drop-shadow text-center leading-tight">
              {!split ? `${a} × ${b}` : phase === 'tensPart' ? `${tens} × ${b}` : L}
            </span>
          </motion.div>
          {split && (
            <motion.div
              className={`relative flex items-center justify-center border-4 border-white ${phase === 'confirm' ? 'rounded-r-2xl' : 'rounded-2xl'} ${glowR ? 'ring-4 ring-yellow-300' : ''}`}
              style={{ ...pvBg('ones'), backgroundImage: stripes(b, 'rows') }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${100 - leftPct}%`, opacity: 1 }}
              transition={{ ease: BOUNCY, duration: 0.6 }}
              data-testid="flip-piece-ones"
              data-active={phase === 'onesPart' || phase === 'add' ? '1' : undefined}
            >
              <span className="text-white text-lg md:text-2xl font-bold drop-shadow text-center leading-tight">
                {phase === 'tensPart' || phase === 'onesPart' ? `${ones} × ${b}` : R}
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )

  const before = (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl font-bold" style={{ color: 'var(--space-primary)' }}>{b}</span>
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold w-[52px] text-center" style={{ color: 'var(--space-primary)' }}>{a}</span>
        {tall}
      </div>
    </div>
  )

  const equation = flipped ? `${a} × ${b}` : `${b} × ${a}`

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start" data-phase={phase} onPointerDown={unlockAudio}>
      <div ref={card} className="bg-white/85 rounded-3xl p-4 shadow-xl border-4 border-white/60 flex flex-col items-center gap-3 overflow-hidden">
        <p className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--space-primary)' }} data-testid="flip-equation">
          {equation}
        </p>
        {phase === 'side' && (
          <p className="text-xl font-bold text-emerald-700" data-testid="flip-same-msg">{t('flipSameMsg')}</p>
        )}
        <div className="flex items-center justify-center" style={{ minHeight: flipped ? SHORT + 60 : LONG + 50 }} data-active={!flipped ? '1' : undefined}>
          {reduce ? (
            <AnimatePresence mode="wait">
              {flipped ? (
                <motion.div key="wide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>{wide}</motion.div>
              ) : (
                <motion.div key="tall" initial={{ opacity: 1 }} animate={{ opacity: phase === 'flipping' ? 0 : 1 }} transition={{ duration: 0.4 }} data-testid="flip-rect" data-keep-clear="1">{before}</motion.div>
              )}
            </AnimatePresence>
          ) : flipped ? (
            <motion.div initial={{ opacity: 0.6 }} animate={{ opacity: 1 }}>{wide}</motion.div>
          ) : (
            <motion.div
              data-testid="flip-rect"
              data-keep-clear="1"
              data-flipping={phase === 'flipping' ? '1' : '0'}
              animate={{ rotate: phase === 'flipping' ? -90 : 0 }}
              transition={{ duration: 1.6, ease: 'easeInOut' }}
              onAnimationComplete={() => {
                if (phase === 'flipping') setPhase('side')
              }}
            >
              {before}
            </motion.div>
          )}
        </div>

        {phase === 'confirm' && (
          <motion.div className="flex flex-col items-center gap-1 text-3xl font-bold" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ease: BOUNCY }} data-testid="flip-confirm" data-active="1">
            <span><span style={pvText('tens')}>{L}</span> + <span style={pvText('ones')}>{R}</span> = <span className="text-emerald-700">{L + R}</span></span>
            <span className="text-2xl text-emerald-700">{b} × {a} = {a * b} ✓ · {a} × {b} = {a * b} ✓</span>
          </motion.div>
        )}
      </div>

      <div className="action-dock flex flex-col items-center gap-2 md:gap-3 md:w-[300px]">
        {phase === 'predict' && (
          <>
            <p className="prompt-pill dock-prompt text-center text-2xl font-bold">{t('flipPredictQ')}</p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <div ref={demoTarget} className={`rounded-2xl ${demo ? DEMO_GLOW : ''}`}>
                <KidButton aria-label={t('flipSame')} onClick={pickSame} sound="pop" className="w-full min-h-[76px] text-2xl border-yellow-300" data-testid="predict-same">
                  {t('flipSame')}
                </KidButton>
              </div>
              <KidButton variant="soft" aria-label={t('flipDifferent')} onClick={pickDifferent} className="w-full min-h-[76px] text-2xl" data-testid="predict-different" aria-pressed={prediction === 'different'}>
                {t('flipDifferent')}
              </KidButton>
            </div>
            {prediction === 'different' && (
              <p className="prompt-pill dock-prompt text-center text-xl font-bold" role="status" data-testid="flip-test-it">{t('flipTestIt')}</p>
            )}
            {prediction === 'different' && (
              <KidButton aria-label={t('flipBtn')} onClick={doFlip} sound="pop" className="w-full min-h-[76px] text-2xl border-yellow-300" data-testid="flip-btn">
                {t('flipBtn')}
              </KidButton>
            )}
            {demo && <DemoFinger target={demoTarget} />}
          </>
        )}
        {(phase === 'flip' || phase === 'flipping') && (
          <>
            {prediction && <p className="prompt-pill dock-prompt text-center text-xl font-bold">{t('flipYouSaid', { pick: prediction === 'same' ? t('flipSame') : t('flipDifferent') })}</p>}
            <KidButton aria-label={t('flipBtn')} onClick={doFlip} sound="pop" disabled={phase === 'flipping'} className="w-full min-h-[88px] text-3xl border-yellow-300" data-testid="flip-btn">
              {t('flipBtn')}
            </KidButton>
          </>
        )}
        {phase === 'side' && <p className="prompt-pill dock-prompt text-center text-2xl font-bold">{t('flipChooseSide')} 👆</p>}
        {phase === 'splitWay' && (
          <>
            <p className="prompt-pill dock-prompt text-center text-2xl font-bold">{t('flipSplitQ', { a })}</p>
            <div className="grid grid-cols-2 gap-3 w-full">
              {[
                { id: 'right', v: tens, label: `${tens} + ${ones}` },
                { id: 'digits', v: tens / 10, label: `${tens / 10} + ${ones}` },
              ]
                .sort((x, y) => (a % 2 ? x.v - y.v : y.v - x.v))
                .map((c) => (
                  <motion.button key={c.id} type="button" onClick={() => pickWay(c.v)} data-testid={`way-${c.id}`}
                    className="min-h-[76px] rounded-2xl bg-white text-3xl font-bold shadow-xl border-4" style={{ borderColor: 'var(--space-primary)', color: 'var(--space-primary)' }}
                    whileTap={{ scale: 0.9 }}>
                    {c.label}
                  </motion.button>
                ))}
            </div>
          </>
        )}
        {(phase === 'tensPart' || phase === 'onesPart' || phase === 'add') && (
          <>
            <p className="prompt-pill dock-prompt text-center text-3xl font-bold" data-testid="flip-question">
              {phase === 'tensPart' ? `${tens} × ${b} = ?` : phase === 'onesPart' ? `${ones} × ${b} = ?` : `${L} + ${R} = ?`}
            </p>
            <AnswerPad label={t('yourAnswer')} onSubmit={answer} />
          </>
        )}
        {phase === 'confirm' && (
          <>
            <p className="prompt-pill dock-prompt text-center text-2xl font-bold">{t('flipConfirm')}</p>
            <KidButton aria-label={t('flipCheckBtn')} onClick={confirm} sound="chime" disabled={done} className="w-full min-h-[76px] text-2xl border-yellow-300" data-testid="flip-check">
              {t('flipCheckBtn')}
            </KidButton>
          </>
        )}
      </div>
    </div>
  )
}
