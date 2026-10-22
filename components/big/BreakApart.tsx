'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { splitTensOnes } from '@/lib/math/twoDigitProblems'
import { breakApartSteps } from '@/lib/math/stepScripts'
import { sfx, unlockAudio } from '@/lib/audio/sfx'
import { AnswerPad } from './AnswerPad'
import { PV, pvBg, pvText } from './pv'
import type { ModeProps } from './types'
import { DEMO_GLOW, DemoFinger, useDemoStep } from './Demo'

// Break It Apart — area model, BIGGEST PLACE FIRST (40 × 3 before 2 × 3; research note:
// partial products read left to right, the column algorithm runs ones-first — each mode says so).
// Tap 42 → 40 + 2, the rectangle splits; answer 40 × 3 and 2 × 3, then 120 + 6 as the pieces slide together.
// Tens piece = blue, ones piece = pink — the same tokens as the rods/cubes and the column digits.

const BOUNCY: [number, number, number, number] = [0.34, 1.56, 0.64, 1]
type Phase = 'split' | 'left' | 'right' | 'add' | 'merged'

const rows = (b: number) =>
  `repeating-linear-gradient(180deg, transparent 0 calc(${100 / b}% - 2px), rgba(255,255,255,0.55) calc(${100 / b}% - 2px) ${100 / b}%)`

