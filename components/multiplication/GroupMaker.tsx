'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import interact from 'interactjs'
import { getRandomFacts, MultiplicationFact } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { speak } from '@/lib/sounds/speechUtils'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import { useHintSystem, HintButton } from '@/lib/hooks/useHintSystem'
import VisualMultiplication, { useTableEmoji } from './VisualMultiplication'

interface GroupMakerProps {
  tableNumber: number
}

// Max 3 groups x 4 items for a child-friendly experience
function getPlayableFact(tableNumber: number): MultiplicationFact {
  const allFacts = getRandomFacts(tableNumber, 10)
  // a = groups (2-3), b = items per group (2-4)
  const playable = allFacts.filter(f => f.a >= 2 && f.a <= 3 && f.b >= 2 && f.b <= 4)
  if (playable.length === 0) {
    // Fallback: anything with product <= 12
    const fallback = allFacts.filter(f => f.product <= 12 && f.a >= 2 && f.b >= 2)
    if (fallback.length > 0) return fallback[Math.floor(Math.random() * fallback.length)]
    return allFacts[0]
  }
  return playable[Math.floor(Math.random() * playable.length)]
}

interface GameState {
  fact: MultiplicationFact
  groups: number[][]           // groups[i] = array of item IDs in group i
  bouncebacks: number
  shakeGroupIndex: number | null
}

function initGame(tableNumber: number): GameState {
  const fact = getPlayableFact(tableNumber)
  return {
    fact,
    groups: Array.from({ length: fact.a }, () => []),
    bouncebacks: 0,
    shakeGroupIndex: null,
  }
}

