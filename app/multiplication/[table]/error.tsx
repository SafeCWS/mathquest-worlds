'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'

// Next.js App Router error boundary. Renders when any render/server
// error bubbles up from within /multiplication/[table]/**. Kid-friendly
// copy only — no stack trace, no technical jargon. The `reset` prop is
// intentionally NOT exposed as a button because the "back to tables"
// path is the simpler recovery flow for a 7-year-old.
export default function TableError({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to the browser console so a parent can diagnose via DevTools
    // if the same page keeps erroring. Server logs will capture the
    // error digest server-side via Next.js's built-in reporter.
    // eslint-disable-next-line no-console
    console.error('[multiplication/[table] error boundary]', error)
  }, [error])

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4
                 bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300"
    >
      <motion.div
        className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl
                   border-4 border-white/50 max-w-md w-full text-center relative z-10"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          className="text-7xl mb-4"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🐉
        </motion.div>

        <motion.h1
          className="text-3xl md:text-4xl font-bold mb-3 text-purple-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Oops!
        </motion.h1>

        <motion.p
          className="text-lg text-gray-700 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Let&apos;s go back to the tables and try again 🌟
        </motion.p>

        <Link href="/multiplication">
          <motion.button
            className="w-full px-8 py-4 bg-gradient-to-r from-green-400 to-teal-500
                       text-white font-bold text-xl rounded-full shadow-xl
                       border-4 border-green-300"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            animate={{
              boxShadow: [
                '0 0 20px rgba(76, 175, 80, 0.4)',
                '0 0 40px rgba(76, 175, 80, 0.7)',
                '0 0 20px rgba(76, 175, 80, 0.4)',
              ],
            }}
            transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
          >
            <span className="block">🏠 Back to Tables</span>
          </motion.button>
        </Link>
      </motion.div>
    </main>
  )
}
