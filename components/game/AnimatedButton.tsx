'use client'

import { motion } from 'motion/react'
import { useState } from 'react'
import { sounds } from '@/lib/sounds/webAudioSounds'

interface AnimatedButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  emoji?: string
  withSound?: boolean
  className?: string
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  emoji,
  withSound = true,
  className = ''
}: AnimatedButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  // Variant styles
  const variantStyles = {
    primary: 'bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700',
    secondary: 'bg-gradient-to-b from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700',
    success: 'bg-gradient-to-b from-green-400 to-green-600 hover:from-green-500 hover:to-green-700',
    warning: 'bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700',
    danger: 'bg-gradient-to-b from-red-400 to-red-600 hover:from-red-500 hover:to-red-700'
  }

  // Border colors
  const borderColors = {
    primary: 'border-blue-300',
    secondary: 'border-gray-300',
    success: 'border-green-300',
    warning: 'border-yellow-300',
    danger: 'border-red-300'
  }

  // Size styles
  const sizeStyles = {
    small: 'px-4 py-2 text-base',
    medium: 'px-6 py-3 text-lg',
    large: 'px-8 py-4 text-xl'
  }

  const handleClick = () => {
    if (disabled) return

    if (withSound) {
      sounds.playClick()
    }

    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 150)

    onClick?.()
  }

  return (
    <motion.button
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${borderColors[variant]}
        text-white font-bold rounded-full shadow-lg
        border-4 relative overflow-hidden
        transform transition-all duration-150
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled}
      whileHover={!disabled ? {
        scale: 1.05,
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      animate={isPressed ? {
        scale: [1, 0.95, 1],
        transition: { duration: 0.15 }
      } : {}}
    >
      {/* Shimmer effect on hover */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
          whileHover={{ opacity: [0, 0.3, 0], x: ['-100%', '100%'] }}
          transition={{ duration: 0.8 }}
        />
      )}

      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {emoji && (
          <motion.span
            className="text-2xl"
            animate={{
              rotate: [0, -10, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1
            }}
          >
            {emoji}
          </motion.span>
        )}
        {children}
      </span>

      {/* Pulse ring on press */}
      {isPressed && (
        <motion.div
          className="absolute inset-0 border-4 border-white rounded-full"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  )
}

// Special world-themed button
interface WorldButtonProps {
  children: React.ReactNode
  onClick?: () => void
  worldColors: {
    primary: string
    secondary: string
  }
  emoji?: string
  disabled?: boolean
}

export function WorldButton({
  children,
  onClick,
  worldColors,
  emoji,
  disabled = false
}: WorldButtonProps) {
  return (
    <motion.button
      className="px-8 py-4 text-xl font-bold rounded-full shadow-lg
                 border-4 border-white/50 text-white relative overflow-hidden
                 transform transition-all duration-150"
      style={{
        background: `linear-gradient(135deg, ${worldColors.primary}, ${worldColors.secondary})`
      }}
      onClick={() => {
        sounds.playClick()
        onClick?.()
      }}
      disabled={disabled}
      whileHover={{ scale: 1.08, rotate: [0, -2, 2, 0] }}
      whileTap={{ scale: 0.92 }}
    >
      {/* Animated emoji */}
      {emoji && (
        <motion.span
          className="inline-block mr-2 text-3xl"
          animate={{
            y: [0, -5, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {emoji}
        </motion.span>
      )}

      {children}

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at center, ${worldColors.primary}40, transparent)`
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </motion.button>
  )
}

// Icon button (smaller, for settings, etc.)
interface IconButtonProps {
  icon: string
  onClick?: () => void
  size?: number
  disabled?: boolean
}

export function IconButton({
  icon,
  onClick,
  size = 48,
  disabled = false
}: IconButtonProps) {
  return (
    <motion.button
      className="bg-white/90 rounded-full shadow-lg flex items-center justify-center
                 border-2 border-gray-200"
      style={{ width: size, height: size }}
      onClick={() => {
        sounds.playClick()
        onClick?.()
      }}
      disabled={disabled}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
    >
      <span className="text-2xl">{icon}</span>
    </motion.button>
  )
}
