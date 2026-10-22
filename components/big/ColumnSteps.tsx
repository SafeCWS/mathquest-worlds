'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { columnSteps } from '@/lib/math/twoDigitProblems'
import { columnSteps as columnNarration } from '@/lib/math/stepScripts'
import { sfx, unlockAudio } from '@/lib/audio/sfx'
import { AnswerPad } from './AnswerPad'
import { PV, pvBg, pvText } from './pv'
import type { ModeProps } from './types'
import { DEMO_GLOW, DemoFinger, useDemoStep } from './Demo'

// Step-by-Step Column — classic vertical layout, ONE glowing step at a time, ONES FIRST.
// 78 × 8:
//   1. ones   8 × 8 = 64          → write 4; the trade is echoed: 64 ones → 6 tens + 4 ones,
//                                    6 blue rods float up into the orange carry bubble.
//   2. tens   7 × 8 = 56          (multiply ONLY)
//   3. carry  tap the orange 6    (it slides down beside the 56)
//   4. add    56 + 6 = 62         → write 62 → 624
// Multiply and add are never fused into one prompt (research rec #3: that fusion is where
// "forgot the carry" / "carry before multiplying" come from).

const BOUNCY: [number, number, number, number] = [0.34, 1.56, 0.64, 1]
type Phase = 'ones' | 'tens' | 'carryTap' | 'tensAdd' | 'done'

