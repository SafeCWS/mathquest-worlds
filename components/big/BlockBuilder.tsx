'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { KidButton } from '@/components/ui/KidButton'
import { columnSteps } from '@/lib/math/twoDigitProblems'
import { blockBuilderSteps } from '@/lib/math/stepScripts'
import { matColumns, stageCounts, stagesFor, truckColumns, type CrateColumn, type CrateStage } from '@/lib/math/blockLayout'
import { DEMO_GLOW, DemoFinger, useDemoStep } from './Demo'
import { sfx, unlockAudio } from '@/lib/audio/sfx'
import { AnswerPad } from './AnswerPad'
import { PV, PV_TEXT, pvBg } from './pv'
import type { ModeProps } from './types'

// Block Builder — story wrapper: "3 trucks carry 42 apples each; a crate holds 10".
// Two drawings, chosen by size (2026-10-22 round, item #1 — never more than ~15 objects):
//   • product < 100 (Levels 1–2): SmallBlockBuilder — rods (blue) + cubes (pink), one tap per truck.
//   • product ≥ 100 (Level 3):    CrateBuilder — big crate = 100, crate = 10, apple = 1, laid out by
//     lib/math/blockLayout (≤ 4 icons per column, a ×N badge on a stack beyond that).
// TAP ONLY. Art is inline SVG/CSS from globals.css tokens only — no external assets.

export function BlockBuilder(props: ModeProps) {
  return props.problem.a * props.problem.b >= 100 ? <CrateBuilder {...props} /> : <SmallBlockBuilder {...props} />
}

const BOUNCY: [number, number, number, number] = [0.34, 1.56, 0.64, 1]
type Phase = 'tens' | 'ones' | 'trade' | 'total'

function Rod({ glow, small }: { glow?: boolean; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block rounded-[4px] border-2 ${glow ? 'border-yellow-300' : 'border-white/60'} ${small ? 'w-[9px] h-[44px]' : 'w-[12px] h-[56px]'}`}
      style={{ ...pvBg('tens'), backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 9%, rgba(255,255,255,0.5) 9% 10%)' }}
    />
  )
}

function Apple({ small }: { small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block rounded-full border-2 border-white/60 ${small ? 'w-[10px] h-[10px]' : 'w-[14px] h-[14px]'}`}
      style={pvBg('ones')}
    />
  )
}

/** Inline-SVG truck the group sits on. */
function Truck({ children, lit, glow }: { children: React.ReactNode; lit: boolean; glow: boolean }) {
  return (
    <div className={`relative rounded-2xl px-2 pt-2 pb-0 ${glow ? 'ring-4 ring-yellow-300' : ''}`}>
      <div className={`flex items-end gap-1 min-h-[64px] px-2 pb-1 rounded-t-xl border-4 border-b-0 transition-colors ${lit ? 'bg-yellow-50 border-yellow-300' : 'bg-white/70 border-amber-200'}`}>
        {children}
      </div>
      <svg viewBox="0 0 120 34" className="w-full h-[30px] -mt-[2px]" aria-hidden="true">
        <rect x="0" y="0" width="88" height="14" rx="3" fill="var(--jungle-accent)" />
        <path d="M88 2 h16 l12 12 v8 h-28z" fill="var(--dino-secondary)" />
        <rect x="94" y="5" width="9" height="6" rx="1" fill="white" opacity="0.85" />
        <circle cx="22" cy="24" r="8" fill="var(--space-primary)" /><circle cx="22" cy="24" r="3" fill="white" />
        <circle cx="96" cy="24" r="8" fill="var(--space-primary)" /><circle cx="96" cy="24" r="3" fill="white" />
      </svg>
    </div>
  )
}

