'use client'

import { Suspense, useCallback, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { KidButton } from '@/components/ui/KidButton'
import { safeCallbackUrl } from '@/lib/navigation/safeCallbackUrl'

// Email one-time-code sign-in (approved G1.5 prototype, 2026-10-22). English only — the
// route layout wraps this page in <EnglishOnly>, so there is no EN/ES toggle here.
//   Step 1: POST /api/otp/request {email} → always 200 {ok, message, resendAfterSec}
//           (identical for every email, so the screen never reveals who is on the list).
//   Step 2: signIn('credentials', {email, code}) → any rejected code returns result.code 'invalid'.

const RESEND_SECONDS = 60
const DIGITS = 6

type Step = 'email' | 'code'
type Notice = { tone: 'info' | 'warn'; text: string } | null

async function requestOtp(email: string): Promise<{ resendAfterSec: number } | null> {
  try {
    const res = await fetch('/api/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) return null
    const json: unknown = await res.json()
    if (!json || typeof json !== 'object') return null
    const wait = (json as { resendAfterSec?: unknown }).resendAfterSec
    return { resendAfterSec: typeof wait === 'number' && wait > 0 ? wait : RESEND_SECONDS }
  } catch {
    return null
  }
}

function LoginCard() {
  const t = useTranslations('login')
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [digits, setDigits] = useState<string[]>(Array(DIGITS).fill(''))
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [shakeKey, setShakeKey] = useState(0)
  const [done, setDone] = useState(false)
  const boxes = useRef<Array<HTMLInputElement | null>>([])
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [secondsLeft])

  const requestCode = useCallback(async () => {
    if (!email.trim()) return
    setBusy(true)
    setNotice(null)
    const res = await requestOtp(email.trim())
    setBusy(false)
    if (!res) {
      setNotice({ tone: 'warn', text: t('errorSendFailed') })
      return
    }
    setSecondsLeft(res.resendAfterSec)
    setDigits(Array(DIGITS).fill(''))
    setStep('code')
    setNotice({ tone: 'info', text: t('codeSentGeneric') })
    window.setTimeout(() => boxes.current[0]?.focus(), 50)
  }, [email, t])

  const verify = useCallback(
    async (code: string) => {
      if (!/^\d{6}$/.test(code)) {
        setNotice({ tone: 'warn', text: t('errorIncomplete') })
        return
      }
      setBusy(true)
      let result: Awaited<ReturnType<typeof signIn>> | undefined
      try {
        result = await signIn('credentials', { email: email.trim(), code, redirect: false })
      } catch {
        result = undefined
      }
      setBusy(false)
      if (result && !result.error) {
        setDone(true)
        setNotice({ tone: 'info', text: t('signedIn') })
        // Absolute same-origin URL or '/' — never off-site (lib/navigation/safeCallbackUrl).
        const target = safeCallbackUrl(searchParams.get('callbackUrl'), window.location.origin)
        // Same 900 ms beat as the approved prototype, so the confirmation is readable.
        window.setTimeout(() => {
          window.location.href = target
        }, 900)
        return
      }
      // One message for every rejected code (operator ruling 2026-10-22): the screen never
      // says why, so it cannot reveal tries left, expiry, or who is on the list.
      const text = result?.code === 'invalid' ? t('errorInvalid') : t('errorVerifyFailed')
      setNotice({ tone: 'warn', text })
      setShakeKey((k) => k + 1)
      setDigits(Array(DIGITS).fill(''))
      window.setTimeout(() => boxes.current[0]?.focus(), 50)
    },
    [email, searchParams, t],
  )

  // Write a run of digits starting at `from`; used by typing, paste and iOS autofill.
  const fill = (from: number, raw: string) => {
    const incoming = raw.replace(/\D/g, '').slice(0, DIGITS - from)
    if (!incoming) return
    const next = [...digits]
    for (let i = 0; i < incoming.length; i++) next[from + i] = incoming[i]
    setDigits(next)
    const nextIndex = Math.min(from + incoming.length, DIGITS - 1)
    boxes.current[nextIndex]?.focus()
    const joined = next.join('')
    if (joined.length === DIGITS && !next.includes('')) void verify(joined)
  }

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits]
      next[i - 1] = ''
      setDigits(next)
      boxes.current[i - 1]?.focus()
      e.preventDefault()
    }
  }

  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    fill(i, e.clipboardData.getData('text'))
  }

  const useDifferentEmail = () => {
    setStep('email')
    setDigits(Array(DIGITS).fill(''))
    setNotice(null)
    setSecondsLeft(0)
  }

  return (
    <motion.div
      className="bg-white/90 backdrop-blur-md rounded-3xl p-4 sm:p-8 shadow-2xl
                 border-4 border-white/50 max-w-md w-full text-center relative z-10"
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      data-step={step}
    >
      <motion.h1
        className="text-4xl md:text-5xl font-bold mb-3"
        style={{
          background:
            'linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #9B59B6, #FF6B6B)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          // Same rainbow, plus a thin dark outline so every stop reads on the white card.
          WebkitTextStroke: '1.5px var(--space-primary)',
        }}
        // MotionConfig only stills transforms/opacity — background-position needs its own gate.
        animate={reduceMotion ? undefined : { backgroundPosition: ['0% center', '200% center'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        MathQuest Worlds
      </motion.h1>

      <p className="text-xl text-gray-600 mb-5">{t('tagline')}</p>

      {notice && (
        <motion.div
          key={notice.text}
          className={
            notice.tone === 'warn'
              ? 'mb-5 px-4 py-3 bg-gradient-to-r from-amber-100 to-orange-100 border-4 border-amber-300 rounded-2xl text-amber-800 font-bold text-base'
              : 'mb-5 px-4 py-3 bg-gradient-to-r from-sky-100 to-indigo-100 border-4 border-indigo-200 rounded-2xl text-indigo-800 font-semibold text-base'
          }
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          role={notice.tone === 'warn' ? 'alert' : 'status'}
          data-testid="login-notice"
          data-tone={notice.tone}
        >
          {notice.text}
        </motion.div>
      )}

      {step === 'email' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void requestCode()
          }}
          className="space-y-4 text-left"
        >
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">{t('emailLabel')}</span>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-indigo-200
                         focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                         bg-white/70 text-gray-800 text-lg outline-none transition min-h-[56px]"
              placeholder={t('emailPlaceholder')}
            />
          </label>
          <KidButton
            aria-label={t('sendCode')}
            onClick={() => void requestCode()}
            disabled={busy || !email.trim()}
            className="w-full border-yellow-300 text-xl flex items-center justify-center gap-3"
          >
            <span className="text-2xl">✉️</span>
            <span>{busy ? t('sending') : t('sendCode')}</span>
          </KidButton>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-lg font-bold text-gray-700">{t('codeTitle')}</p>
            <p className="text-sm text-gray-500 break-all">{t('codeCheck', { email })}</p>
          </div>
          <motion.div
            key={shakeKey}
            className="flex justify-center gap-1.5 sm:gap-2"
            animate={shakeKey ? { x: [0, -10, 10, -6, 6, 0] } : {}}
            transition={{ duration: 0.45 }}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  boxes.current[i] = el
                }}
                value={d}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                aria-label={t('digitAria', { n: i + 1 })}
                disabled={busy || done}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') {
                    const next = [...digits]
                    next[i] = ''
                    setDigits(next)
                    return
                  }
                  // iOS one-time-code autofill drops all six digits into one box.
                  fill(i, d && v.length > 1 && v.startsWith(d) ? v.slice(1) : v)
                }}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={(e) => onPaste(i, e)}
                onFocus={(e) => e.target.select()}
                className="w-[48px] h-16 sm:w-14 sm:h-[72px] rounded-2xl border-4 border-indigo-200
                           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                           bg-white text-center text-3xl font-bold text-indigo-700 outline-none transition"
              />
            ))}
          </motion.div>

          <KidButton
            aria-label={t('verify')}
            onClick={() => void verify(digits.join(''))}
            disabled={busy || done}
            sound="chime"
            className="w-full border-yellow-300 text-xl flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🔐</span>
            <span>{busy ? t('verifying') : t('verify')}</span>
          </KidButton>

          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => void requestCode()}
              disabled={secondsLeft > 0 || busy}
              className="min-h-[48px] px-4 font-bold text-indigo-600 disabled:text-gray-400 underline-offset-4 hover:underline"
            >
              {secondsLeft > 0 ? t('resendIn', { seconds: secondsLeft }) : t('resend')}
            </button>
            <button
              type="button"
              onClick={useDifferentEmail}
              className="min-h-[48px] px-4 text-gray-600 underline underline-offset-4"
            >
              {t('differentEmail')}
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-sm text-gray-500">{t('familyOnly')}</p>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4
                     bg-gradient-to-b from-sky-400 via-indigo-300 to-purple-300">
      {/* English only (operator ruling 2026-10-22): no EN/ES toggle here. */}
      <motion.div
        className="absolute top-10 left-0 right-0 flex justify-center gap-8 text-5xl pointer-events-none z-0"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {['🐉', '⭐', '🌟', '✨', '🦋'].map((emoji, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -15, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </motion.div>

      <Suspense
        fallback={
          <div className="bg-white/90 rounded-3xl p-8 shadow-2xl">
            <motion.div
              className="text-5xl text-center"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🌟
            </motion.div>
          </div>
        }
      >
        <LoginCard />
      </Suspense>
    </main>
  )
}