function Cell({ children, glow, style, testId, active }: { children?: React.ReactNode; glow?: boolean; style?: React.CSSProperties; testId?: string; active?: boolean }) {
  return (
    <motion.span
      data-testid={testId}
      data-active={active ? '1' : undefined}
      className={`w-[56px] h-[58px] sm:w-[64px] sm:h-[72px] md:w-[84px] md:h-[88px] flex items-center justify-center rounded-2xl text-5xl md:text-6xl font-bold text-gray-800
                  ${glow ? 'bg-yellow-100 ring-4 ring-yellow-400' : ''}`}
      style={style}
      animate={glow ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={glow ? { duration: 1.2, repeat: Infinity } : {}}
    >
      {children}
    </motion.span>
  )
}

export function ColumnSteps({ problem, onSolved, onWrong, onStep, setHint, setSpeech, highlight, demo, onDemoDone, narrate }: ModeProps) {
  const t = useTranslations('bigMult')
  const locale = useLocale()
  const s = columnSteps(problem)
  const { a, b } = problem
  const [phase, setPhase] = useState<Phase>('ones')

  useEffect(() => {
    const script = columnNarration(a, b, locale)
    const find = (h: string) => script.find((x) => x.highlight === h)?.text ?? ''
    if (phase === 'ones') {
      setHint({ nudge: t('nudgeOnesCol'), step: t('stepOnes', { a: s.onesDigit, b }), worked: find('ones'), highlight: 'ones' })
      setSpeech(`${t('speakProblem', { a, b })} ${t('startOnes').replace(' 👉', '')}. ${s.onesDigit} × ${b}.`)
    } else if (phase === 'tens') {
      setHint({ nudge: t('nudgeTensCol'), step: t('stepTens', { a: s.tensDigit, b }), worked: find('tens'), highlight: 'tens' })
      setSpeech(t('stepTens', { a: s.tensDigit, b }))
    } else if (phase === 'carryTap' || phase === 'tensAdd') {
      setHint({ nudge: t('nudgeCarryCol', { carry: s.carry }), step: t('tapCarry', { carry: s.carry }), worked: find('answerTens'), highlight: 'carry' })
      setSpeech(phase === 'carryTap' ? t('tapCarry', { carry: s.carry }) : t('addQ', { a: s.tensProduct, b: s.carry }).replace(' = ?', ''))
    }
  }, [phase, a, b, locale, s.onesDigit, s.tensDigit, s.carry, s.tensProduct, t, setHint, setSpeech])

  const finish = () => {
    setPhase('done')
    window.setTimeout(onSolved, 800)
  }

  const answer = (n: number) => {
    if (phase === 'ones') {
      if (n !== s.onesProduct) return onWrong()
      onStep('step')
      if (s.carry > 0) window.setTimeout(() => sfx.carryPlink(), 450)
      setPhase('tens')
    } else if (phase === 'tens') {
      if (n !== s.tensProduct) return onWrong()
      if (s.carry > 0) {
        onStep('step')
        setPhase('carryTap')
      } else finish()
    } else if (phase === 'tensAdd') {
      if (n !== s.tensSum) return onWrong()
      finish()
    }
  }

  // Walkthrough: the dragon answers the ones step itself (8 × 8 = 64 → write 4, carry 6).
  const demoTarget = useRef<HTMLDivElement>(null)
  useDemoStep(demo, () => answer(s.onesProduct), columnNarration(a, b, locale)[0]?.speak ?? '', narrate, onDemoDone)

  const tapCarry = () => {
    if (phase !== 'carryTap') return
    sfx.carryPlink()
    setPhase('tensAdd')
  }

  const onesWritten = phase !== 'ones'
  const tensWritten = phase === 'done'
  const hundreds = Math.floor(s.tensSum / 10)
  const tensOut = s.tensSum % 10
  const showCarry = onesWritten && s.carry > 0
  const carryDown = phase === 'tensAdd' || phase === 'done'
  const glowCarry = phase === 'carryTap' || highlight === 'carry'

  // Item 4: "7 × 8 = ?" — the digit wears its place-value colour and glows; "tens"/"ones" is a small chip.
  const digitPrompt = (digit: number, place: 'tens' | 'ones') => (
    <span className="inline-flex flex-col items-center">
      <span>
        <motion.span
          className="inline-block rounded-xl bg-white px-2 ring-4 ring-yellow-300"
          style={pvText(place)}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          data-testid={`prompt-digit-${place}`}
        >
          {digit}
        </motion.span>{' '}
        × {b} = ?
      </span>
      <span className="mt-1 text-sm font-bold rounded-full px-2 py-0.5 bg-white" style={pvText(place)} data-testid="place-chip">
        {place === 'tens' ? t('tensChip') : t('onesChip')}
      </span>
    </span>
  )
  const prompt =
    phase === 'ones' ? `${t('stepOnes', { a: s.onesDigit, b })} = ?`
    : phase === 'tens' ? `${t('stepTens', { a: s.tensDigit, b })} = ?`
    : phase === 'carryTap' ? t('tapCarry', { carry: s.carry })
    : phase === 'tensAdd' ? t('addQ', { a: s.tensProduct, b: s.carry })
    : t('columnDone', { a, b, p: s.product })

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start" data-phase={phase} onPointerDown={unlockAudio}>
      <div className="bg-white/90 rounded-3xl p-4 shadow-xl border-4 border-white/60 flex flex-col items-center gap-2">
        {phase === 'ones' && (
          <motion.p className="self-end mr-2 text-xl font-bold rounded-full px-4 py-1 border-4 bg-white" style={{ ...pvText('ones'), borderColor: PV.ones }}
            initial={{ x: -20, opacity: 0 }} animate={{ x: [0, 6, 0], opacity: 1 }} transition={{ x: { duration: 1, repeat: Infinity } }} data-testid="start-ones">
            {t('startOnes')}
          </motion.p>
        )}
        <div className="relative grid grid-cols-4 gap-1" aria-label={`${a} × ${b}`}>
          {/* carry row */}
          <Cell />
          <Cell />
          <span className="w-[56px] h-[54px] sm:w-[64px] sm:h-[60px] md:w-[84px] flex items-end justify-center">
            <AnimatePresence>
              {showCarry && !carryDown && (
                <motion.button
                  type="button"
                  onClick={tapCarry}
                  aria-label={t('tapCarry', { carry: s.carry })}
                  data-testid="carry-bubble"
                  data-active={phase === 'tens' || phase === 'carryTap' ? '1' : undefined}
                  className={`w-[58px] h-[58px] rounded-full text-white text-3xl font-bold flex items-center justify-center border-4 border-white shadow-lg
                              ${glowCarry ? 'ring-4 ring-yellow-400' : ''}`}
                  style={pvBg('carry')}
                  initial={{ scale: 0, y: 60, x: 60 }}
                  animate={glowCarry ? { scale: [1, 1.15, 1], y: 0, x: 0 } : { scale: 1, y: 0, x: 0 }}
                  exit={{ y: 120, scale: 0.6, opacity: 0 }}
                  transition={glowCarry ? { scale: { duration: 0.9, repeat: Infinity }, ease: BOUNCY } : { ease: BOUNCY, duration: 0.6 }}
                >
                  {s.carry}
                </motion.button>
              )}
            </AnimatePresence>
          </span>
          <span />
          {/* a */}
          <Cell />
          <Cell />
          <Cell glow={phase === 'tens' || highlight === 'tens'} active={phase === 'tens'} style={pvText('tens')}>{s.tensDigit}</Cell>
          <Cell glow={phase === 'ones' || highlight === 'ones'} active={phase === 'ones'} style={pvText('ones')}>{s.onesDigit}</Cell>
          {/* × b */}
          <Cell style={{ color: 'var(--space-primary)' }}>×</Cell>
          <Cell />
          <Cell />
          <Cell glow={phase === 'ones' || phase === 'tens'} active={phase === 'ones' || phase === 'tens'}>{b}</Cell>
          {/* rule */}
          <span className="col-span-4 h-[6px] rounded-full my-1" style={{ backgroundColor: 'var(--space-primary)' }} />
          {/* answer row */}
          <Cell />
          <Cell style={pvText('hundreds')} testId="ans-hundreds">
            {tensWritten && hundreds > 0 && (
              <motion.span initial={{ y: -40, scale: 0 }} animate={{ y: 0, scale: 1 }} transition={{ ease: BOUNCY }}>{hundreds}</motion.span>
            )}
          </Cell>
          <Cell style={pvText('tens')} glow={phase === 'tensAdd' || highlight === 'answerTens'} testId="ans-tens">
            {tensWritten && (
              <motion.span initial={{ y: -40, scale: 0 }} animate={{ y: 0, scale: 1 }} transition={{ ease: BOUNCY }}>{tensOut}</motion.span>
            )}
          </Cell>
          <Cell style={pvText('ones')} glow={highlight === 'answerOnes'} testId="ans-ones">
            {onesWritten && (
              <motion.span initial={{ y: -40, scale: 0 }} animate={{ y: 0, scale: 1 }} transition={{ ease: BOUNCY }}>{s.onesWrite}</motion.span>
            )}
          </Cell>
        </div>

        {/* Working line: the step's product, and the carry joining it as its own add step */}
        <AnimatePresence mode="wait">
          {(phase === 'carryTap' || phase === 'tensAdd') && (
            <motion.div key="add" className="flex flex-col items-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {(phase === 'carryTap' || phase === 'tensAdd') && (
                <p className="text-[22px] font-bold rounded-full px-4 py-1 bg-white border-4" style={{ borderColor: PV.carry, color: 'var(--space-primary)' }} data-testid="carry-note">
                  {t('carryEcho', { product: s.onesProduct, carry: s.carry, write: s.onesWrite })}
                </p>
              )}
              {(phase === 'carryTap' || phase === 'tensAdd') && (
                <p className="text-3xl font-bold flex items-center gap-2" data-testid="add-line" data-active="1">
                  <span style={pvText('tens')}>{s.tensProduct}</span>
                  <span className="text-gray-500">+</span>
                  {phase === 'tensAdd' ? (
                    <motion.span className="w-[48px] h-[48px] rounded-full text-white flex items-center justify-center border-4 border-white shadow" style={pvBg('carry')}
                      initial={{ y: -80, scale: 0.5 }} animate={{ y: 0, scale: 1 }} transition={{ ease: BOUNCY, duration: 0.6 }}>
                      {s.carry}
                    </motion.span>
                  ) : (
                    <span className="w-[48px] h-[48px] rounded-full border-4 border-dashed flex items-center justify-center text-gray-400" style={{ borderColor: PV.carry }}>?</span>
                  )}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="action-dock flex flex-col items-center gap-2 md:gap-3 md:w-[300px]">
        <div className="prompt-pill dock-prompt text-center text-3xl font-bold" data-testid="column-prompt" aria-label={prompt}>
          {phase === 'ones' ? digitPrompt(s.onesDigit, 'ones') : phase === 'tens' ? digitPrompt(s.tensDigit, 'tens') : prompt}
        </div>
        {phase === 'carryTap' && (
          <motion.button type="button" onClick={tapCarry} data-testid="carry-tap-btn"
            className="min-h-[76px] w-full rounded-2xl text-white text-2xl font-bold shadow-xl border-4 border-white" style={pvBg('carry')}
            whileTap={{ scale: 0.9 }}>
            + {s.carry}
          </motion.button>
        )}
        {(phase === 'ones' || phase === 'tens' || phase === 'tensAdd') && (
          <div ref={demoTarget} className={`dock-contents rounded-3xl ${demo ? DEMO_GLOW : ''}`}>
            <AnswerPad label={t('yourAnswer')} onSubmit={answer} />
          </div>
        )}
        {demo && <DemoFinger target={demoTarget} />}
      </div>
    </div>
  )
}