function SmallBlockBuilder({ problem, onSolved, onWrong, onStep, setHint, setSpeech, highlight, demo, onDemoDone, narrate }: ModeProps) {
  const t = useTranslations('bigMult')
  const locale = useLocale()
  const s = columnSteps(problem)
  const { a, b } = problem
  const [phase, setPhase] = useState<Phase>('tens')
  const [tensGroups, setTensGroups] = useState(0)
  const [onesGroups, setOnesGroups] = useState(0)
  const [trades, setTrades] = useState(0)
  const [merging, setMerging] = useState(false)

  const tensInBin = tensGroups * s.tensDigit + trades
  const onesInBin = onesGroups * s.onesDigit - trades * 10
  const small = b * (s.tensDigit + s.onesDigit) > 60

  useEffect(() => {
    const script = blockBuilderSteps(a, b, locale)
    const find = (h: string, nth = 0) => script.filter((x) => x.highlight === h)[nth]?.text ?? ''
    if (phase === 'tens') {
      setHint({ nudge: t('nudgeTens'), step: t('hintBlocks'), worked: find('rods'), highlight: 'rods' })
      setSpeech(`${t('storyBlocks', { groups: b, n: a })} ${t('countTens')}.`)
    } else if (phase === 'ones') {
      setHint({ nudge: t('nudgeOnes'), step: t('hintSplitOnes', { a: s.onesDigit, b }), worked: find('cubes'), highlight: 'cubes' })
      setSpeech(t('countOnes'))
    } else if (phase === 'trade') {
      setHint({ nudge: t('nudgeTrade'), step: t('hintTrade'), worked: find('trade'), highlight: 'trade' })
      setSpeech(t('trade'))
    } else {
      setHint({
        nudge: t('nudgeTotal', { tens: tensInBin }),
        step: t('hintTotal', { tens: tensInBin, tensValue: tensInBin * 10, ones: onesInBin }),
        worked: find('answer'),
        highlight: 'answer',
      })
      setSpeech(t('totalQ', { tens: tensInBin, ones: onesInBin }))
    }
  }, [phase, a, b, locale, t, setHint, setSpeech, tensInBin, onesInBin, s.onesDigit])

  const countTens = () => {
    const n = tensGroups + 1
    setTensGroups(n)
    sfx.blockPop()
    if (n === b) {
      onStep('step')
      setPhase('ones')
    }
  }

  const countOnes = () => {
    const n = onesGroups + 1
    setOnesGroups(n)
    sfx.blockPop()
    if (n === b) {
      onStep('step')
      setPhase(n * s.onesDigit >= 10 ? 'trade' : 'total')
    }
  }

  const trade = () => {
    if (merging) return
    setMerging(true)
    sfx.tradeWhoosh()
    window.setTimeout(() => {
      const nt = trades + 1
      setTrades(nt)
      setMerging(false)
      onStep('trade')
      if (onesGroups * s.onesDigit - nt * 10 < 10) setPhase('total')
    }, 850)
  }

  const answerTotal = (n: number) => {
    if (n === s.product) onSolved()
    else onWrong(n)
  }

  // Walkthrough: the dragon taps "Count the tens" once (first truck), then hands over.
  const demoTarget = useRef<HTMLDivElement>(null)
  useDemoStep(demo, countTens, `${t('storyBlocks', { groups: b, n: a })} ${t('countTens')}.`, narrate, onDemoDone)

  const glowRods = highlight === 'rods' || phase === 'tens'
  const glowCubes = highlight === 'cubes' || highlight === 'trade' || phase === 'ones' || phase === 'trade'

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start" data-phase={phase} onPointerDown={unlockAudio}>
      <div className="flex flex-col gap-4">
        {/* Story + trucks */}
        <div className="bg-white/85 rounded-3xl p-4 shadow-xl border-4 border-white/60">
          <p className="text-center text-xl font-bold text-gray-700 mb-3" data-testid="story">
            🍎 {t('storyBlocks', { groups: b, n: a })}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: b }, (_, g) => {
              const tensLit = g < tensGroups
              const onesLit = g < onesGroups
              return (
                <motion.div
                  key={g}
                  initial={{ x: -60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: g * 0.08, ease: BOUNCY, duration: 0.5 }}
                >
                  <Truck lit={tensLit || onesLit} glow={highlight === 'groups'}>
                    <div className={`flex gap-[3px] transition-opacity ${tensLit ? 'opacity-30' : ''}`}>
                      {Array.from({ length: s.tensDigit }, (_, i) => <Rod key={i} small={small} />)}
                    </div>
                    <div className={`grid grid-cols-2 gap-[3px] transition-opacity ${onesLit ? 'opacity-30' : ''}`}>
                      {Array.from({ length: s.onesDigit }, (_, i) => <Apple key={i} small={small} />)}
                    </div>
                  </Truck>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Tens (crates) + ones (apples) bins */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`relative bg-white/85 rounded-3xl p-3 shadow-xl border-4 min-h-[124px] ${glowRods ? 'ring-4 ring-yellow-300' : ''}`}
            data-active={glowRods ? '1' : undefined}
            style={{ borderColor: PV.tens }}
          >
            <p className="text-lg font-bold mb-2" style={{ color: PV_TEXT.tens }} data-testid="tens-count">📦 {t('tensSoFar', { n: tensInBin })}</p>
            <div className="flex flex-wrap gap-[3px]">
              {Array.from({ length: tensInBin }, (_, i) => (
                <motion.span key={`t${i}`} initial={{ y: -30, scale: 0 }} animate={{ y: 0, scale: 1 }} transition={{ ease: BOUNCY, duration: 0.4 }}>
                  <Rod small glow={i >= tensGroups * s.tensDigit} />
                </motion.span>
              ))}
            </div>
          </div>
          <div
            className={`relative bg-white/85 rounded-3xl p-3 shadow-xl border-4 min-h-[124px] ${glowCubes ? 'ring-4 ring-yellow-300' : ''}`}
            data-active={glowCubes ? '1' : undefined}
            style={{ borderColor: PV.ones }}
          >
            <p className="text-lg font-bold mb-2" style={{ color: PV_TEXT.ones }} data-testid="ones-count">🍎 {t('onesSoFar', { n: onesInBin })}</p>
            <div className="relative flex flex-wrap gap-[3px]">
              {Array.from({ length: onesInBin }, (_, i) => {
                const inMerge = merging && i < 10
                // The 10 traded apples slide left into a single column (the crate shape), then fade.
                return (
                  <motion.span
                    key={`o${trades}-${i}`}
                    initial={{ y: -30, scale: 0 }}
                    animate={inMerge ? { x: -((i % 10) * 13), y: (i % 10) * 4 - 18, scale: 0.8, opacity: [1, 1, 0] } : { y: 0, scale: 1 }}
                    transition={inMerge ? { duration: 0.6, ease: 'easeInOut' } : { ease: BOUNCY, duration: 0.4 }}
                  >
                    <Apple small />
                  </motion.span>
                )
              })}
              {/* The new crate forms where the apples met, then flies to the tens bin. */}
              <AnimatePresence>
                {merging && (
                  <motion.span
                    key={`crate-${trades}`}
                    className="absolute left-0 top-0"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.3, 1], opacity: 1, x: [0, 0, -180], y: [0, -10, -10] }}
                    transition={{ duration: 0.85, times: [0, 0.6, 1], ease: 'easeInOut' }}
                    data-testid="trade-crate"
                  >
                    <Rod glow />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Action column — one big tap target at a time */}
      <div className="action-dock flex flex-col items-center gap-2 md:gap-3 md:w-[300px]">
        {phase === 'tens' && (
          <div ref={demoTarget} className={`w-full rounded-2xl ${demo ? DEMO_GLOW : ''}`}>
            <KidButton aria-label={`${t('countTens')} (${tensGroups}/${b})`} onClick={countTens} sound={null}
              className="w-full min-h-[76px] text-2xl border-blue-300 flex items-center justify-center gap-2" data-testid="count-tens">
              <span aria-hidden="true">📦</span> {t('countTens')} <span>({tensGroups}/{b})</span>
            </KidButton>
          </div>
        )}
        {demo && <DemoFinger target={demoTarget} />}
        {phase === 'ones' && (
          <KidButton aria-label={`${t('countOnes')} (${onesGroups}/${b})`} onClick={countOnes} sound={null}
            className="w-full min-h-[76px] text-2xl border-pink-300 flex items-center justify-center gap-2" data-testid="count-ones">
            <span aria-hidden="true">🍎</span> {t('countOnes')} <span>({onesGroups}/{b})</span>
          </KidButton>
        )}
        {phase === 'trade' && (
          <>
            {/* B1: the bubble lives here, wraps, and can never widen the page. */}
            <motion.div
              className="max-w-full text-center text-white font-bold text-lg md:text-xl px-4 py-2 rounded-3xl shadow-lg border-4 border-white"
              style={pvBg('carry')}
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: [1, 1.05, 1], y: 0 }}
              transition={{ scale: { duration: 1.2, repeat: Infinity }, ease: BOUNCY }}
              data-testid="trade-bubble"
            >
              {t('trade')}
            </motion.div>
            <KidButton aria-label={t('tradeBtn')} onClick={trade} sound={null} disabled={merging}
              className="w-full min-h-[76px] text-2xl border-orange-300 flex items-center justify-center gap-2" data-testid="trade-btn">
              <span aria-hidden="true">📦</span> {t('tradeBtn')}
            </KidButton>
          </>
        )}
        {phase === 'total' && (
          <>
            <p className="prompt-pill dock-prompt text-center text-xl font-bold">{t('totalQ', { tens: tensInBin, ones: onesInBin })}</p>
            <AnswerPad label={t('yourAnswer')} onSubmit={answerTotal} />
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────── Level 3: place-value crates ───────────────────────────

const CRATE_META: Record<CrateColumn['kind'], { labelKey: 'bigCratesLabel' | 'cratesLabel' | 'applesLabel'; value: number; tone: 'hundreds' | 'tens' | 'ones' }> = {
  bigCrate: { labelKey: 'bigCratesLabel', value: 100, tone: 'hundreds' },
  crate: { labelKey: 'cratesLabel', value: 10, tone: 'tens' },
  apple: { labelKey: 'applesLabel', value: 1, tone: 'ones' },
}

/** One drawn object. Every icon carries data-obj so QA can count what is really on screen. */
function CrateIcon({ kind }: { kind: CrateColumn['kind'] }) {
  if (kind === 'apple') {
    return <span data-obj="apple" aria-hidden="true" className="inline-block w-[30px] h-[30px] rounded-full border-4 border-white shadow" style={pvBg('ones')} />
  }
  const big = kind === 'bigCrate'
  return (
    <span
      data-obj={kind}
      aria-hidden="true"
      className={`inline-flex items-center justify-center rounded-xl border-4 border-white shadow font-bold text-white ${big ? 'w-[64px] h-[52px] text-xl' : 'w-[44px] h-[36px] text-base'}`}
      style={{ ...pvBg(big ? 'hundreds' : 'tens'), backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 22%, rgba(255,255,255,0.35) 22% 26%)' }}
    >
      {big ? 100 : 10}
    </span>
  )
}

/** A column: up to 4 icons, or ONE stacked icon with a ×N badge. */
function CrateStack({ col, glow, label }: { col: CrateColumn; glow: boolean; label: string }) {
  const meta = CRATE_META[col.kind]
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-3xl p-2 sm:p-3 bg-white/90 border-4 min-h-[118px] sm:min-h-[150px] ${glow ? 'ring-4 ring-yellow-300' : ''}`}
      data-active={glow ? '1' : undefined}
      style={{ borderColor: PV[meta.tone] }}
      data-testid={`mat-${col.kind}`}
    >
      <p className="text-base md:text-lg font-bold text-center" style={{ color: PV_TEXT[meta.tone] }}>
        {label}: <span className="text-2xl">{col.count}</span>
      </p>
      <div className="flex flex-wrap justify-center items-end gap-1.5 min-h-[60px]">
        {col.badge === null ? (
          Array.from({ length: col.icons }, (_, i) => (
            <motion.span key={`${col.kind}-${col.count}-${i}`} initial={{ y: -24, scale: 0 }} animate={{ y: 0, scale: 1 }} transition={{ ease: BOUNCY, duration: 0.45, delay: i * 0.05 }}>
              <CrateIcon kind={col.kind} />
            </motion.span>
          ))
        ) : (
          <motion.span key={`${col.kind}-stack-${col.count}`} className="relative inline-flex items-center gap-1.5" initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ ease: BOUNCY, duration: 0.5 }}>
            {/* stack look: two offset shadows behind the one drawn icon (decoration, not objects) */}
            <span aria-hidden="true" className="absolute -top-2 -left-2 opacity-40 pointer-events-none"><span className="block" style={{ filter: 'grayscale(0.2)' }}><CrateShadow kind={col.kind} /></span></span>
            <CrateIcon kind={col.kind} />
            <span className="rounded-full px-2 py-0.5 text-lg font-bold text-white border-2 border-white shadow" style={{ backgroundColor: 'var(--space-primary)' }} data-testid={`badge-${col.kind}`}>
              ×{col.badge}
            </span>
          </motion.span>
        )}
        {col.count === 0 && <span aria-hidden="true" className="inline-block w-[56px] h-[44px] rounded-xl border-4 border-dashed border-slate-300" />}
      </div>
    </div>
  )
}

/** Same shape as CrateIcon without data-obj (so it is never counted as an object). */
function CrateShadow({ kind }: { kind: CrateColumn['kind'] }) {
  if (kind === 'apple') return <span className="inline-block w-[30px] h-[30px] rounded-full" style={pvBg('ones')} />
  const big = kind === 'bigCrate'
  return <span className={`inline-block rounded-xl ${big ? 'w-[64px] h-[52px]' : 'w-[44px] h-[36px]'}`} style={pvBg(big ? 'hundreds' : 'tens')} />
}

function CrateBuilder({ problem, onSolved, onWrong, onStep, setHint, setSpeech, highlight, demo, onDemoDone, narrate }: ModeProps) {
  const t = useTranslations('bigMult')
  const locale = useLocale()
  const s = columnSteps(problem)
  const { a, b } = problem
  const stages = stagesFor(problem)
  const [stage, setStage] = useState<CrateStage>('truck')
  const [busy, setBusy] = useState(false)
  const [answering, setAnswering] = useState(false)
  const counts = stageCounts(problem, stage)
  const nextStage = stages[stages.indexOf(stage) + 1] as CrateStage | undefined
  const phase = answering ? 'total' : stage === 'truck' ? 'unload' : nextStage === 'onesDone' ? 'tradeOnes' : nextStage === 'tensDone' ? 'tradeTens' : 'total'
  const summary = t('matSummary', { h: counts.hundreds, t: counts.tens, o: counts.ones })

  useEffect(() => {
    const script = blockBuilderSteps(a, b, locale)
    const find = (h: string, nth = 0) => script.filter((x) => x.highlight === h)[nth]?.text ?? ''
    if (phase === 'unload') {
      setHint({ nudge: t('nudgeUnload'), step: t('hintUnload', { t: s.tensDigit, o: s.onesDigit, b }), worked: find('groups'), highlight: 'groups' })
      setSpeech(`${t('storyBig', { groups: b, n: a })} ${t('unloadBtn')}.`)
    } else if (phase === 'tradeOnes') {
      setHint({ nudge: t('nudgeTrade'), step: t('hintTrade'), worked: find('trade'), highlight: 'trade' })
      setSpeech(t('trade'))
    } else if (phase === 'tradeTens') {
      setHint({ nudge: t('nudgeTradeTens'), step: t('hintTradeTens'), worked: find('rods', 1) || find('rods'), highlight: 'rods' })
      setSpeech(t('tradeTens'))
    } else {
      setHint({ nudge: t('crateKey'), step: t('hintTotal', { tens: counts.hundreds * 10 + counts.tens, tensValue: counts.hundreds * 100 + counts.tens * 10, ones: counts.ones }), worked: find('answer'), highlight: 'answer' })
      setSpeech(t('totalQBig', { summary }))
    }
  }, [phase, a, b, locale, t, setHint, setSpeech, s.tensDigit, s.onesDigit, counts.hundreds, counts.tens, counts.ones, summary])

  const advance = (event: 'step' | 'trade') => {
    if (busy || !nextStage) return
    setBusy(true)
    if (event === 'trade') sfx.tradeWhoosh()
    else sfx.blockPop()
    window.setTimeout(() => {
      setStage(nextStage)
      setBusy(false)
      onStep(event)
      if (stages.indexOf(nextStage) === stages.length - 1) setAnswering(true)
    }, event === 'trade' ? 700 : 350)
  }

  const answerTotal = (n: number) => {
    if (n === s.product) onSolved()
    else onWrong(n)
  }

  const demoTarget = useRef<HTMLDivElement>(null)
  useDemoStep(demo, () => advance('step'), `${t('storyBig', { groups: b, n: a })} ${t('unloadBtn')}.`, narrate, onDemoDone)

  const truck = truckColumns(problem)
  const mat = matColumns(counts)

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start" data-phase={phase} data-crates="1" onPointerDown={unlockAudio}>
      <div className="flex flex-col gap-3">
        <div className="bg-white/90 rounded-3xl p-4 shadow-xl border-4 border-white/60">
          <p className="text-center text-xl font-bold text-gray-800" data-testid="story">🍎 {t('storyBig', { groups: b, n: a })}</p>
          <p className="text-center text-base font-semibold text-gray-600 mt-1">{t('crateKey')}</p>
          <AnimatePresence mode="wait">
            {stage === 'truck' && (
              <motion.div key="truck" className="flex justify-center mt-3" initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 220, opacity: 0 }} transition={{ ease: BOUNCY, duration: 0.6 }}>
                <div className="relative" data-obj="truck" data-active="1">
                  <Truck lit={false} glow={highlight === 'groups'}>
                    <div className="flex items-end gap-2">
                      {truck.map((c) => (
                        <span key={c.kind} className="relative inline-flex items-end gap-1">
                          {Array.from({ length: c.icons }, (_, i) => <CrateIcon key={i} kind={c.kind} />)}
                          {c.badge !== null && (
                            <span className="absolute -top-3 -right-4 rounded-full px-1.5 text-sm font-bold text-white border-2 border-white" style={{ backgroundColor: 'var(--space-primary)' }}>×{c.badge}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </Truck>
                  <span className="absolute -top-3 -right-3 rounded-full px-3 py-1 text-2xl font-bold text-white border-4 border-white shadow-lg" style={{ backgroundColor: 'var(--space-primary)' }} data-testid="truck-badge">
                    ×{b}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {stage !== 'truck' && (
            <p className="text-center text-2xl font-bold mt-2" style={{ color: 'var(--space-primary)' }} data-testid="mat-summary" data-active={phase === 'total' ? '1' : undefined}>{summary}</p>
          )}
        </div>
        {stage !== 'truck' && (
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {mat.map((col) => (
              <CrateStack
                key={col.kind}
                col={col}
                label={t(CRATE_META[col.kind].labelKey)}
                glow={(phase === 'tradeOnes' && col.kind === 'apple') || (phase === 'tradeTens' && col.kind === 'crate') || (highlight === 'trade' && col.kind === 'apple')}
              />
            ))}
          </div>
        )}
      </div>

      <div className="action-dock flex flex-col items-center gap-2 md:gap-3 md:w-[300px]">
        {phase === 'unload' && (
          <div ref={demoTarget} className={`w-full rounded-2xl ${demo ? DEMO_GLOW : ''}`}>
            <KidButton aria-label={t('unloadBtn')} onClick={() => advance('step')} sound={null} disabled={busy}
              className="w-full min-h-[76px] text-2xl border-yellow-300 flex items-center justify-center gap-2" data-testid="unload-btn">
              <span aria-hidden="true">🚚</span> {t('unloadBtn')}
            </KidButton>
          </div>
        )}
        {demo && <DemoFinger target={demoTarget} />}
        {(phase === 'tradeOnes' || phase === 'tradeTens') && (
          <>
            <motion.div
              key={phase}
              className="max-w-full text-center text-white font-bold text-lg md:text-xl px-4 py-2 rounded-3xl shadow-lg border-4 border-white"
              style={pvBg('carry')}
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: [1, 1.05, 1], y: 0 }}
              transition={{ scale: { duration: 1.2, repeat: Infinity }, ease: BOUNCY }}
              data-testid="trade-bubble"
            >
              {phase === 'tradeOnes' ? t('trade') : t('tradeTens')}
            </motion.div>
            <KidButton
              aria-label={phase === 'tradeOnes' ? t('tradeBtn') : t('tradeTensBtn')}
              onClick={() => advance('trade')}
              sound={null}
              disabled={busy}
              className="w-full min-h-[76px] text-2xl border-orange-300 flex items-center justify-center gap-2"
              data-testid={phase === 'tradeOnes' ? 'trade-ones-btn' : 'trade-tens-btn'}
            >
              <span aria-hidden="true">{phase === 'tradeOnes' ? '📦' : '🚚'}</span> {phase === 'tradeOnes' ? t('tradeBtn') : t('tradeTensBtn')}
            </KidButton>
          </>
        )}
        {phase === 'total' && (
          <>
            <p className="prompt-pill dock-prompt text-center text-xl font-bold">{t('totalQBig', { summary })}</p>
            <AnswerPad label={t('yourAnswer')} onSubmit={answerTotal} />
          </>
        )}
      </div>
    </div>
  )
}