export default function GroupMaker({ tableNumber }: GroupMakerProps) {
  const [game, setGame] = useState<GameState>(() => initGame(tableNumber))
  const [gameComplete, setGameComplete] = useState(false)
  const [earnedStars, setEarnedStars] = useState(0)
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()
  const { hintLevel, showHint, resetHint, totalHintsUsed, visualProps, hintPenalty } =
    useHintSystem()

  const emoji = useTableEmoji(tableNumber)
  const { a: numGroups, b: itemsPerGroup, product: totalItems } = game.fact

  // Track items still in the bank
  const [bankItems, setBankItems] = useState<number[]>(() =>
    Array.from({ length: totalItems }, (_, i) => i)
  )

  // Track auto-hint triggered by first bounceback
  const [autoHintFired, setAutoHintFired] = useState(false)

  // Refs for interact.js callbacks
  const gameRef = useRef(game)
  const gameCompleteRef = useRef(gameComplete)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { gameRef.current = game }, [game])
  useEffect(() => { gameCompleteRef.current = gameComplete }, [gameComplete])

  // Auto-hint on first bounceback
  useEffect(() => {
    if (game.bouncebacks >= 1 && !autoHintFired && hintLevel === 0) {
      showHint()
      setAutoHintFired(true)
    }
  }, [game.bouncebacks, autoHintFired, hintLevel, showHint])

  // Speak the instruction on mount and when fact changes
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(`Make ${numGroups} groups of ${itemsPerGroup}`)
    }, 500)
    return () => clearTimeout(timer)
  }, [numGroups, itemsPerGroup])

  // Total placed items
  const totalPlaced = useMemo(() => {
    return game.groups.reduce((sum, g) => sum + g.length, 0)
  }, [game.groups])

  // Determine which groups are eligible for "Fill Group" (have >= 1 item but not full)
  const fillableGroups = useMemo(() => {
    const result: number[] = []
    game.groups.forEach((g, i) => {
      if (g.length >= 1 && g.length < itemsPerGroup) {
        result.push(i)
      }
    })
    return result
  }, [game.groups, itemsPerGroup])

  // Fill group handler -- auto-fills remaining slots with staggered animation
  const handleFillGroup = useCallback((groupIndex: number) => {
    if (gameComplete) return
    sounds.playSuccessChime()

    const currentGroup = game.groups[groupIndex]
    const remaining = itemsPerGroup - currentGroup.length

    for (let i = 0; i < remaining; i++) {
      setTimeout(() => {
        sounds.playCount()

        // Remove one bank item
        setBankItems(prev => {
          const newBank = [...prev]
          newBank.pop()
          return newBank
        })

        // Hide the corresponding draggable in DOM
        const bankEls = document.querySelectorAll('.group-draggable')
        const visibleEls = Array.from(bankEls).filter(el => (el as HTMLElement).style.display !== 'none')
        if (visibleEls.length > 0) {
          const el = visibleEls[visibleEls.length - 1] as HTMLElement
          el.style.display = 'none'
          el.setAttribute('data-dropped', 'true')
        }

        setGame(prev => {
          const newGroups = prev.groups.map((g, idx) =>
            idx === groupIndex ? [...g, 1000 + i + g.length] : g
          )

          // Check if group just became full
          const justFilled = newGroups[groupIndex].length === prev.fact.b
          if (justFilled && i === remaining - 1) {
            // last item in this fill
          }

          // Check if ALL groups are now full
          const allFull = newGroups.every(g => g.length === prev.fact.b)

          if (allFull) {
            const wrong = prev.bouncebacks
            const rawStars = wrong === 0 ? 3 : wrong <= 3 ? 2 : 1
            const stars = Math.max(Math.round(rawStars - hintPenalty), 1)
            setTimeout(() => {
              setEarnedStars(stars)
              setGameComplete(true)
              recordModeScore(tableNumber, 'groups', stars)
              setTimeout(() => {
                showCelebration({
                  type: 'level_complete',
                  title: 'Groups Complete!',
                  subtitle: `${stars} star${stars !== 1 ? 's' : ''} earned!`,
                  emoji: '\uD83E\uDDFA',
                  stars,
                })
              }, 400)
            }, 300)
          }

          return { ...prev, groups: newGroups }
        })
      }, i * 150)
    }
  }, [game.groups, itemsPerGroup, gameComplete, tableNumber, recordModeScore, showCelebration, hintPenalty])

  // Setup interact.js
  useEffect(() => {
    if (!containerRef.current) return

    const draggableInteract = interact('.group-draggable').draggable({
      inertia: true,
      autoScroll: true,
      listeners: {
        start(event) {
          const target = event.target as HTMLElement
          target.style.zIndex = '50'
          target.classList.add('opacity-80')
        },
        move(event) {
          const target = event.target as HTMLElement
          const x = (parseFloat(target.getAttribute('data-x') || '0')) + event.dx
          const y = (parseFloat(target.getAttribute('data-y') || '0')) + event.dy
          target.style.transform = `translate(${x}px, ${y}px)`
          target.setAttribute('data-x', String(x))
          target.setAttribute('data-y', String(y))
        },
        end(event) {
          const target = event.target as HTMLElement
          if (!target.getAttribute('data-dropped')) {
            target.style.transform = ''
            target.setAttribute('data-x', '0')
            target.setAttribute('data-y', '0')
          }
          target.style.zIndex = ''
          target.classList.remove('opacity-80')
        },
      },
    })

    const dropzoneInteract = interact('.group-dropzone').dropzone({
      accept: '.group-draggable',
      overlap: 0.3,
      ondragenter(event) {
        const zone = event.target as HTMLElement
        zone.classList.add('ring-4', 'ring-yellow-400', 'scale-105')
      },
      ondragleave(event) {
        const zone = event.target as HTMLElement
        zone.classList.remove('ring-4', 'ring-yellow-400', 'scale-105')
      },
      ondrop(event) {
        if (gameCompleteRef.current) return

        const zone = event.target as HTMLElement
        const dragged = event.relatedTarget as HTMLElement
        const groupIndex = parseInt(zone.getAttribute('data-group-index') || '-1', 10)
        const itemId = parseInt(dragged.getAttribute('data-item-id') || '-1', 10)

        zone.classList.remove('ring-4', 'ring-yellow-400', 'scale-105')

        const currentGame = gameRef.current
        const groupItems = currentGame.groups[groupIndex]

        // Check if group is already full
        if (groupItems && groupItems.length >= currentGame.fact.b) {
          // Bounce back with shake animation
          sounds.playGentleError()
          dragged.style.transform = ''
          dragged.setAttribute('data-x', '0')
          dragged.setAttribute('data-y', '0')
          dragged.removeAttribute('data-dropped')

          setGame(prev => ({
            ...prev,
            bouncebacks: prev.bouncebacks + 1,
            shakeGroupIndex: groupIndex,
          }))

          // Clear shake after animation
          setTimeout(() => {
            setGame(prev => ({ ...prev, shakeGroupIndex: null }))
          }, 600)
          return
        }

        // Valid drop -- add item to group
        sounds.playCount()
        dragged.setAttribute('data-dropped', 'true')
        dragged.style.display = 'none'

        setBankItems(prev => prev.filter(id => id !== itemId))
        setGame(prev => {
          const newGroups = prev.groups.map((g, i) =>
            i === groupIndex ? [...g, itemId] : g
          )

          // Check if the group just became full
          const justFilled = newGroups[groupIndex].length === prev.fact.b
          if (justFilled) {
            sounds.playSuccessChime()
          }

          // Check if ALL groups are now full
          const allFull = newGroups.every(g => g.length === prev.fact.b)

          if (allFull) {
            const wrong = prev.bouncebacks
            const stars = wrong === 0 ? 3 : wrong <= 3 ? 2 : 1
            setTimeout(() => {
              setEarnedStars(stars)
              setGameComplete(true)
              recordModeScore(tableNumber, 'groups', stars)
              setTimeout(() => {
                showCelebration({
                  type: 'level_complete',
                  title: 'Groups Complete!',
                  subtitle: `${stars} star${stars !== 1 ? 's' : ''} earned!`,
                  emoji: '\uD83E\uDDFA',
                  stars,
                })
              }, 400)
            }, 300)
          }

          return { ...prev, groups: newGroups }
        })
      },
    })

    return () => {
      draggableInteract.unset()
      dropzoneInteract.unset()
    }
  }, [tableNumber, recordModeScore, showCelebration, game.fact.a, game.fact.b])

  const handlePlayAgain = useCallback(() => {
    const newGame = initGame(tableNumber)
    setGame(newGame)
    setGameComplete(false)
    setEarnedStars(0)
    setAutoHintFired(false)
    resetHint()
    setBankItems(Array.from({ length: newGame.fact.product }, (_, i) => i))
    // Reset dragged elements
    document.querySelectorAll('.group-draggable').forEach(el => {
      const htmlEl = el as HTMLElement
      htmlEl.style.transform = ''
      htmlEl.style.display = ''
      htmlEl.setAttribute('data-x', '0')
      htmlEl.setAttribute('data-y', '0')
      htmlEl.removeAttribute('data-dropped')
    })
  }, [tableNumber, resetHint])

  // Compute cell size for items
  const itemSize = 56

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-300 via-rose-300 to-pink-400 p-4 pt-16 pb-8" ref={containerRef}>
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Back button - fixed top-left, always visible in any orientation */}
      <div className="fixed top-4 left-4 z-50">
        <Link href={`/multiplication/${tableNumber}`}>
          <motion.button
            className="px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 font-bold rounded-full
                       shadow-lg min-h-[48px] min-w-[48px] flex items-center justify-center gap-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {'\u2B05\uFE0F'} Back
          </motion.button>
        </Link>
      </div>

      {/* Header */}
      <motion.div
        className="text-center mb-3 pt-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">
          Make the Groups!
        </h1>
        <motion.p
          className="text-white/90 text-lg font-bold mt-1"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          {numGroups} groups of {itemsPerGroup}
        </motion.p>
        <button
          onClick={() => speak(`Make ${numGroups} groups of ${itemsPerGroup}`)}
          className="mt-1 text-sm opacity-60 hover:opacity-100 transition-opacity
                     bg-white/20 rounded-full px-3 py-1 min-w-[36px] min-h-[36px]
                     inline-flex items-center gap-1"
          aria-label="Read aloud"
        >
          <span role="img" aria-hidden="true">&#128266;</span>
          <span className="text-white font-semibold">{numGroups} x {itemsPerGroup}</span>
        </button>
      </motion.div>

      {/* Hint button -- always visible */}
      <div className="flex flex-col items-center gap-2 mb-3">
        <HintButton onTap={showHint} hintLevel={hintLevel} />
        <AnimatePresence>
          {hintLevel > 0 && (
            <motion.div
              className="max-w-xs w-full bg-white/15 backdrop-blur-sm rounded-2xl p-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <VisualMultiplication
                a={numGroups}
                b={itemsPerGroup}
                show={visualProps}
                size="compact"
                animateIn={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Group Zones */}
      <motion.div
        className="flex flex-wrap gap-3 justify-center max-w-2xl mx-auto mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {game.groups.map((groupItems, gIndex) => {
          const isFull = groupItems.length === itemsPerGroup
          const isShaking = game.shakeGroupIndex === gIndex
          const canFill = fillableGroups.includes(gIndex)

          return (
            <motion.div
              key={`group-${gIndex}`}
              className={`group-dropzone relative rounded-2xl p-3 min-w-[120px]
                         transition-all duration-300 border-3
                         ${isFull
                           ? 'bg-green-100/80 border-green-400 shadow-lg shadow-green-200/50'
                           : 'bg-white/20 border-dashed border-white/50'
                         }`}
              data-group-index={gIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={
                isShaking
                  ? { opacity: 1, y: 0, x: [0, -6, 6, -6, 0], borderColor: '#f59e0b' }
                  : { opacity: 1, y: 0, x: 0 }
              }
              transition={
                isShaking
                  ? { x: { duration: 0.4 }, default: { delay: 0.1 + gIndex * 0.05 } }
                  : { delay: 0.1 + gIndex * 0.05 }
              }
            >
              {/* Group label */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${isFull ? 'text-green-700' : 'text-white/70'}`}>
                  Group {gIndex + 1}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                                 ${isFull
                                   ? 'bg-green-400 text-green-900'
                                   : 'bg-white/30 text-white/80'
                                 }`}>
                  {groupItems.length}/{itemsPerGroup}
                </span>
              </div>

              {/* Items in group */}
              <div
                className="flex flex-wrap gap-1 justify-center min-h-[60px] items-center"
                style={{ minWidth: Math.min(itemsPerGroup, 3) * (itemSize * 0.6 + 4) }}
              >
                {groupItems.length === 0 && !isFull && (
                  <span className="text-2xl text-white/30">+</span>
                )}
                {groupItems.map((itemId, iIndex) => (
                  <motion.span
                    key={`group-item-${gIndex}-${itemId}`}
                    className="text-xl pointer-events-none"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, delay: iIndex * 0.03 }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </div>

              {/* Fill Group button */}
              {canFill && !gameComplete && (
                <motion.button
                  className="mt-2 w-full text-xs font-bold px-3 py-1.5 rounded-full
                             bg-amber-400/80 text-amber-900 shadow-md min-h-[32px]
                             flex items-center justify-center gap-1"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleFillGroup(gIndex)}
                >
                  Fill Group {'\u2728'}
                </motion.button>
              )}

              {/* Full checkmark */}
              {isFull && (
                <motion.div
                  className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full
                             w-7 h-7 flex items-center justify-center text-sm font-bold shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {'\u2713'}
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {/* Item Bank */}
      <motion.div
        className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 border-2 border-dashed border-white/40
                   max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-xs font-bold text-white/70 text-center mb-2">
          DRAG {emoji} INTO GROUPS
        </p>
        <div className="flex flex-wrap gap-1 justify-center min-h-[60px]">
          {Array.from({ length: totalItems }, (_, i) => (
            <motion.div
              key={`bank-${game.fact.a}-${game.fact.b}-${i}`}
              className="group-draggable cursor-grab active:cursor-grabbing
                         flex items-center justify-center rounded-xl
                         bg-white/80 shadow-md border-2 border-white/60
                         select-none"
              style={{
                width: itemSize,
                height: itemSize,
                touchAction: 'none',
              }}
              data-item-id={i}
              data-x="0"
              data-y="0"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.02, type: 'spring', stiffness: 300 }}
              whileHover={{ scale: 1.1 }}
            >
              <span className="text-xl pointer-events-none">{emoji}</span>
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-white/60 text-center mt-2">
          {bankItems.length} left
        </p>
      </motion.div>

      {/* Score indicator */}
      <motion.div
        className="text-center mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-white/70 text-sm">
          Placed: {totalPlaced} / {totalItems}
          {game.bouncebacks > 0 && ` | Bouncebacks: ${game.bouncebacks}`}
        </span>
      </motion.div>

      {/* Game complete - Play Again */}
      <AnimatePresence>
        {gameComplete && !celebration && (
          <motion.div
            className="fixed inset-x-0 bottom-20 flex justify-center z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-rose-600
                         text-white font-bold text-lg rounded-full shadow-xl
                         border-4 border-white/30 min-h-[48px]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayAgain}
            >
              Play Again!
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
