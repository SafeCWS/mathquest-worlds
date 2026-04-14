'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import interact from 'interactjs'
import { getRandomFacts, MultiplicationFact } from '@/lib/constants/multiplicationTables'
import { useMultiplicationStore } from '@/lib/stores/multiplicationStore'
import { sounds } from '@/lib/sounds/webAudioSounds'
import { speakEquation } from '@/lib/sounds/speechUtils'
import { CelebrationOverlay, useCelebration } from '@/components/game/CelebrationOverlay'
import { TABLE_EMOJIS } from './VisualMultiplication'

interface ArrayBuilderProps {
  tableNumber: number
}

// Keep grids reasonable for drag-and-drop (max 6 columns for mobile)
function getPlayableFact(tableNumber: number): MultiplicationFact {
  const allFacts = getRandomFacts(tableNumber, 10)
  // Filter to b between 2 and 6 for manageable grid sizes
  const playable = allFacts.filter(f => f.b >= 2 && f.b <= 6)
  if (playable.length === 0) return allFacts[0]
  return playable[Math.floor(Math.random() * playable.length)]
}

interface GameState {
  fact: MultiplicationFact
  filledCells: Set<number>    // indices of filled grid cells
  wrongDrops: number
  completedRows: number       // how many full rows completed
}

function initGame(tableNumber: number): GameState {
  return {
    fact: getPlayableFact(tableNumber),
    filledCells: new Set(),
    wrongDrops: 0,
    completedRows: 0,
  }
}

