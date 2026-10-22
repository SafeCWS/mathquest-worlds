/**
 * storyMissions — story bank + generator for "Story Missions" (Big Multiplication v2).
 *
 * Spec: ~/.claude/plans/mellow-roaming-hoare.md §"The four games" #3. Pure: no React, no DOM,
 * no audio, no Math.random at module scope — every random choice goes through the injected `rng`.
 * English only (prototype).
 *
 * A story is "b groups, a in each": 3 dragons each guard 42 gems → 3 × 42 = 126.
 * Rules the tests enforce for EVERY problem in every level's deck:
 *   - story text ≤ 15 words, contains "each", question contains "in all"
 *   - no money, no ages, no real human names (L192) — dragons and creatures only
 *   - L3 adds one distractor number (2–9, never a, b, or a digit of a)
 *   - plural nouns always (a ≥ 11 and b ≥ 2, so every count in the text is > 1)
 */

import { breakApartSteps, type Step, type StepHighlight } from './stepScripts'
import { levelOf, type BigProblem, type Rng } from './twoDigitProblems'

export type StoryTheme = 'gems' | 'eggs' | 'stickers' | 'cookies' | 'spacePets' | 'shells' | 'acorns'

export const STORY_THEMES: readonly StoryTheme[] = ['gems', 'eggs', 'stickers', 'cookies', 'spacePets', 'shells', 'acorns']

export type StoryHighlight = StepHighlight | 'storyGroups' | 'storyEach' | 'pickMath'

export type StoryStepKind = 'groups' | 'each' | 'pickMath' | 'split' | 'tensPart' | 'onesPart' | 'add' | 'answer'

export interface StoryStep extends Omit<Step, 'highlight'> {
  kind: StoryStepKind
  highlight: StoryHighlight
  /** pickMath only: the two cards, e.g. ['3 × 42', '3 + 42']. The UI may shuffle them. */
  choices?: [string, string]
}

export interface Story {
  problem: BigProblem
  theme: StoryTheme
  /** Shown on the story card. ≤ 15 words. */
  text: string
  /** For speech synthesis (no symbols in story text, so equal to `text`). */
  speak: string
  /** The question sentence alone, e.g. "How many gems in all?" (always contains "in all"). */
  question: string
  /** b — how many groups. */
  groups: number
  /** a — how many in each group. */
  each: number
  /** Plural noun of the things counted: "gems", "space pets". */
  unit: string
  /** Plural noun of the groups: "dragons", "nests". */
  groupNoun: string
  /** Singular noun of the groups: "dragon", "nest" (for "in each nest"). */
  groupNounOne: string
  answer: number
  /** L3 only: one extra number in the story that is not part of the math. */
  distractor?: number
  /** Every number in the story text, in reading order — the tap targets for the slots. */
  numbers: number[]
  steps: StoryStep[]
}

// ───────────────────────────────────────────── story bank

interface Template {
  group: string
  groupOne: string
  /** Main sentence without the unit: "3 dragons each guard 42". Contains the word "each". */
  sentence: (g: number, e: number) => string
  /** Prompt for the "in each" slot. */
  eachPrompt: string
}

interface ThemeBank {
  unit: string
  templates: readonly Template[]
  /** Short side sentences carrying the distractor number (no "each", no unit). */
  distractors: readonly ((d: number) => string)[]
}

const T = (group: string, groupOne: string, verb: string, eachPrompt: string, adj = ''): Template => ({
  group,
  groupOne,
  eachPrompt,
  sentence: (g, e) => `${g} ${adj ? `${adj} ` : ''}${group} each ${verb} ${e}`,
})

