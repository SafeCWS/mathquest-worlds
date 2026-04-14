'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useEmojiThemeStore } from '@/lib/stores/emojiThemeStore'
import {
  EMOJI_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  DEFAULT_EMOJIS,
} from '@/lib/constants/emojiOptions'

interface EmojiPickerProps {
  tableNumber: number
  isOpen: boolean
  onClose: () => void
}

export default function EmojiPicker({ tableNumber, isOpen, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('animals')
  const setTableEmoji = useEmojiThemeStore((s) => s.setTableEmoji)
  const resetTableEmoji = useEmojiThemeStore((s) => s.resetTableEmoji)
  const getTableEmoji = useEmojiThemeStore((s) => s.getTableEmoji)

  const currentEmoji = getTableEmoji(tableNumber)
  const defaultEmoji = DEFAULT_EMOJIS[tableNumber] ?? '⭐'
  const isCustom = currentEmoji !== defaultEmoji

  const handleSelect = (emoji: string) => {
    setTableEmoji(tableNumber, emoji)
    // Brief delay so the child sees the selection highlight, then close
    setTimeout(() => {
      onClose()
    }, 250)
  }

  const handleReset = () => {
    resetTableEmoji(tableNumber)
    setTimeout(() => {
      onClose()
    }, 250)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Picker panel */}
          <motion.div
            className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl
                       max-w-sm w-full max-h-[85vh] flex flex-col overflow-hidden
                       border-4 border-purple-200"
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 text-center flex-shrink-0">
              <motion.div
                className="text-4xl mb-1"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {currentEmoji}
              </motion.div>
              <h2 className="text-xl font-extrabold text-gray-800">
                Pick your emoji for Table {tableNumber}!
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Tap any emoji to use it in your games
              </p>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto flex-shrink-0 justify-center">
              {CATEGORY_ORDER.map((cat) => (
                <motion.button
                  key={cat}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap
                             min-h-[36px] transition-colors
                             ${activeCategory === cat
                               ? 'bg-purple-500 text-white shadow-md'
                               : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                             }`}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setActiveCategory(cat)}
                >
                  {CATEGORY_LABELS[cat]}
                </motion.button>
              ))}
            </div>

            {/* Emoji grid (scrollable) */}
            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
              <motion.div
                className="grid grid-cols-5 gap-2 justify-items-center"
                key={activeCategory}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
              >
                {EMOJI_CATEGORIES[activeCategory].map((emoji, idx) => {
                  const isSelected = emoji === currentEmoji
                  return (
                    <motion.button
                      key={`${activeCategory}-${idx}`}
                      className={`w-14 h-14 flex items-center justify-center rounded-2xl text-2xl
                                 transition-all
                                 ${isSelected
                                   ? 'bg-purple-100 ring-3 ring-purple-500 shadow-lg shadow-purple-200/60'
                                   : 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200'
                                 }`}
                      whileTap={{ scale: 0.85 }}
                      whileHover={{ scale: 1.1 }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: idx * 0.02,
                        type: 'spring',
                        stiffness: 400,
                        damping: 20,
                      }}
                      onClick={() => handleSelect(emoji)}
                    >
                      {emoji}
                      {isSelected && (
                        <motion.div
                          className="absolute -bottom-0.5 -right-0.5 bg-purple-500 text-white
                                     rounded-full w-5 h-5 flex items-center justify-center
                                     text-xs font-bold shadow-md"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          &#10003;
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
              </motion.div>
            </div>

            {/* Footer with reset + close */}
            <div className="px-4 py-3 flex gap-2 flex-shrink-0 border-t border-gray-100">
              {isCustom && (
                <motion.button
                  className="flex-1 py-2.5 rounded-full bg-amber-100 text-amber-700
                             font-bold text-sm min-h-[44px] hover:bg-amber-200
                             transition-colors"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  Reset to {defaultEmoji}
                </motion.button>
              )}
              <motion.button
                className="flex-1 py-2.5 rounded-full bg-gray-100 text-gray-600
                           font-bold text-sm min-h-[44px] hover:bg-gray-200
                           transition-colors"
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