export default function ArrayBuilder({ tableNumber }: ArrayBuilderProps) {
  const [game, setGame] = useState<GameState>(() => initGame(tableNumber))
  const [gameComplete, setGameComplete] = useState(false)
  const [earnedStars, setEarnedStars] = useState(0)
  const recordModeScore = useMultiplicationStore(s => s.recordModeScore)
  const { celebration, showCelebration, dismissCelebration } = useCelebration()

  const emoji = TABLE_EMOJIS[tableNumber] || '⭐'
  const { a: rows, b: cols, product: totalItems } = game.fact

  // Track items still in the tray (not yet placed)
  const [trayItems, setTrayItems] = useState<number[]>(() =>
    Array.from({ length: totalItems }, (_, i) => i)
  )

  // Refs for interact.js state access (avoids stale closures)
  const gameRef = useRef(game)
  const trayItemsRef = useRef(trayItems)
  const gameCompleteRef = useRef(gameComplete)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { gameRef.current = game }, [game])
  useEffect(() => { trayItemsRef.current = trayItems }, [trayItems])
  useEffect(() => { gameCompleteRef.current = gameComplete }, [gameComplete])

  // Speak the equation on mount and when fact changes
  useEffect(() => {
    const timer = setTimeout(() => {
      speakEquation(game.fact.a, game.fact.b)
    }, 500)
    return () => clearTimeout(timer)
  }, [game.fact.a, game.fact.b])

  // Running addition text
  const runningAddition = useMemo(() => {
    const { filledCells } = game
    if (filledCells.size === 0) return ''

    const fullRowCount = Math.floor(filledCells.size / cols)
    if (fullRowCount === 0) return `${filledCells.size}/${cols}...`

    const parts: string[] = []
    let runningTotal = 0
    for (let r = 0; r < fullRowCount; r++) {
      runningTotal += cols
      parts.push(String(runningTotal))
    }

    const remainder = filledCells.size % cols
    if (remainder > 0) {
      return parts.join(' + ') + ` + ${remainder}...`
    }
    return parts.join(' + ') + ` = ${runningTotal}`
  }, [game.filledCells.size, cols, game])

  // Setup interact.js drag-and-drop
  useEffect(() => {
    if (!containerRef.current) return

    // Draggable items in the tray
    const draggableInteract = interact('.array-draggable').draggable({
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
          // If not dropped on a valid cell, snap back
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

    // Drop zones (grid cells)
    const dropzoneInteract = interact('.array-drop-cell').dropzone({
      accept: '.array-draggable',
      overlap: 0.3,
      ondragenter(event) {
        const cell = event.target as HTMLElement
        cell.classList.add('ring-4', 'ring-yellow-400', 'bg-yellow-100/50')
      },
      ondragleave(event) {
        const cell = event.target as HTMLElement
        cell.classList.remove('ring-4', 'ring-yellow-400', 'bg-yellow-100/50')
      },
      ondrop(event) {
        if (gameCompleteRef.current) return

        const cell = event.target as HTMLElement
        const dragged = event.relatedTarget as HTMLElement
        const cellIndex = parseInt(cell.getAttribute('data-cell-index') || '-1', 10)
        const itemId = parseInt(dragged.getAttribute('data-item-id') || '-1', 10)

        cell.classList.remove('ring-4', 'ring-yellow-400', 'bg-yellow-100/50')

        // Check if cell is already filled
        if (gameRef.current.filledCells.has(cellIndex)) {
          // Bounce back
          sounds.playGentleError()
          dragged.style.transform = ''
          dragged.setAttribute('data-x', '0')
          dragged.setAttribute('data-y', '0')
          dragged.removeAttribute('data-dropped')
          setGame(prev => ({ ...prev, wrongDrops: prev.wrongDrops + 1 }))
          return
        }

        // Valid drop -- place emoji in cell
        sounds.playCount()
        dragged.setAttribute('data-dropped', 'true')

        // Hide the dragged item and add to filled cells
        dragged.style.display = 'none'

        setTrayItems(prev => prev.filter(id => id !== itemId))
        setGame(prev => {
          const newFilled = new Set(prev.filledCells)
          newFilled.add(cellIndex)

          // Check row completion
          const currentRow = Math.floor(cellIndex / prev.fact.b)
          const rowStart = currentRow * prev.fact.b
          let rowComplete = true
          for (let c = 0; c < prev.fact.b; c++) {
            if (!newFilled.has(rowStart + c)) {
              rowComplete = false
              break
            }
          }

          if (rowComplete && prev.completedRows < currentRow + 1) {
            sounds.playSuccessChime()
          }

          const newCompletedRows = rowComplete
            ? Math.max(prev.completedRows, currentRow + 1)
            : prev.completedRows

          // Check game complete
          const isComplete = newFilled.size === prev.fact.product
          if (isComplete) {
            const wrong = prev.wrongDrops
            const stars = wrong === 0 ? 3 : wrong <= 3 ? 2 : 1
            setTimeout(() => {
              setEarnedStars(stars)
              setGameComplete(true)
              recordModeScore(tableNumber, 'array', stars)
              setTimeout(() => {
                showCelebration({
                  type: 'level_complete',
                  title: 'Array Complete!',
                  subtitle: `${stars} star${stars !== 1 ? 's' : ''} earned!`,
                  emoji: '🏗️',
                  stars,
                })
              }, 400)
            }, 300)
          }

          return {
            ...prev,
            filledCells: newFilled,
            completedRows: newCompletedRows,
          }
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
    setTrayItems(Array.from({ length: newGame.fact.product }, (_, i) => i))
    // Reset any lingering dragged elements
    document.querySelectorAll('.array-draggable').forEach(el => {
      const htmlEl = el as HTMLElement
      htmlEl.style.transform = ''
      htmlEl.style.display = ''
      htmlEl.setAttribute('data-x', '0')
      htmlEl.setAttribute('data-y', '0')
      htmlEl.removeAttribute('data-dropped')
    })
  }, [tableNumber])

  // Determine cell size based on grid dimensions
  const cellSize = cols <= 4 ? 56 : cols <= 6 ? 48 : 40

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-300 via-teal-300 to-cyan-400 p-4 pb-24" ref={containerRef}>
      <CelebrationOverlay celebration={celebration} onDismiss={dismissCelebration} />

      {/* Header */}
      <motion.div
        className="text-center mb-3 pt-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">
          Build the Array!
        </h1>
        <motion.p
          className="text-white/90 text-lg font-bold mt-1"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          {rows} x {cols} = ?
        </motion.p>
        <button
          onClick={() => speakEquation(rows, cols)}
          className="mt-1 text-sm opacity-60 hover:opacity-100 transition-opacity
                     bg-white/20 rounded-full px-3 py-1 min-w-[36px] min-h-[36px]
                     inline-flex items-center gap-1"
          aria-label="Read aloud"
        >
          <span role="img" aria-hidden="true">&#128266;</span>
          <span className="text-white font-semibold">{rows} x {cols}</span>
        </button>
      </motion.div>

      {/* Running addition display */}
      <AnimatePresence>
        {runningAddition && (
          <motion.div
            className="text-center mb-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-base font-bold text-white bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
              {runningAddition}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main area: grid + tray */}
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-center max-w-2xl mx-auto">
        {/* Item Tray (top on mobile, right on desktop) */}
        <div className="order-1 sm:order-2 w-full sm:w-auto">
          <motion.div
            className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 border-2 border-dashed border-white/40"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs font-bold text-white/70 text-center mb-2">
              DRAG {emoji} INTO THE GRID
            </p>
            <div className="flex flex-wrap gap-1 justify-center max-w-[240px] sm:max-w-[180px] mx-auto min-h-[60px]">
              {Array.from({ length: totalItems }, (_, i) => (
                <motion.div
                  key={`tray-${game.fact.a}-${game.fact.b}-${i}`}
                  className="array-draggable cursor-grab active:cursor-grabbing
                             flex items-center justify-center rounded-xl
                             bg-white/80 shadow-md border-2 border-white/60
                             select-none"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    touchAction: 'none',
                  }}
                  data-item-id={i}
                  data-x="0"
                  data-y="0"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.02, type: 'spring', stiffness: 300 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <span className="text-xl pointer-events-none">{emoji}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-white/60 text-center mt-2">
              {trayItems.length} left
            </p>
          </motion.div>
        </div>

        {/* Array Grid */}
        <div className="order-2 sm:order-1">
          <motion.div
            className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border-2 border-white/30"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs font-bold text-white/70 text-center mb-2">
              {rows} ROWS x {cols} COLUMNS
            </p>
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
              }}
            >
              {Array.from({ length: rows * cols }, (_, cellIndex) => {
                const isFilled = game.filledCells.has(cellIndex)
                const rowIndex = Math.floor(cellIndex / cols)

                // Check if entire row is complete
                let rowComplete = true
                for (let c = 0; c < cols; c++) {
                  if (!game.filledCells.has(rowIndex * cols + c)) {
                    rowComplete = false
                    break
                  }
                }

                return (
                  <motion.div
                    key={`cell-${cellIndex}`}
                    className={`array-drop-cell rounded-lg flex items-center justify-center
                               transition-all duration-200 border-2
                               ${isFilled
                                 ? rowComplete
                                   ? 'bg-green-200/80 border-green-400'
                                   : 'bg-amber-100/80 border-amber-300'
                                 : 'bg-white/30 border-dashed border-white/50'
                               }`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                    }}
                    data-cell-index={cellIndex}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + cellIndex * 0.01 }}
                  >
                    {isFilled ? (
                      <motion.span
                        className="text-xl pointer-events-none"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        {emoji}
                      </motion.span>
                    ) : (
                      <span className="text-lg text-white/30 pointer-events-none">+</span>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Row labels */}
            <div className="flex justify-between mt-2 px-1">
              {Array.from({ length: rows }, (_, r) => {
                let rowFilled = 0
                for (let c = 0; c < cols; c++) {
                  if (game.filledCells.has(r * cols + c)) rowFilled++
                }
                const isRowDone = rowFilled === cols
                return (
                  <span
                    key={`row-label-${r}`}
                    className={`text-xs font-bold px-1.5 py-0.5 rounded
                               ${isRowDone ? 'text-green-700 bg-green-200/60' : 'text-white/60'}`}
                  >
                    {isRowDone ? `R${r + 1} ✓` : `R${r + 1}: ${rowFilled}/${cols}`}
                  </span>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Score indicator */}
      <motion.div
        className="text-center mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-white/70 text-sm">
          Placed: {game.filledCells.size} / {totalItems}
          {game.wrongDrops > 0 && ` | Wrong drops: ${game.wrongDrops}`}
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
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600
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

      {/* Back button */}
      <motion.div
        className="fixed bottom-4 left-0 right-0 flex justify-center z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Link href={`/multiplication/${tableNumber}`}>
          <motion.button
            className="px-6 py-2 bg-white/30 backdrop-blur-md text-white
                       font-semibold rounded-full border border-white/40 min-h-[48px]"
            whileTap={{ scale: 0.95 }}
          >
            Back
          </motion.button>
        </Link>
      </motion.div>
    </div>
  )
}
