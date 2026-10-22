'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { columnSteps, estimateChoices, roundToTen, splitTensOnes } from '@/lib/math/twoDigitProblems'
import { estimateHint, breakApartSteps } from '@/lib/math/stepScripts'
import { sfx, unlockAudio } from '@/lib/audio/sfx'
import { AnswerPad } from './AnswerPad'
import { PV_TEXT } from './pv'
import type { ModeProps } from './types'
import { DEMO_GLOW, DemoFinger, useDemoStep } from './Demo'

// Quick Guess — "42 × 3 is about…" 120 / 1,200 / 12, then solve exactly.
// A wrong guess greys that choice out and explains the rounding; it never costs progress.

const BOUNCY: [number, number, number, number] = [0.34, 1.56, 0.64, 1]
const CHOICE_COLORS = [
  'from-sky-400 to-blue-500 border-sky-200',
  'from-emerald-400 to-green-500 border-emerald-200',
  'from-fuchsia-400 to-purple-500 border-fuchsia-200',
]

/** Deterministic LCG in [0, 1) — same sequence on server and client. */
function seededRandom(start: number): () => number {
  let seed = start
  return () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
}

export function QuickGuess({ problem, onSolved, onWrong, onStep, setHint, setSpeech, demo, onDemoDone, narrate }: ModeProps) {
  const t = useTranslations('bigMult')
  const locale = useLocale()
  const fmt = useMemo(() => new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US'), [locale])
  const { a, b } = problem
  // Seeded render keeps server and client in step (no hydration mismatch); after mount the
  // order is reshuffled once per problem so the right answer is not always in the same spot.
  // Never reshuffled again while the problem is up, so buttons don't move under a finger.
  const seeded = useMemo(() => estimateChoices(problem, seededRandom(problem.a * 31 + problem.b * 7)), [problem])
  const [est, setEst] = useState(seeded)
  // Deliberate post-mount reshuffle (see above) — must not run during SSR/hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setEst(estimateChoices(problem)), [problem])
  const [phase, setPhase] = useState<'guess' | 'solve' | 'done'>('guess')
  const [ruledOut, setRuledOut] = useState<number[]>([])
  const [note, setNote] = useState<string | null>(null)
  const round = roundToTen(a)
  const [tens, ones] = splitTensOnes(a)
  const s = columnSteps(problem)

  useEffect(() => {
    if (phase === 'guess') {
      setHint({ nudge: t('nudgeGuess'), step: t('hintGuess', { a, round, b }), worked: estimateHint(a, b, locale).text, highlight: 'estimate' })
      setSpeech(`${t('isAbout', { a, b })} ${est.choices.map((c) => fmt.format(c)).join(', ')}?`)
    } else {
      const sum = breakApartSteps(a, b, locale).find((x) => x.highlight === 'sum')?.text ?? ''
      setHint({ nudge: t('nudgeSolve', { a, t: tens, o: ones }), step: t('hintGuessSolve', { t: tens, o: ones, b, tp: tens * b, op: ones * b }), worked: sum, highlight: 'sum' })
      setSpeech(t('solvePrompt', { a, b }).replace(' = ?', ''))
    }
  }, [phase, a, b, round, tens, ones, est, fmt, locale, t, setHint, setSpeech])

  const pick = (c: number) => {
    if (phase !== 'guess' || ruledOut.includes(c)) return
    if (c === est.correct) {
      sfx.correct()
      onStep('step')
      setNote(t('guessGreat'))
      setPhase('solve')
    } else {
      setRuledOut((r) => [...r, c])
      setNote(null) // the shell's amber hint ladder explains the rounding
      onWrong()
    }
  }

  // Walkthrough: the dragon picks the sensible estimate (and says why), then hands over.
  const demoTarget = useRef<HTMLButtonElement>(null)
  useDemoStep(demo, () => pick(est.correct), estimateHint(a, b, locale).speak, narrate, onDemoDone)

  const answer = (n: number) => {
    if (n !== s.product) return onWrong(n)
    setPhase('done')
    window.setTimeout(onSolved, 500)
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start" data-phase={phase} onPointerDown={unlockAudio}>
      <div className="bg-white/85 rounded-3xl p-5 shadow-xl border-4 border-white/60 flex flex-col items-center gap-4">
        <p className="text-4xl md:text-5xl font-bold text-gray-800 text-center" data-testid="guess-question">
          <span style={{ color: PV_TEXT.tens }}>{Math.floor(a / 10)}</span>
          <span style={{ color: PV_TEXT.ones }}>{a % 10}</span>
          {t('isAbout', { a, b }).slice(String(a).length)}
        </p>
        <p className="text-lg text-gray-600">{t('guessPrompt')}</p>
        {demo && <DemoFinger target={demoTarget} />}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[560px]">
          {est.choices.map((c, i) => {
            const out = ruledOut.includes(c)
            const chosen = phase !== 'guess' && c === est.correct
            return (
              <motion.button
                key={c}
                ref={c === est.correct ? demoTarget : undefined}
                type="button"
                onClick={() => pick(c)}
                disabled={out || phase !== 'guess'}
                aria-label={fmt.format(c)}
                data-testid={`guess-${c}`}
                className={`min-h-[96px] rounded-3xl bg-gradient-to-br ${CHOICE_COLORS[i]} border-4 text-white text-3xl md:text-4xl font-bold shadow-xl
                            ${out ? 'opacity-35 grayscale' : ''} ${chosen ? 'ring-8 ring-yellow-300' : ''}
                            ${phase !== 'guess' && !chosen ? 'opacity-40' : ''} ${demo && c === est.correct ? DEMO_GLOW : ''}`}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: chosen ? 1.06 : 1, opacity: 1 }}
                transition={{ delay: i * 0.08, ease: BOUNCY, duration: 0.45 }}
                whileTap={out ? undefined : { scale: 0.88 }}
              >
                {fmt.format(c)}
              </motion.button>
            )
          })}
        </div>
        {note && (
          <motion.p
            key={note}
            className={`text-lg font-bold text-center px-4 py-2 rounded-2xl border-4 ${
              phase === 'guess' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
            }`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ease: BOUNCY }}
            data-testid="guess-note"
          >
            {note}
          </motion.p>
        )}
      </div>

      <div className="action-dock flex flex-col items-center gap-2 md:gap-3 md:w-[300px]">
        {phase === 'solve' && (
          <>
            <p className="prompt-pill dock-prompt text-center text-2xl font-bold">{t('solvePrompt', { a, b })}</p>
            <AnswerPad label={t('yourAnswer')} onSubmit={answer} />
          </>
        )}
      </div>
    </div>
  )
}
