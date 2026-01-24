// Device detection and performance utilities for mobile/iPad optimization
import { useState, useEffect } from 'react'

export type DevicePerformance = 'low' | 'medium' | 'high'

export interface AnimationConfig {
  particleCount: number
  enableParallax: boolean
  transitionDuration: number
  enableBlur: boolean
  enableShadows: boolean
}

/**
 * Detect device performance tier based on hardware capabilities
 * Used to adjust animation complexity for smoother experience
 */
export function getDevicePerformance(): DevicePerformance {
  if (typeof window === 'undefined') return 'high'

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const isIPad =
    /iPad/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const cores = navigator.hardwareConcurrency || 2
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4

  // iPads generally have good performance
  if (isIPad && cores >= 4) return 'medium'

  // Low-end mobile devices
  if (isMobile && (cores <= 4 || memory <= 2)) return 'low'

  // Mid-range mobile or older iPads
  if (isMobile || cores <= 6) return 'medium'

  // Desktop or high-end devices
  return 'high'
}

/**
 * React hook for device performance detection
 * Returns performance tier after client-side detection
 */
export function useDevicePerformance(): DevicePerformance {
  const [performance, setPerformance] = useState<DevicePerformance>('high')

  useEffect(() => {
    setPerformance(getDevicePerformance())
  }, [])

  return performance
}

/**
 * Get animation configuration based on device performance
 * Reduces visual complexity on lower-end devices
 */
export function getAnimationConfig(performance: DevicePerformance): AnimationConfig {
  const configs: Record<DevicePerformance, AnimationConfig> = {
    low: {
      particleCount: 5,
      enableParallax: false,
      transitionDuration: 0.2,
      enableBlur: false,
      enableShadows: false
    },
    medium: {
      particleCount: 15,
      enableParallax: true,
      transitionDuration: 0.4,
      enableBlur: true,
      enableShadows: true
    },
    high: {
      particleCount: 30,
      enableParallax: true,
      transitionDuration: 0.6,
      enableBlur: true,
      enableShadows: true
    }
  }

  return configs[performance]
}

/**
 * React hook for animation configuration
 * Combines performance detection with config generation
 */
export function useAnimationConfig(): AnimationConfig {
  const performance = useDevicePerformance()
  const [config, setConfig] = useState<AnimationConfig>(getAnimationConfig('high'))

  useEffect(() => {
    setConfig(getAnimationConfig(performance))
  }, [performance])

  return config
}

/**
 * Detect if device supports touch events
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as unknown as { msMaxTouchPoints?: number }).msMaxTouchPoints! > 0
  )
}

/**
 * React hook for touch device detection
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(isTouchDevice())
  }, [])

  return isTouch
}

/**
 * Detect device type for responsive adjustments
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop'

  const width = window.innerWidth
  const userAgent = navigator.userAgent

  // iPad detection (including iPad Pro which reports as MacIntel)
  const isIPad =
    /iPad/i.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  if (isIPad) return 'tablet'

  // Android tablets typically have larger screens
  const isAndroidTablet = /Android/i.test(userAgent) && !/Mobile/i.test(userAgent)
  if (isAndroidTablet) return 'tablet'

  // Mobile phones
  if (/iPhone|Android.*Mobile/i.test(userAgent) || width < 768) return 'mobile'

  // Tablet-sized screens
  if (width >= 768 && width < 1024) return 'tablet'

  return 'desktop'
}

/**
 * React hook for device type detection
 */
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType())
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return deviceType
}

/**
 * Check if user prefers reduced motion (accessibility)
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * React hook for reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReduced
}
