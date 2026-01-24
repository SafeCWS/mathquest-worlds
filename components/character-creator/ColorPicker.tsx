'use client'

import { motion } from 'motion/react'

interface ColorPickerProps {
  colors: string[]
  selectedColor: string
  onSelect: (color: string) => void
  lockedColors?: string[]
  size?: 'small' | 'medium' | 'large'
}

export function ColorPicker({
  colors,
  selectedColor,
  onSelect,
  lockedColors = [],
  size = 'medium'
}: ColorPickerProps) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center p-4">
      {colors.map((color, index) => {
        const isLocked = lockedColors.includes(color)
        const isSelected = selectedColor === color
        const isRainbow = color === 'rainbow'

        return (
          <motion.button
            key={color}
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
              <div className="w-full h-full flex items-center justify-center bg-black/30 rounded-full">
                <span className="text-sm">🔒</span>
              </div>
            )}

            {/* Selected indicator */}
            {isSelected && !isLocked && (
              <motion.div
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