export function BreakApart({ problem, onSolved, onWrong, onStep, setHint, setSpeech, highlight, demo, onDemoDone, narrate }: ModeProps) {
  const t = useTranslations('bigMult')
  const locale = useLocale()
  const { a, b } = problem
  const [tens, ones] = splitTensOnes(a)
  const left = tens * b
  const right = ones * b
  const [phase, setPhase] = useState<Phase>('split')
  const split = phase !== 'split'

  useEffect(() => {
    const script = breakApartSteps(a, b, locale)
    const find = (h: string) => script.find((x) => x.highlight === h)?.text ?? ''
    if (phase === 'split') {
      setHint({ nudge: t('nudgeSplit'), step: t('splitPrompt', { a }), worked: find('split'), highlight: 'split' })
      setSpeech(`${t('speakProblem', { a, b })} ${t('tapToSplit', { n: a })}.`)
    } else if (phase === 'left') {
      setHint({ nudge: t('nudgeLeft', { a: tens, b }), step: t('hintSplit', { a: tens, b, a1: tens / 10 }), worked: find('tensPart'), highlight: 'tensPart' })
      setSpeech(`${t('biggestFirst').replace(' 👉', '')}. ${t('splitQ', { a: tens, b }).replace(' = ?', '')}`)
    } else if (phase === 'right') {
      setHint({ nudge: t('nudgeRight', { a: ones, b }), step: t('hintSplitOnes', { a: ones, b }), worked: find('onesPart'), highlight: 'onesPart' })
      setSpeech(t('splitQ', { a: ones, b }).replace(' = ?', ''))
    } else {
      setHint({ nudge: t('nudgeAdd'), step: t('hintAdd', { a: left, b: right }), worked: find('sum'), highlight: 'sum' })
      setSpeech(t('addQ', { a: left, b: right }).replace(' = ?', ''))
    }
  }, [phase, a, b, tens, ones, left, right, locale, t, setHint, setSpeech])

  const tapSplit = () => {
    if (phase !== 'split') return
    sfx.blockPop()
    onStep('step')
    setPhase('left')
  }

  // Walkthrough: the dragon taps the big number to split it, then hands over.
  const demoTarget = useRef<HTMLButtonElement>(null)
  useDemoStep(demo, tapSplit, breakApartSteps(a, b, locale)[0]?.speak ?? t('tapToSplit', { n: a }), narrate, onDemoDone)

  const answer = (n: number) => {
    if (phase === 'left') {
      if (n !== left) return onWrong()
      onStep('step')
      setPhase(ones === 0 ? 'add' : 'right')
    } else if (phase === 'right') {
      if (n !== right) return onWrong()
      onStep('step')
      setPhase('add')
    } else if (phase === 'add') {
      // The sum IS the whole problem's answer → misconception check applies.
      if (n !== left + right) return onWrong(n)
      sfx.tradeWhoosh()
      setPhase('merged')
      window.setTimeout(onSolved, 800)
    }
  }

  const leftPct = Math.max(62, Math.min(80, (tens / a) * 100)) // ≤ 80 so "2 × 3" fits in the ones block
  const question =
    phase === 'left' ? t('splitQ', { a: tens, b })
    : phase === 'right' ? t('splitQ', { a: ones, b })
    : phase === 'add' ? t('addQ', { a: left, b: right })
    : null
  const glowLeft = phase === 'left' || highlight === 'tensPart'
  const glowRight = phase === 'right' || highlight === 'onesPart'
  const merged = phase === 'merged'

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start" data-phase={phase} onPointerDown={unlockAudio}>
      <div className="bg-white/85 rounded-3xl p-4 shadow-xl border-4 border-white/60 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-4xl md:text-5xl font-bold text-gray-800 min-h-[88px]">
          {!split ? (
            <motion.button
              ref={demoTarget}
              type="button"
              onClick={tapSplit}
              aria-label={t('tapToSplit', { n: a })}
              data-testid="split-number"
              data-active="1"
              className={`min-w-[120px] min-h-[88px] px-5 rounded-3xl text-white shadow-xl border-4 border-white ${demo ? DEMO_GLOW : ''}`}
              style={{ background: `linear-gradient(90deg, ${PV.tens} 0 60%, ${PV.ones} 60% 100%)` }}
              animate={{ scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              whileTap={{ scale: 0.88 }}
            >
              {a}
            </motion.button>
          ) : (
            <>
              {/* QA M11: brackets — "70 + 8 × 8" would mean 70 + 64. */}
              <span className="text-gray-500">(</span>
              <motion.span className="px-4 py-2 rounded-2xl text-white border-4 border-white shadow" style={pvBg('tens')}
                initial={{ x: 40, scale: 0.6 }} animate={{ x: 0, scale: 1 }} transition={{ ease: BOUNCY, duration: 0.55 }}>
                {tens}
              </motion.span>
              <span className="text-gray-500">+</span>
              <motion.span className="px-4 py-2 rounded-2xl text-white border-4 border-white shadow" style={pvBg('ones')}
                initial={{ x: -40, scale: 0.6 }} animate={{ x: 0, scale: 1 }} transition={{ ease: BOUNCY, duration: 0.55 }}>
                {ones}
              </motion.span>
              <span className="text-gray-500">)</span>
            </>
          )}
          <span className="text-gray-500">×</span>
          <span>{b}</span>
          {demo && <DemoFinger target={demoTarget} />}
        </div>
        {!split ? (
          <p className="text-center text-xl font-bold text-indigo-700">{t('tapToSplit', { n: a })} 👆</p>
        ) : (
          phase === 'left' && <p className="text-center text-lg font-bold" style={pvText('tens')}>{t('biggestFirst')}</p>
        )}

        {/* Area model: b rows tall, split 40 : 2 wide */}
        <div className="flex items-stretch gap-2">
          {/* Side label: "3 rows" + one marker per row, lined up with the stripes. */}
          <div className="flex flex-col items-center w-[72px] shrink-0" data-testid="rows-label">
            <span className="text-base font-bold text-center leading-tight mb-1" style={{ color: 'var(--space-primary)' }}>{t('rowsLabel', { n: b })}</span>
            <div className="flex-1 flex flex-col justify-around w-full items-center">
              {Array.from({ length: b }, (_, i) => (
                <span key={i} aria-hidden="true" className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: 'var(--space-primary)' }} />
              ))}
            </div>
          </div>
          <motion.div className="flex-1 flex h-[150px] sm:h-[210px]" animate={{ gap: merged ? '0px' : split ? '16px' : '0px' }} transition={{ ease: BOUNCY, duration: 0.7 }}>
            <motion.div
              className={`relative flex items-center justify-center overflow-hidden border-4 border-white
                          ${merged ? 'rounded-l-2xl' : 'rounded-2xl'} ${glowLeft ? 'ring-4 ring-yellow-300' : ''}`}
              style={{ ...pvBg(split ? 'tens' : 'tens'), backgroundImage: rows(b) }}
              animate={{ width: split ? `${leftPct}%` : '100%', scale: glowLeft ? [1, 1.02, 1] : 1 }}
              transition={{ width: { ease: BOUNCY, duration: 0.6 }, scale: { duration: 1.2, repeat: glowLeft ? Infinity : 0 } }}
              data-testid="piece-tens"
              data-active={phase === 'left' || phase === 'add' ? '1' : undefined}
            >
              {/* Item 5: the part's value, big and centred on top; inside "40 × 3", then the product once solved. */}
              {split && (
                <span className="absolute top-1 left-0 right-0 text-center text-[30px] leading-none font-bold text-white drop-shadow" data-testid="label-tens">{tens}</span>
              )}
              <span className="text-white text-2xl md:text-3xl font-bold drop-shadow text-center leading-tight mt-6">
                {!split ? `${a} × ${b}` : merged ? '' : phase === 'left' ? `${tens} × ${b}` : left}
              </span>
            </motion.div>
            {split && (
              <motion.div
                className={`relative flex items-center justify-center overflow-hidden border-4 border-white
                            ${merged ? 'rounded-r-2xl' : 'rounded-2xl'} ${glowRight ? 'ring-4 ring-yellow-300' : ''}`}
                style={{ ...pvBg('ones'), backgroundImage: rows(b) }}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: `${100 - leftPct}%`, opacity: 1 }}
                transition={{ ease: BOUNCY, duration: 0.6 }}
                data-testid="piece-ones"
                data-active={phase === 'right' || phase === 'add' ? '1' : undefined}
              >
                <span className="absolute top-1 left-0 right-0 text-center text-[30px] leading-none font-bold text-white drop-shadow" data-testid="label-ones">{ones}</span>
                <span className="text-white text-lg md:text-2xl font-bold drop-shadow text-center leading-tight mt-6 px-0.5">
                  {merged ? '' : phase === 'left' || phase === 'right' ? `${ones} × ${b}` : right}
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>
        {merged && (
          <motion.p className="text-center text-4xl font-bold" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ease: BOUNCY }}>
            <span style={pvText('tens')}>{left}</span> + <span style={pvText('ones')}>{right}</span> = <span className="text-emerald-600">{left + right}</span>
          </motion.p>
        )}
      </div>

      <div className="action-dock flex flex-col items-center gap-2 md:gap-3 md:w-[300px]">
        {question && (
          <>
            <p className="prompt-pill dock-prompt text-center text-3xl font-bold" data-testid="split-question">{question}</p>
            <AnswerPad label={t('yourAnswer')} onSubmit={answer} />
          </>
        )}
      </div>
    </div>
  )
}
