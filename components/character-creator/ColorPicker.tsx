'use client'

import { motion } from 'motion/react'

interface ColorPickerProps {
  colors: string[]
  selectedColor: string
  onSelect: (color: string) => void
  lockedColors?: string[]
  /**
   * Phase 3.2 — `small` (32px) was removed because it failed the kids' touch
   * standard (Apple HIG / WCAG 2.5.5: 44px floor; we hold ourselves to 60px).
   * `medium` is now 64px and `large` is 80px so a 4-year-old can land a finger
   * cleanly. If a caller needs a denser layout, use `medium` and rely on the
   * 12px gap-3 from the surrounding flex/grid.
   */
  size?: 'medium' | 'large'
  groupLabel?: string
}

export function ColorPicker({
  colors,
  selectedColor,
  onSelect,
  lockedColors = [],
  size = 'medium',
  groupLabel = 'Choose a color',
}: ColorPickerProps) {
  const sizeClasses = {
    medium: 'w-16 h-16',
    large: 'w-20 h-20'
  }

  return (
    <div
      role="radiogroup"
      aria-label={groupLabel}
      className="flex flex-wrap gap-3 justify-center p-4"
    >
      {colors.map((color, index) => {
        const isLocked = lockedColors.includes(color)
        const isSelected = selectedColor === color
        const isRainbow = color === 'rainbow'
        const colorLabel = isRainbow ? 'Rainbow' : color

        return (
          <motion.button
            key={color}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={isLocked ? `Locked color: ${colorLabel}` : `Color ${colorLabel}`}
            aria-disabled={isLocked}
            disabled={isLocked}
            className={`
              ${sizeClasses[size]} rounded-full
              transition-all duration-200
              ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isSelected ? 'ring-4 ring-yellow-400 ring-offset-2 scale-110' : 'hover:scale-105'}
            `}
            style={{
              background: isRainbow
                ? 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)'
                : color,
              boxShadow: isSelected ? '0 0 15px rgba(255, 215, 0, 0.5)' : undefined
            }}
            onClick={() => !isLocked && onSelect(color)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: isSelected ? 1.1 : 1 }}
            transition={{ delay: index * 0.02 }}
            whileHover={!isLocked ? { scale: 1.15 } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
          >
            {/* Lock overlay */}
            {isLocked && (
              <div aria-hidden="true" className="w-full h-full flex items-center justify-center bg-black/30 rounded-full">
                <span className="text-sm">🔒</span>
              </div>
            )}

            {/* Selected indicator */}
            {isSelected && !isLocked && (
              <motion.div
                aria-hidden="true"
                className="w-full h-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <span className="text-white text-lg drop-shadow-lg">✓</span>
              </motion.div>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
