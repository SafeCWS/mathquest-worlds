'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion } from 'motion/react'

function LoginCard() {
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const error = searchParams.get('error')
    if (!error) return
    // NextAuth surfaces `AccessDenied` when our signIn() callback
    // returns false (wrong email or wrong Workspace domain).
    // Configuration / OAuthCallback / Verification errors map to a
    // generic "please try again" because a 7-year-old can't fix them.
    if (error === 'AccessDenied') {
      setErrorMessage('Sorry, this game is for family only 🐉')
    } else {
      setErrorMessage('Something went wrong. Please try again 🌟')
    }
  }, [searchParams])

  const handleSignIn = () => {
    // Full popup flow (not One Tap) — Safari on macOS silently blocks
    // `google.accounts.id.prompt()` without the COOP header set in
    // next.config.ts. The NextAuth signIn() helper opens a Google
    // OAuth popup that works reliably across browsers.
    void signIn('google', { callbackUrl: '/' })
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
          background: 'linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #9B59B6, #FF6B6B)',
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
        className="text-xl text-gray-600 mb-8"
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

      <motion.button
        onClick={handleSignIn}
        className="w-full px-8 py-4 bg-gradient-to-r from-blue-400 to-indigo-500
                   text-white font-bold text-xl rounded-full shadow-xl
                   border-4 border-blue-300 flex items-center justify-center gap-3"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
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
        <span>Sign in with Google</span>
      </motion.button>

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
      {/* Decorative floating emojis */}
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

      {/* Suspense boundary required for useSearchParams during static gen */}
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
