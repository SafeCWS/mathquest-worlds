'use client'

import { motion } from 'motion/react'

// Bouncy spring easing — consistent across all multiplication pages
const BOUNCY_EASE: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

export default function MultiplicationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: BOUNCY_EASE }}
    >
      {children}
    </motion.div>
  )
}
