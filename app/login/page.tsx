'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion } from 'motion/react'

function LoginCard() {
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const error = searchParams.get('error')
    if (!error) return
    if (error === 'CredentialsSignin') {
      setErrorMessage('Hmm, that email or password didn’t match 🐉')
    } else {
      setErrorMessage('Something went wrong. Please try again 🌟')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSubmitting(true)
    const callbackUrl = searchParams.get('callbackUrl') ?? '/'
    const result = await signIn('credentials', {
      email,
      password,
      callbackUrl,
      redirect: false,
    })
    if (result?.error) {
      setErrorMessage('Hmm, that email or password didn’t match 🐉')
      setSubmitting(false)
      return
    }
    if (result?.url) {
      window.location.href = result.url
    } else {
      window.location.href = '/'
    }
  }

  return (
    <motion.div
      className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl
                 border-4 border-white/50 max-w-md w-full text-center relative z-10"
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
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
        }}
        animate={{ backgroundPosition: ['0% center', '200% center'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        MathQuest Worlds
      </motion.h1>

      <motion.p
        className="text-xl text-gray-600 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        A Math Adventure! 🌟
      </motion.p>

      {errorMessage && (
        <motion.div
          className="mb-6 px-4 py-3 bg-gradient-to-r from-red-100 to-orange-100
                     border-4 border-red-200 rounded-2xl text-red-700 font-bold text-base"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-indigo-200
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                       bg-white/70 text-gray-800 text-lg outline-none transition"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-2xl border-2 border-indigo-200
                       focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                       bg-white/70 text-gray-800 text-lg outline-none transition"
            placeholder="••••••••"
          />
        </label>

        <motion.button
          type="submit"
          disabled={submitting}
          className="w-full px-8 py-4 mt-2 bg-gradient-to-r from-blue-400 to-indigo-500
                     text-white font-bold text-xl rounded-full shadow-xl
                     border-4 border-blue-300 flex items-center justify-center gap-3
                     disabled:opacity-70 disabled:cursor-not-allowed"
          whileHover={{ scale: submitting ? 1 : 1.03 }}
          whileTap={{ scale: submitting ? 1 : 0.97 }}
          animate={{
            boxShadow: [
              '0 0 20px rgba(59, 130, 246, 0.4)',
              '0 0 40px rgba(59, 130, 246, 0.7)',
              '0 0 20px rgba(59, 130, 246, 0.4)',
            ],
          }}
          transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
        >
          <span className="text-2xl">🔐</span>
          <span>{submitting ? 'Signing in…' : 'Sign in'}</span>
        </motion.button>
      </form>

      <motion.p
        className="mt-6 text-sm text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Family members only 💛
      </motion.p>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4
                     bg-gradient-to-b from-sky-400 via-indigo-300 to-purple-300">
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
