'use client'

import { motion } from 'motion/react'

export const TABLE_EMOJIS: Record<number, string> = {
  1: '⭐', 2: '🐄', 3: '🐱', 4: '🦋', 5: '🍎',
  6: '🎈', 7: '🐬', 8: '🚀', 9: '💎', 10: '🌻',
}

interface VisualMultiplicationProps {
  a: number
  b: number
  show: {
    groups: boolean
    additionBridge: boolean
    answer: boolean
  }
  size?: 'compact' | 'full'
  animateIn?: boolean
}

export default function VisualMultiplication({
  a,
  b,
  show,
  size = 'full',
  animateIn = true,
}: VisualMultiplicationProps) {
  const product = a * b
  const emoji = TABLE_EMOJIS[a] || TABLE_EMOJIS[b] || '⭐'
  const isCompact = size === 'compact'
  const emojiSize = isCompact ? 'text-sm' : 'text-xl'
  const textSize = isCompact ? 'text-sm' : 'text-lg'
  const gapSize = isCompact ? 'gap-1' : 'gap-2'
  const tooMany = a * b > 30

  return (
    <div className={`flex flex-col ${gapSize} items-center w-full`}>
      {/* Layer 1: Emoji Groups */}
      {show.groups && (
        <div className={`flex flex-col ${isCompact ? 'gap-0.5' : 'gap-1.5'} items-center w-full`}>
          {tooMany ? (
            <motion.div
              className="bg-white/20 rounded-xl px-3 py-2 text-center"
              initial={animateIn ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className={`${textSize} text-white font-medium`}>
                {a} groups of {b} {emoji}
              </span>
              <div className="flex justify-center gap-0.5 mt-1">
                {Array.from({ length: Math.min(b, 10) }, (_, i) => (
                  <span key={i} className={emojiSize}>{emoji}</span>
                ))}
                {b > 10 && <span className="text-white/60 text-xs">...</span>}
              </div>
            </motion.div>
          ) : (
            Array.from({ length: a }, (_, rowIndex) => (
              <motion.div
                key={rowIndex}
                className={`bg-white/20 rounded-xl ${isCompact ? 'px-2 py-0.5' : 'px-3 py-1'} flex items-center gap-1`}
                initial={animateIn ? { opacity: 0, x: -20 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: animateIn ? rowIndex * 0.2 : 0 }}
              >
                <span className="text-white/50 text-xs font-mono min-w-[16px]">
                  {rowIndex + 1}.
                </span>
                <div className="flex gap-0.5 flex-wrap">
                  {Array.from({ length: b }, (_, emojiIndex) => (
                    <span key={emojiIndex} className={emojiSize}>{emoji}</span>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Layer 2: Addition Bridge */}
      {show.additionBridge && (
        <motion.div
          className={`${textSize} text-center py-1`}
          initial={animateIn ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animateIn && show.groups ? a * 0.2 + 0.2 : 0.2 }}
        >
          {Array.from({ length: a }, (_, i) => (
            <span key={i}>
              <span className="text-white font-bold">{b}</span>
              {i < a - 1 && <span className="text-white/60"> + </span>}
            </span>
          ))}
          <span className="text-white/60"> = </span>
          <span className="text-white font-bold text-amber-200">{product}</span>
        </motion.div>
      )}

      {/* Layer 3: Answer Reveal */}
      {show.answer && (
        <motion.div
          className={`${isCompact ? 'text-base' : 'text-xl'} font-extrabold text-center
                       bg-amber-400/30 rounded-xl ${isCompact ? 'px-3 py-1' : 'px-4 py-2'}`}
          initial={animateIn ? { opacity: 0, scale: 0.8 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={animateIn ? { type: 'spring', stiffness: 300, damping: 15 } : {}}
        >
          <span className="text-white">
            So {a} x {b} = <span className="text-amber-200">{product}</span> ✨
          </span>
        </motion.div>
      )}
    </div>
  )
}
