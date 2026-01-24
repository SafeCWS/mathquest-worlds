'use client'

import { motion } from 'motion/react'
import { useState, useEffect } from 'react'

interface AnimatedAnswerProps {
  answer: number | string
  isCorrect?: boolean
  isSelected?: boolean
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  worldColors?: {
    primary: string
    secondary: string
  }
  size?: 'small' | 'medium' | 'large'
}

export function AnimatedAnswer({
  answer,
  isCorrect,
  isSelected,
  onClick,
  disabled = false,
  worldColors,
  size = 'medium'
}: AnimatedAnswerProps) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])

  // Size classes
  const sizeClasses = {
    small: 'w-16 h-16 text-2xl',
    medium: 'w-20 h-20 text-3xl',
    large: 'w-24 h-24 text-4xl'
  }

  // Show feedback animation when answer is selected
  useEffect(() => {
    if (isSelected) {
      setShowFeedback(true)

      // Generate particles for correct answers
      if (isCorrect) {
        const newParticles = Array.from({ length: 12 }, (_, i) => ({
          id: i,
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100
        }))
        setParticles(newParticles)

        // Clear particles after animation
        setTimeout(() => setParticles([]), 1000)
      }

      // Reset feedback after animation
      setTimeout(() => setShowFeedback(false), 600)
    }
  }, [isSelected, isCorrect])

  return (
    <motion.button
      className={`
        ${sizeClasses[size]}
        rounded-2xl font-bold
        transform transition-all duration-200
        relative overflow-visible
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${isSelected && isCorrect ? 'bg-gradient-to-br from-green-400 to-green-600' : ''}
        ${isSelected && !isCorrect ? 'bg-gradient-to-br from-red-400 to-red-600' : ''}
        ${!isSelected ? 'bg-gradient-to-br from-white to-gray-100 hover:from-blue-50 hover:to-blue-100' : ''}
        ${!isSelected ? 'border-4 border-gray-300 hover:border-blue-400' : ''}
        ${!isSelected ? 'shadow-lg hover:shadow-xl' : ''}
      `}
      onClick={onClick}
      disabled={disabled || isSelected}
      whileHover={!disabled && !isSelected ? {
        scale: 1.1,
        rotate: [0, -3, 3, 0],
        transition: { duration: 0.3 }
      } : {}}
      whileTap={!disabled && !isSelected ? {
        scale: 0.95,
        transition: { duration: 0.1 }
      } : {}}
      animate={
        isSelected && isCorrect ? {
          scale: [1, 1.2, 1],
          rotate: [0, 360],
          transition: { duration: 0.6 }
        } : isSelected && !isCorrect ? {
          x: [0, -10, 10, -10, 10, 0],
          transition: { duration: 0.5 }
        } : {}
      }
      style={{
        boxShadow: isSelected && isCorrect
          ? '0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.4)'
          : undefined
      }}
    >
      {/* Answer text */}
      <motion.span
        className="relative z-10 text-gray-800"
        animate={
          isSelected && isCorrect ? {
            color: ['#1f2937', '#ffffff', '#ffffff'],
            transition: { duration: 0.3 }
          } : {}
        }
      >
        {answer}
      </motion.span>

      {/* Correct answer particles */}
      {isCorrect && showFeedback && particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute text-2xl pointer-events-none"
          style={{
            left: '50%',
            top: '50%'
          }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: particle.x,
            y: particle.y,
            scale: [0, 1, 0],
            opacity: [1, 1, 0]
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {['✨', '⭐', '🌟', '💫'][particle.id % 4]}
        </motion.div>
      ))}

      {/* Wrong answer shake effect overlay */}
      {isSelected && !isCorrect && showFeedback && (
        <motion.div
          className="absolute inset-0 bg-red-500 opacity-20 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Hover glow effect */}
      {!isSelected && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${worldColors?.primary || '#3b82f6'}20, transparent)`,
            opacity: 0
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Correct checkmark */}
      {isSelected && isCorrect && (
        <motion.div
          className="absolute -top-2 -right-2 text-2xl bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          ✓
        </motion.div>
      )}

      {/* Wrong X mark */}
      {isSelected && !isCorrect && (
        <motion.div
          className="absolute -top-2 -right-2 text-2xl bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          ✗
        </motion.div>
      )}
    </motion.button>
  )
}

// Animated number counter (for counting up/down effects)
interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedNumber({ value, duration = 500, className = '' }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [prevValue, setPrevValue] = useState(0)

  useEffect(() => {
    setPrevValue(displayValue)
    const startValue = displayValue
    const endValue = value
    const startTime = Date.now()

    const updateValue = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOut)

      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(updateValue)
      }
    }

    updateValue()
  }, [value, duration])

  return (
    <motion.span
      className={className}
      key={value} // Force re-render on value change
      initial={{ scale: 1.2, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayValue}
    </motion.span>
  )
}

// Animated problem card entrance
interface AnimatedProblemProps {
  children: React.ReactNode
  delay?: number
}

export function AnimatedProblem({ children, delay = 0 }: AnimatedProblemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8, rotateX: -90 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
        delay
      }}
    >
      {children}
    </motion.div>
  )
}
