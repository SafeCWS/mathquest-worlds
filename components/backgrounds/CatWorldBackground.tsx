'use client'

import { motion } from 'motion/react'
import { useDevicePerformance, getAnimationConfig } from '@/lib/utils/deviceDetection'

interface CatWorldBackgroundProps {
  children: React.ReactNode
}

export function CatWorldBackground({ children }: CatWorldBackgroundProps) {
  const performance = useDevicePerformance()
  const config = getAnimationConfig(performance)

  // Floating elements for the dreamy effect
  const floatingItems = ['🎀', '💗', '✨', '🌸', '💖', '⭐', '🎀', '💫']
  const catPaws = ['🐾', '🐾', '🐾', '🐾']

  return (
    <div className="min-h-screen relative overflow-hidden"
         style={{ background: 'linear-gradient(180deg, #FFF0F5 0%, #FFB6C1 50%, #FF69B4 100%)' }}>

      {/* Sparkle overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating sparkles and bows */}
        {config.enableParallax && floatingItems.slice(0, config.particleCount / 4).map((item, i) => (
          <motion.span
            key={`float-${i}`}
            className="absolute text-2xl md:text-4xl opacity-60"
            style={{
              left: `${(i * 13) % 100}%`,
              top: `${(i * 17) % 80}%`
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.5
            }}
          >
            {item}
          </motion.span>
        ))}

        {/* Cute cat faces peeking */}
        <motion.div
          className="absolute bottom-0 left-4 text-6xl md:text-8xl"
          animate={{ y: [20, 0, 20] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <span role="img" aria-label="happy cat">😺</span>
        </motion.div>

        <motion.div
          className="absolute bottom-0 right-4 text-6xl md:text-8xl"
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        >
          <span role="img" aria-label="cat">🐱</span>
        </motion.div>

        {/* Paw prints trail */}
        {config.enableParallax && catPaws.map((paw, i) => (
          <motion.span
            key={`paw-${i}`}
            className="absolute text-xl opacity-30"
            style={{
              left: `${20 + i * 20}%`,
              bottom: `${10 + i * 5}%`,
              transform: `rotate(${-30 + i * 15}deg)`
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ delay: i * 0.3 }}
          >
            {paw}
          </motion.span>
        ))}

        {/* Dreamy clouds */}
        <motion.div
          className="absolute top-10 left-10 text-6xl opacity-40"
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          <span role="img" aria-label="cloud">☁️</span>
        </motion.div>

        <motion.div
          className="absolute top-20 right-20 text-5xl opacity-30"
          animate={{ x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        >
          <span role="img" aria-label="cloud">☁️</span>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