// Main sentences ≤ 7 words, side sentences 3 words, question ≤ 6 → always ≤ 15 with a distractor.
const BANK: Record<StoryTheme, ThemeBank> = {
  gems: {
    unit: 'gems',
    templates: [
      T('dragons', 'dragon', 'guard', 'How many gems does each dragon guard?'),
      T('dragons', 'dragon', 'find', 'How many gems does each dragon find?', 'baby'),
    ],
    distractors: [(d) => `${d} bats sleep.`, (d) => `${d} clouds drift.`],
  },
  eggs: {
    unit: 'eggs',
    templates: [
      T('nests', 'nest', 'hold', 'How many eggs in each nest?', 'dragon'),
      T('baskets', 'basket', 'have', 'How many eggs in each basket?'),
    ],
    distractors: [(d) => `${d} birds sing.`, (d) => `${d} frogs hop.`],
  },
  stickers: {
    unit: 'stickers',
    templates: [
      T('pages', 'page', 'have', 'How many stickers on each page?'),
      T('books', 'book', 'hold', 'How many stickers in each book?', 'sticker'),
    ],
    distractors: [(d) => `${d} pencils roll.`, (d) => `${d} crayons wait.`],
  },
  cookies: {
    unit: 'cookies',
    templates: [
      T('trays', 'tray', 'hold', 'How many cookies on each tray?'),
      T('jars', 'jar', 'have', 'How many cookies in each jar?'),
    ],
    distractors: [(d) => `${d} mice peek.`, (d) => `${d} cups wait.`],
  },
  spacePets: {
    unit: 'space pets',
    templates: [
      T('rockets', 'rocket', 'carry', 'How many space pets in each rocket?'),
      T('moons', 'moon', 'have', 'How many space pets on each moon?'),
    ],
    distractors: [(d) => `${d} comets glow.`, (d) => `${d} stars twinkle.`],
  },
  shells: {
    unit: 'shells',
    templates: [
      T('buckets', 'bucket', 'hold', 'How many shells in each bucket?'),
      T('crabs', 'crab', 'collect', 'How many shells does each crab collect?'),
    ],
    distractors: [(d) => `${d} waves splash.`, (d) => `${d} seagulls fly.`],
  },
  acorns: {
    unit: 'acorns',
    templates: [
      T('squirrels', 'squirrel', 'hide', 'How many acorns does each squirrel hide?'),
      T('logs', 'log', 'hold', 'How many acorns in each log?', 'hollow'),
    ],
    distractors: [(d) => `${d} owls hoot.`, (d) => `${d} leaves fall.`],
  },
}

export const MAX_STORY_WORDS = 15

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function pick<T>(list: readonly T[], rng: Rng): T {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))]
}

function assertShape({ a, b }: BigProblem): void {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 10 || a > 99 || b < 2 || b > 9) {
    throw new RangeError(`storyFor expects a 2-digit × 1-digit problem, got ${a} × ${b}`)
  }
}

/** One extra single-digit number: never b, never a digit of a (no clash with the split). */
export function distractorFor({ a, b }: BigProblem, rng: Rng): number {
  const banned = new Set([b, Math.floor(a / 10), a % 10])
  const pool = [2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !banned.has(n))
  return pick(pool, rng)
}

export interface StoryOptions {
  /** Force a theme (tests, or a UI that rotates themes itself). */
  theme?: StoryTheme
  /** Force a template index within the theme. */
  template?: number
  /** Force distractor on/off; default = level 3 only. */
  distractor?: boolean
}

/**
 * A story for any 2-digit × 1-digit problem. 42 × 3 →
 * "3 dragons each guard a chest of 42 gems. How many gems in all?"
 */
export function storyFor(problem: BigProblem, rng: Rng = Math.random, opts: StoryOptions = {}): Story {
  assertShape(problem)
  const { a, b } = problem
  const theme = opts.theme ?? pick(STORY_THEMES, rng)
  const bank = BANK[theme]
  const tpl = opts.template !== undefined ? bank.templates[opts.template % bank.templates.length] : pick(bank.templates, rng)
  const main = `${tpl.sentence(b, a)} ${bank.unit}.`
  const longQ = `How many ${bank.unit} in all?`
  const shortQ = 'How many in all?'

  const wantDistractor = opts.distractor ?? levelOf(problem) === 3
  let distractor: number | undefined
  let side = ''
  if (wantDistractor) {
    distractor = distractorFor(problem, rng)
    // Try the side sentences in random order; first that keeps the full question within budget wins.
    const order = shuffle(bank.distractors, rng)
    const d = distractor
    const fit = order.find((f) => wordCount(`${main} ${f(d)} ${longQ}`) <= MAX_STORY_WORDS)
    side = (fit ?? order.reduce((x, y) => (wordCount(x(d)) <= wordCount(y(d)) ? x : y)))(d)
  }

  const parts = [main, side].filter(Boolean)
  const question = wordCount([...parts, longQ].join(' ')) <= MAX_STORY_WORDS ? longQ : shortQ
  const text = [...parts, question].join(' ')

  const story: Story = {
    problem: { a, b },
    theme,
    text,
    speak: text,
    question,
    groups: b,
    each: a,
    unit: bank.unit,
    groupNoun: tpl.group,
    groupNounOne: tpl.groupOne,
    answer: a * b,
    numbers: (text.match(/\d+/g) ?? []).map(Number),
    steps: [],
  }
  if (distractor !== undefined) story.distractor = distractor
  story.steps = storySteps(story, tpl.eachPrompt)
  return story
}

