'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { isVoiceOn } from './speech'

// Word highlight during read-aloud (plan: "word highlight during read-aloud on prompts").
// lib/sounds/speechUtils.speak() is used unchanged and exposes no boundary events, so the
// highlight walks the words at the voice's pace (rate 0.95 ≈ 2.4 words/s). Voice off → no
// reading, so no highlight either. Words never change size, so nothing on the page moves.

const MS_PER_WORD = 420

export function useReadAlong(narrate: (t: string) => void) {
  const [word, setWord] = useState(-1)
  const timer = useRef<number | null>(null)
  const stop = useCallback(() => {
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
    setWord(-1)
  }, [])
  const read = useCallback(
    (shown: string, spoken?: string) => {
      narrate(spoken ?? shown)
      stop()
      if (!isVoiceOn()) return
      const n = shown.split(/\s+/).filter(Boolean).length
      let i = 0
      setWord(0)
      timer.current = window.setInterval(() => {
        i += 1
        if (i >= n) stop()
        else setWord(i)
      }, MS_PER_WORD)
    },
    [narrate, stop],
  )
  useEffect(() => stop, [stop])
  return { word, read, stop }
}

/** Renders `text` word by word; the word being read wears a yellow marker. */
export function ReadAlongText({ text, word, className }: { text: string; word: number; className?: string }) {
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <span className={className} data-testid="read-along" data-word={word}>
      {words.map((w, i) => (
        <span key={i}>
          <span className={`rounded-md transition-colors ${i === word ? 'bg-yellow-200' : ''}`} data-reading={i === word ? '1' : undefined}>
            {w}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  )
}
