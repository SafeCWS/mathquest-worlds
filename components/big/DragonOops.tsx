'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { sfx, unlockAudio } from '@/lib/audio/sfx'
import { AnswerPad } from './AnswerPad'
import { DEMO_GLOW, DemoFinger, useDemoStep } from './Demo'
import { useLater } from './useLater'
import { oopsFor, oopsPrompt, oopsWhy, replayOops } from './logic'
import type { ModeProps } from './types'

// Dragon Oops (v2, optional extra — operator can drop it at G1.5). Plan §5.
// The dragon shows its worked Break-It-Apart steps; ONE step has an oops and every step after
// it is built on the oops. The child checks from the top: a right step gets a ✓, the oops step
// is "found", fixed on the pad, then the rest recalculates with a sparkle.
// A tap BELOW the oops is not "wrong" maths — it is told to check the steps above first.

const BOUNCY: [number, number, number, number] = [0.34, 1.56, 0.64, 1]
type Phase = 'find' | 'fix' | 'fixed'

export function DragonOops({ problem, onAward, onSolved, onWrong, onStep, setHint, setSpeech, demo, onDemoDone, narrate }: ModeProps) {
  const t = useTranslations('bigMult')
  const later = useLater()
  const reduce = useReducedMotion() // html-validator minor 8: no scale/rotate pops when reduced
  const oops = useMemo(() => oopsFor(problem), [problem])
  const [phase, setPhase] = useState<Phase>('find')
  const [checked, setChecked] = useState<Set<number>>(() => new Set())
  // A right row BELOW the oops that does not use the wrong value (hackerAI #9): neutral note.
  const [elsewhere, setElsewhere] = useState(false)
  const bad = oops.steps[oops.wrongIndex]
  const why = useMemo(() => oopsWhy(oops), [oops])
  const prompt = oopsPrompt(bad)
  const fixedSteps = useMemo(() => replayOops(oops, oops.fix), [oops])
  // The row to check next (glows; phone keeps it above the sheet).
  const nextRow = oops.steps.findIndex((_, k) => !checked.has(k))

  useEffect(() => {
    if (phase === 'find') {
      setHint({ nudge: t('nudgeOopsFind'), step: t('stepOopsFind'), worked: why })
      setSpeech(`${oops.intro} ${t('oopsFind')}.`)
    } else if (phase === 'fix') {
      setHint({ nudge: t('nudgeOopsFix', { left: prompt }), step: t('stepOopsFix', { left: prompt }), worked: why })
      setSpeech(`${t('oopsFound')} ${prompt.replace(/\s*=\s*\?/, '')}`)
    } else {
      setSpeech(t('oopsFixed'))
    }
  }, [phase, oops, why, prompt, t, setHint, setSpeech])

  const tapRow = (i: number) => {
    if (phase !== 'find') return
    if (i < oops.wrongIndex) {
      if (checked.has(i)) return
      sfx.blockPop()
      setChecked((c) => new Set(c).add(i))
      onStep('step')
      return
    }
    if (i > oops.wrongIndex) {
      // The row reads the same as in the fixed chain → it is right on its own (e.g. "2 × 3 = 6"
      // after a slip in "40 × 3"). Not a miss: no wrong sound, no shake, no 🤔.
      if (oops.steps[i].text === fixedSteps[i].text) {
        if (!checked.has(i)) {
          sfx.blockPop()
          setChecked((c) => new Set(c).add(i))
        }
        setElsewhere(true)
        return
      }
      // The row is built on the dragon's wrong number: look above first.
      return onWrong(undefined, t('wrongOopsLater'))
    }
    setElsewhere(false)
    sfx.carryPlink()
    onStep('oops')
    setPhase('fix')
  }

  const answer = (n: number) => {
    if (phase !== 'fix') return
    if (n !== oops.fix) return onWrong(undefined, n === bad.value ? t('wrongOopsDragon', { left: prompt }) : undefined)
    sfx.tradeWhoosh()
    setPhase('fixed')
    onAward?.() // credit at acceptance; the sparkle replay follows
    later(onSolved, 1400)
  }

  const demoTarget = useRef<HTMLButtonElement>(null)
  // hackerAI #4: when the oops IS row 1 the dragon must not call it right — it looks, then hands
  // over without a verdict.
  useDemoStep(demo, () => (oops.wrongIndex > 0 ? tapRow(0) : undefined), oops.wrongIndex > 0 ? t('demoOops') : t('demoOopsLook'), narrate, onDemoDone)

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start" data-phase={phase} onPointerDown={unlockAudio}>
      <div className="bg-white/85 rounded-3xl p-4 shadow-xl border-4 border-white/60 flex flex-col gap-3">
        <p className="text-center text-xl md:text-2xl font-bold" style={{ color: 'var(--space-primary)' }}>
          <span aria-hidden="true">🐉📝 </span>
          {t('oopsTitle')}
        </p>
        <ol className="flex flex-col gap-2" data-testid="oops-steps">
          {oops.steps.map((s, i) => {
            const isBad = i === oops.wrongIndex
            const after = i > oops.wrongIndex
            const done = phase === 'fixed'
            const text = done ? fixedSteps[i].text : s.text
            const found = isBad && phase !== 'find'
            const ok = checked.has(i)
            const active = (phase === 'find' && !ok) || (phase === 'fix' && isBad)
            return (
              <li key={i}>
                <motion.button
                  ref={i === 0 ? demoTarget : undefined}
                  type="button"
                  onClick={() => tapRow(i)}
                  data-testid={`oops-row-${i}`}
                  data-obj="step"
                  data-state={found ? (done ? 'fixed' : 'found') : ok ? 'ok' : 'open'}
                  data-active={(phase === 'fix' && isBad) || (phase === 'find' && i === nextRow) ? '1' : undefined}
                  className={`relative w-full min-h-[64px] px-4 rounded-2xl flex items-center justify-between gap-3 text-2xl md:text-3xl font-bold shadow border-4 text-left
                    ${found ? 'bg-amber-50 border-amber-300 text-amber-900' : ok ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-white text-gray-800'}
                    ${demo && i === 0 ? DEMO_GLOW : ''}`}
                  whileTap={phase === 'find' && !reduce ? { scale: 0.96 } : undefined}
                  aria-pressed={ok || found}
                  disabled={phase !== 'find' && !active}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-9 h-9 shrink-0 rounded-full text-base text-white flex items-center justify-center" style={{ backgroundColor: 'var(--space-primary)' }}>{i + 1}</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={text}
                        data-testid={`oops-text-${i}`}
                        initial={done && (isBad || after) ? (reduce ? { opacity: 0 } : { scale: 0.6, opacity: 0 }) : false}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ ease: BOUNCY, duration: 0.5, delay: done ? (i - oops.wrongIndex) * 0.25 : 0 }}
                      >
                        {phase === 'fix' && isBad ? prompt : text}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="text-lg shrink-0">
                    {ok && <span>✓ {t('oopsChecked')}</span>}
                    {found && !done && <span>🔍 {t('oopsFound')}</span>}
                    {done && (isBad || after) && (
                      <motion.span initial={reduce ? { opacity: 0 } : { scale: 0, rotate: -30 }} animate={reduce ? { opacity: 1 } : { scale: [0, 1.4, 1], rotate: 0 }} transition={{ duration: reduce ? 0.2 : 0.6, delay: (i - oops.wrongIndex) * 0.25 }} data-testid="oops-sparkle">✨</motion.span>
                    )}
                  </span>
                </motion.button>
              </li>
            )
          })}
        </ol>
        {phase === 'fixed' && (
          <motion.p className="text-center text-2xl font-bold text-emerald-700" initial={reduce ? { opacity: 0 } : { scale: 0 }} animate={reduce ? { opacity: 1 } : { scale: 1 }} transition={{ ease: BOUNCY }} data-testid="oops-fixed">
            {t('oopsFixed')}
          </motion.p>
        )}
        {demo && <DemoFinger target={demoTarget} />}
      </div>

      <div className="action-dock flex flex-col items-center gap-2 md:gap-3 md:w-[300px]">
        {phase === 'find' && <p className="prompt-pill dock-prompt text-center text-2xl font-bold" data-testid="oops-prompt">{t('oopsFind')} 👆</p>}
        {phase === 'find' && elsewhere && (
          <p className="text-center text-xl font-bold text-emerald-800 bg-emerald-50 border-2 border-emerald-300 rounded-2xl px-3 py-2" role="status" data-testid="oops-elsewhere">
            ✓ {t('oopsElsewhere')}
          </p>
        )}
        {phase === 'fix' && (
          <>
            <p className="prompt-pill dock-prompt text-center text-3xl font-bold" data-testid="oops-question">{prompt}</p>
            <AnswerPad label={t('yourAnswer')} onSubmit={answer} />
          </>
        )}
        {phase === 'fixed' && <p className="prompt-pill dock-prompt text-center text-2xl font-bold">{problem.a} × {problem.b} = {problem.a * problem.b}</p>}
      </div>
    </div>
  )
}
