/**
 * Where the hint bubble goes (CHECK round 2, html-validator M1/M2 + hackerAI): pure geometry, no DOM.
 *
 * Everything is in PAGE coordinates (viewport y + scrollY), so the answer does not depend on where
 * the page happens to be scrolled while measuring. The bubble is `h` px tall and must:
 *   1. touch none of `avoid` (enabled buttons, "Show me again", glowing step cells, the picture the
 *      step is about — each already padded by the caller's clearance);
 *   2. sit fully inside the visible band: below the fixed Back / Voice / Hint row (`ceil`) and above
 *      the phone answer sheet or the screen bottom (`floor`), both in viewport px;
 *   3. leave the step's targets (`targets`) fully inside that same band.
 * Above the play area is allowed — the bubble then covers the title / dragon rows, never a target.
 */
export interface Span {
  top: number
  bottom: number
}

export interface PlaceInput {
  h: number
  /** Page y of the play area's top edge — the preferred spot (round-1 behaviour). */
  playTop: number
  scrollY: number
  /** In-flow content bottom (page px); the bubble itself also extends the page while it is open. */
  contentBottom: number
  viewportH: number
  ceil: number
  floor: number
  avoid: Span[]
  targets: Span | null
  /** false: only spots that work at the current scroll position. */
  allowScroll: boolean
}

export interface Placement {
  /** Page y of the bubble's top edge. */
  y: number
  /** Page scroll to apply (equal to input.scrollY when no scroll is needed). */
  scroll: number
}

export function placeBubble(o: PlaceInput): Placement | null {
  const { h, playTop, scrollY, avoid, targets } = o
  const band = o.floor - o.ceil
  const candidates = new Set<number>([playTop])
  for (const a of avoid) {
    candidates.add(a.bottom)
    candidates.add(a.top - h)
  }
  if (targets) {
    candidates.add(targets.bottom)
    candidates.add(targets.top - h)
  }
  // Preference among equally cheap spots: the play area's top, then sliding DOWN past targets
  // (round-1 order, keeps iPad where it was), then going UP over the header.
  const order = [...candidates].sort((a, b) => {
    const da = a >= playTop ? a - playTop : playTop - a + 1e6
    const db = b >= playTop ? b - playTop : playTop - b + 1e6
    return da - db
  })
  let best: (Placement & { cost: number }) | null = null
  for (const y of order) {
    if (avoid.some((a) => y < a.bottom && a.top < y + h)) continue
    const lo = Math.min(y, targets?.top ?? y)
    const hi = Math.max(y + h, targets?.bottom ?? y + h)
    if (hi - lo > band) continue
    const maxScroll = Math.max(0, Math.max(o.contentBottom, y + h) - o.viewportH)
    const sMin = Math.max(0, hi - o.floor)
    const sMax = Math.min(maxScroll, lo - o.ceil)
    if (sMin > sMax + 0.5) continue
    const scroll = Math.min(Math.max(scrollY, sMin), sMax)
    const cost = Math.abs(scroll - scrollY) < 1 ? 0 : Math.abs(scroll - scrollY)
    if (cost > 0 && !o.allowScroll) continue
    if (!best || cost < best.cost) best = { y, scroll: cost === 0 ? scrollY : scroll, cost }
    if (best.cost === 0) break
  }
  return best ? { y: best.y, scroll: best.scroll } : null
}

/** Nothing fits: the in-band spot (current scroll) that covers the least wins (round-1 fallback). */
export function leastCovered(o: PlaceInput): number {
  const { h, playTop, scrollY, avoid } = o
  const top = scrollY + o.ceil
  const bottom = scrollY + o.floor
  const covered = (y: number) => avoid.reduce((sum, a) => sum + Math.max(0, Math.min(y + h, a.bottom) - Math.max(y, a.top)), 0)
  const spots = [playTop, top, bottom - h, ...avoid.map((a) => a.bottom), ...avoid.map((a) => a.top - h)]
    .map((y) => Math.min(Math.max(y, top), Math.max(top, bottom - h)))
  return spots.reduce((b, y) => (covered(y) < covered(b) ? y : b), spots[0])
}
