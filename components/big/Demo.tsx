'use client'

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { motion, useReducedMotion } from 'motion/react'

// First-time walkthrough (2026-10-22 round, item #2): the dragon does step 1 itself.
// A pulsing 👆 travels to the thing to tap, the target glows (the mode adds the glow),
// the step is read aloud, then the step completes on its own and the shell says "Your turn!".
// prefers-reduced-motion: no finger travel — it simply appears on the target and the glow stays.

export const DEMO_TIMING = { speak: 150, perform: 2300, done: 3400 } as const

/**
 * Runs one demo step. `perform` does exactly what the child's tap would do.
 * Timers are cleared if the demo is skipped (demo → false) or the mode unmounts.
 */
export function useDemoStep(demo: boolean, perform: () => void, speakText: string, narrate: (t: string) => void, onDone: () => void) {
  const performRef = useRef(perform)
  const doneRef = useRef(onDone)
  useEffect(() => {
    performRef.current = perform
    doneRef.current = onDone
  })
  useEffect(() => {
    if (!demo) return
    const ids = [
      window.setTimeout(() => narrate(speakText), DEMO_TIMING.speak),
      window.setTimeout(() => performRef.current(), DEMO_TIMING.perform),
      window.setTimeout(() => doneRef.current(), DEMO_TIMING.done),
    ]
    return () => ids.forEach((id) => window.clearTimeout(id))
    // speakText/narrate are read once at demo start on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo])
}

/** The pulsing finger. Fixed-positioned on the target's centre (viewport coordinates). */
export function DemoFinger({ target }: { target: RefObject<HTMLElement | null> }) {
  const reduce = useReducedMotion()
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  useLayoutEffect(() => {
    const place = () => {
      // display:contents wrappers (phone sheet) have no box — use the first descendant that does.
      let el: Element | null = target.current
      let r = el?.getBoundingClientRect()
      const queue: Element[] = el ? [...el.children] : []
      while (r && r.width === 0 && queue.length) {
        el = queue.shift() as Element
        r = el.getBoundingClientRect()
        if (r.width === 0) queue.push(...el.children)
      }
      if (r && r.width > 0) setPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    }
    place()
    const id = window.setInterval(place, 250) // follows layout shifts / scroll during the demo
    return () => window.clearInterval(id)
  }, [target])

  if (!pos) return null
  return (
    <motion.span
      aria-hidden="true"
      data-testid="demo-finger"
      className="fixed z-[45] pointer-events-none text-6xl drop-shadow-lg"
      style={{ left: 0, top: 0 }}
      initial={reduce ? { x: pos.x - 20, y: pos.y - 6 } : { x: window.innerWidth - 80, y: window.innerHeight - 80, opacity: 0 }}
      animate={
        reduce
          ? { x: pos.x - 20, y: pos.y - 6, opacity: 1 }
          : { x: pos.x - 20, y: [pos.y - 6, pos.y + 6, pos.y - 6], opacity: 1, scale: [1, 0.85, 1] }
      }
      transition={
        reduce
          ? { duration: 0 }
          : { x: { duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }, y: { duration: 0.9, repeat: Infinity, delay: 1.2 }, scale: { duration: 0.9, repeat: Infinity, delay: 1.2 }, opacity: { duration: 0.3 } }
      }
    >
      👆
    </motion.span>
  )
}

/** Glow ring the target wears during the demo. */
export const DEMO_GLOW = 'ring-8 ring-yellow-300 ring-offset-2 animate-pulse'

const KEY = (mode: string) => `mq-big-walkthrough-${mode}`
export function walkthroughSeen(mode: string): boolean {
  try {
    return window.localStorage.getItem(KEY(mode)) === '1'
  } catch {
    return true // storage blocked: never trap the child in a demo loop
  }
}
export function markWalkthroughSeen(mode: string): void {
  try {
    window.localStorage.setItem(KEY(mode), '1')
  } catch {
    /* ignore */
  }
}
export function resetWalkthrough(mode: string): void {
  try {
    window.localStorage.removeItem(KEY(mode))
  } catch {
    /* ignore */
  }
}
