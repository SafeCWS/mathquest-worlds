'use client'

import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, type ReactNode } from 'react'

// SlideOver — a kid-friendly, fully a11y-compliant slide-in panel.
//
// Phase 2.3 of purrfect-gliding-barto.md replaces the home-page navigation
// to /preferences and /parent with this in-place panel. No page transitions,
// no blank loading screens — Tina taps Settings and the panel slides in over
// the menu she already knows.
//
// Accessibility contract (WCAG 2.1 AA):
//   - role="dialog" + aria-modal="true" so screen readers announce it as a
//     blocking overlay.
//   - aria-labelledby points at a heading inside `children`. Caller must
//     render an element with id={titleId}.
//   - Escape key dismisses.
//   - Focus trap: Tab/Shift+Tab cycles within the panel. First focusable
//     element receives focus on open; original focus is restored on close.
//   - Backdrop click dismisses (unless `dismissOnBackdrop={false}`).
//   - Honors prefers-reduced-motion: snap-on, no slide animation.
//
// Composition: callers render whatever they want inside. The component owns
// only the chrome (backdrop, panel container, dismiss handlers, focus trap).

export type SlideOverProps = {
  open: boolean
  onClose: () => void
  /** id of the heading element inside `children` — used for aria-labelledby. */
  titleId: string
  /** Tap on backdrop dismisses. Default `true`. */
  dismissOnBackdrop?: boolean
  /** Width on tablet+ (Tailwind class). Default `'sm:max-w-md'`. */
  widthClass?: string
  children: ReactNode
}

export function SlideOver({
  open,
  onClose,
  titleId,
  dismissOnBackdrop = true,
  widthClass = 'sm:max-w-md',
  children,
}: SlideOverProps) {
  const reduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // Escape key dismisses the panel from anywhere in the document.
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Focus management: capture previous focus on open, focus first focusable
  // inside the panel, restore previous focus on close.
  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    // Defer one frame so the panel is mounted and animation has begun.
    const id = window.setTimeout(() => {
      const focusables = getFocusables(panelRef.current)
      if (focusables.length > 0) {
        focusables[0].focus()
      } else {
        // No focusable children — focus the panel itself so screen readers
        // announce the dialog. tabIndex=-1 on the container makes this work.
        panelRef.current?.focus()
      }
    }, 50)

    return () => {
      window.clearTimeout(id)
      // Restore focus when the panel closes. Guard against the previously
      // focused element having unmounted.
      if (previouslyFocused.current && document.contains(previouslyFocused.current)) {
        previouslyFocused.current.focus()
      }
    }
  }, [open])

  // Tab key trap — Tab from last cycles to first, Shift+Tab from first cycles
  // to last. Standard hand-rolled focus-trap pattern (we have no
  // focus-trap-react dep, per Phase 2 constraints).
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'Tab') return
      const focusables = getFocusables(panelRef.current)
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    },
    []
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — dimmed, blurred, dismisses on tap. */}
          <motion.div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismissOnBackdrop ? onClose : undefined}
          />
          {/* Panel — slides from right on motion-OK, snap-on with reduced motion. */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className={`fixed top-0 right-0 bottom-0 z-50 w-full ${widthClass}
                       bg-white shadow-2xl overflow-y-auto
                       focus:outline-none`}
            initial={reduceMotion ? { x: 0 } : { x: '100%' }}
            animate={{ x: 0 }}
            exit={reduceMotion ? { x: 0 } : { x: '100%' }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 300, damping: 32 }
            }
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Returns all keyboard-focusable elements inside `root`, in DOM order.
// Mirrors the WCAG focus-order requirement — same order Tab would visit.
function getFocusables(root: HTMLElement | null): HTMLElement[] {
  if (!root) return []
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')
  const nodes = root.querySelectorAll<HTMLElement>(selector)
  return Array.from(nodes).filter((el) => {
    // Skip elements that are visually hidden — they're not really focusable.
    return el.offsetParent !== null || el === document.activeElement
  })
}