function shuffle<T>(list: readonly T[], rng: Rng): T[] {
  const out = list.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function toSpeech(text: string): string {
  return text
    .replace(/\s*×\s*/g, ' times ')
    .replace(/\s*\+\s*/g, ' plus ')
    .replace(/\s*=\s*/g, ' is ')
    .replace(/\s*\?\s*$/g, '?')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function sStep(kind: StoryStepKind, text: string, highlight: StoryHighlight, value?: number): StoryStep {
  const s: StoryStep = { kind, text, speak: toSpeech(text), highlight }
  if (value !== undefined) s.value = value
  return s
}

/** The two math cards, groups first: ['3 × 42', '3 + 42']. */
export function mathCards(story: Pick<Story, 'groups' | 'each'>): [string, string] {
  return [`${story.groups} × ${story.each}`, `${story.groups} + ${story.each}`]
}

function storySteps(story: Story, eachPrompt: string): StoryStep[] {
  const { a, b } = story.problem
  const out: StoryStep[] = []
  out.push(sStep('groups', `How many ${story.groupNoun}?`, 'storyGroups', b))
  out.push(sStep('each', eachPrompt, 'storyEach', a))
  const pm = sStep('pickMath', `${b} groups of ${a}. Pick the math!`, 'pickMath', a * b)
  pm.speak = `${b} groups of ${a}. Pick the math!`
  pm.choices = mathCards(story)
  out.push(pm)

  // Reuse Break It Apart's narration (split, tens part, ones part, sum) so both games say the same words.
  const kinds: StoryStepKind[] = ['split', 'tensPart', 'onesPart', 'add']
  const ba = breakApartSteps(a, b, 'en')
  if (a % 10 === 0) {
    // Round tens are not in any deck; keep a sane path anyway (split → tens part → answer).
    out.push({ ...ba[0], kind: 'split' }, { ...ba[1], kind: 'tensPart' })
  } else {
    ba.slice(0, 4).forEach((s, i) => out.push({ ...s, kind: kinds[i] }))
  }

  out.push(sStep('answer', `${a * b} ${story.unit}!`, 'answer', a * b))
  return out
}

// ───────────────────────────────────────────── checks the UI calls

export type SlotName = 'groups' | 'each'
export type SlotResult = 'ok' | 'swapped' | 'distractor' | 'notInStory'

/** Was this number the right one for the slot? Never throws; non-numbers are 'notInStory'. */
export function checkSlot(story: Story, slot: SlotName, value: number): SlotResult {
  const want = slot === 'groups' ? story.groups : story.each
  const other = slot === 'groups' ? story.each : story.groups
  if (value === want) return 'ok'
  if (value === other) return 'swapped'
  if (story.distractor !== undefined && value === story.distractor) return 'distractor'
  return 'notInStory'
}

/** Amber, encouraging slot hint. Never gives the total. */
export function slotHint(story: Story, slot: SlotName, result: SlotResult): string | null {
  if (result === 'ok') return null
  const target = slot === 'groups' ? `how many ${story.groupNoun}` : `how many ${story.unit} in each ${story.groupNounOne}`
  switch (result) {
    case 'swapped':
      return `So close! That number is the other one. Which number tells ${target}?`
    case 'distractor':
      return `Good eye! That number is extra — it is not part of the math. Find ${target}.`
    default:
      return `Let's read it again together. Find the number that tells ${target}.`
  }
}

/**
 * "3 × 42" and "42 × 3" are both right (commutativity — the point of Flip & Split);
 * "3 + 42" is not. Accepts the card strings with or without spaces, × or x or *.
 */
export function pickMathOk(story: Pick<Story, 'groups' | 'each'>, card: string): boolean {
  const m = /^\s*(\d+)\s*([×xX*+])\s*(\d+)\s*$/.exec(card)
  if (!m) return false
  if (m[2] === '+') return false
  const x = Number(m[1])
  const y = Number(m[3])
  return (x === story.groups && y === story.each) || (x === story.each && y === story.groups)
}
