/**
 * stepScripts — bilingual narration + hints for "Big Multiplication" (2-digit × 1-digit).
 *
 * Spec: ~/.claude/plans/mellow-roaming-hoare.md, Part 2. Pure: no React, no DOM, no audio.
 * Every step carries a `highlight` so the UI can glow the matching cell, and a `speak`
 * string for lib/sounds/speechUtils.speak() (symbols spelled out, dashes turned into pauses).
 *
 * Spanish is Latin American, kid register (tú) — matches the game's existing "¡Toca la respuesta!".
 */

export type StepLocale = 'en' | 'es'

export type StepHighlight =
  | 'ones'        // column: the ones digit of the top factor (and the multiplier)
  | 'tens'        // column: the tens digit of the top factor
  | 'carry'       // column: the carry bubble
  | 'answerOnes'  // column: ones place of the answer row
  | 'answerTens'  // column: tens (and hundreds) place of the answer row
  | 'answer'      // the whole answer
  | 'split'       // break-apart: the 42 → 40 + 2 split
  | 'tensPart'    // break-apart: the 40 × 3 rectangle
  | 'onesPart'    // break-apart: the 2 × 3 rectangle
  | 'sum'         // break-apart: 120 + 6
  | 'groups'      // block builder: the b groups
  | 'cubes'       // block builder: the ones cubes
  | 'rods'        // block builder: the tens rods
  | 'trade'       // block builder: 10 cubes → 1 rod
  | 'estimate'    // quick guess: the rounded factor

export interface Step {
  /** Text shown on screen. */
  text: string
  /** Text for speech synthesis (no symbols). */
  speak: string
  /** Which cell / piece the UI should glow. */
  highlight: StepHighlight
  /** The number the kid writes or finds at this step, when there is one. */
  value?: number
}

export type MisconceptionKind =
  | 'forgotCarry'          // 78×8 → 564
  | 'carryBeforeMultiply'  // 78×8 → (7+6)×8 = 104 → 1044
  | 'onesOnly'             // 78×8 → 64, or 42×3 → 46 (tens copied down)
  | 'fullOnesProduct'      // 78×8 → 5664 (wrote 64 instead of 4)
  | 'placeValue'           // 78×8 → 56+64 = 120, 6240, 62, 426…

export interface MisconceptionHint extends Step {
  kind: MisconceptionKind
}

interface Parts {
  a: number
  b: number
  tensDigit: number
  onesDigit: number
  onesProduct: number
  onesWrite: number
  carry: number
  tensProduct: number
  tensSum: number
  product: number
}

/** Accepts next-intl style locales ('es', 'es-MX', 'en-US'); anything not Spanish is English. */
export function normalizeLocale(locale: string | undefined | null): StepLocale {
  return typeof locale === 'string' && locale.toLowerCase().startsWith('es') ? 'es' : 'en'
}

function parts(a: number, b: number): Parts {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 10 || a > 99 || b < 0 || b > 9) {
    throw new RangeError(`stepScripts expects a 2-digit × 1-digit problem, got ${a} × ${b}`)
  }
  const tensDigit = Math.floor(a / 10)
  const onesDigit = a % 10
  const onesProduct = onesDigit * b
  const onesWrite = onesProduct % 10
  const carry = Math.floor(onesProduct / 10)
  const tensProduct = tensDigit * b
  const tensSum = tensProduct + carry
  return { a, b, tensDigit, onesDigit, onesProduct, onesWrite, carry, tensProduct, tensSum, product: a * b }
}

/** Screen text → speech text: spell out ×/+/=, turn dashes into a comma pause. */
function toSpeech(text: string, loc: StepLocale): string {
  const times = loc === 'es' ? ' por ' : ' times '
  const plus = loc === 'es' ? ' más ' : ' plus '
  const equals = loc === 'es' ? ' es ' : ' is '
  return text
    .replace(/\s*×\s*/g, times)
    .replace(/\s*\+\s*/g, plus)
    .replace(/\s*=\s*/g, equals)
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function step(text: string, loc: StepLocale, highlight: StepHighlight, value?: number): Step {
  const s: Step = { text, speak: toSpeech(text, loc), highlight }
  if (value !== undefined) s.value = value
  return s
}

function answerLine(n: number, loc: StepLocale): string {
  return loc === 'es' ? `¡La respuesta es ${n}!` : `The answer is ${n}!`
}

const plural = {
  en: { ten: (n: number) => (n === 1 ? 'ten' : 'tens'), one: (n: number) => (n === 1 ? 'one' : 'ones') },
  es: { ten: (n: number) => (n === 1 ? 'decena' : 'decenas'), one: (n: number) => (n === 1 ? 'unidad' : 'unidades') },
}

// ---------------------------------------------------------------- Step-by-Step Column

/**
 * 78×8 (en) → "8 times 8 is 64." · "Write the 4, carry the 6." · "7 times 8 is 56." ·
 *             "56 plus the 6 you carried is 62." · "The answer is 624!"
 * No carry (21×3) → "1 times 3 is 3." · "Write the 3." · "2 times 3 is 6." · "The answer is 63!"
 */
export function columnSteps(a: number, b: number, locale: string): Step[] {
  const loc = normalizeLocale(locale)
  const p = parts(a, b)
  const es = loc === 'es'
  const out: Step[] = []

  out.push(step(es ? `${p.onesDigit} por ${p.b} es ${p.onesProduct}.` : `${p.onesDigit} times ${p.b} is ${p.onesProduct}.`,
    loc, 'ones', p.onesProduct))

  if (p.carry > 0) {
    out.push(step(es ? `Escribe el ${p.onesWrite} y llevas ${p.carry}.` : `Write the ${p.onesWrite}, carry the ${p.carry}.`,
      loc, 'carry', p.carry))
  } else {
    out.push(step(es ? `Escribe el ${p.onesWrite}.` : `Write the ${p.onesWrite}.`, loc, 'answerOnes', p.onesWrite))
  }

  out.push(step(es ? `${p.tensDigit} por ${p.b} es ${p.tensProduct}.` : `${p.tensDigit} times ${p.b} is ${p.tensProduct}.`,
    loc, 'tens', p.tensProduct))

  if (p.carry > 0) {
    out.push(step(es
      ? `${p.tensProduct} más el ${p.carry} que llevabas es ${p.tensSum}.`
      : `${p.tensProduct} plus the ${p.carry} you carried is ${p.tensSum}.`,
    loc, 'answerTens', p.tensSum))
  }

  out.push(step(answerLine(p.product, loc), loc, 'answer', p.product))
  return out
}

// ---------------------------------------------------------------- Break It Apart (area model)

/** 42×3 → "Break 42 into 40 and 2." · "40 times 3 is 120." · "2 times 3 is 6." · "120 plus 6 is 126." · answer */
export function breakApartSteps(a: number, b: number, locale: string): Step[] {
  const loc = normalizeLocale(locale)
  const p = parts(a, b)
  const es = loc === 'es'
  const tensValue = p.tensDigit * 10
  const tensPart = tensValue * p.b
  const out: Step[] = []

  if (p.onesDigit === 0) {
    out.push(step(es ? `${p.a} ya es un número redondo.` : `${p.a} is already a round number.`, loc, 'split'))
    out.push(step(es ? `${tensValue} por ${p.b} es ${tensPart}.` : `${tensValue} times ${p.b} is ${tensPart}.`, loc, 'tensPart', tensPart))
    out.push(step(answerLine(p.product, loc), loc, 'answer', p.product))
    return out
  }

  out.push(step(es ? `Separa ${p.a} en ${tensValue} y ${p.onesDigit}.` : `Break ${p.a} into ${tensValue} and ${p.onesDigit}.`, loc, 'split'))
  out.push(step(es ? `${tensValue} por ${p.b} es ${tensPart}.` : `${tensValue} times ${p.b} is ${tensPart}.`, loc, 'tensPart', tensPart))
  out.push(step(es ? `${p.onesDigit} por ${p.b} es ${p.onesProduct}.` : `${p.onesDigit} times ${p.b} is ${p.onesProduct}.`, loc, 'onesPart', p.onesProduct))
  out.push(step(es ? `${tensPart} más ${p.onesProduct} es ${p.product}.` : `${tensPart} plus ${p.onesProduct} is ${p.product}.`, loc, 'sum', p.product))
  out.push(step(answerLine(p.product, loc), loc, 'answer', p.product))
  return out
}

// ---------------------------------------------------------------- Block Builder (concrete)

/**
 * 42×3 → groups · "Count the ones: 3 groups of 2 is 6 ones." · "Count the tens: 3 groups of 4 is 12 tens." ·
 *        "12 tens and 6 ones make 126." · answer
 * 46×2 adds the regrouping pair: "You have 12 ones — trade 10 for a ten!" · "That leaves 2 ones."
 *        and "8 tens plus 1 traded ten is 9 tens."
 */
export function blockBuilderSteps(a: number, b: number, locale: string): Step[] {
  const loc = normalizeLocale(locale)
  const p = parts(a, b)
  const es = loc === 'es'
  const pl = plural[loc]
  const out: Step[] = []

  out.push(step(es
    ? `Haz ${p.b} ${p.b === 1 ? 'grupo' : 'grupos'} de ${p.a}: ${p.tensDigit} ${pl.ten(p.tensDigit)} y ${p.onesDigit} ${pl.one(p.onesDigit)} en cada uno.`
    : `Make ${p.b} ${p.b === 1 ? 'group' : 'groups'} of ${p.a}: ${p.tensDigit} ${pl.ten(p.tensDigit)} and ${p.onesDigit} ${pl.one(p.onesDigit)} in each.`,
  loc, 'groups'))

  out.push(step(es
    ? `Cuenta las unidades: ${p.b} grupos de ${p.onesDigit} son ${p.onesProduct} ${pl.one(p.onesProduct)}.`
    : `Count the ones: ${p.b} groups of ${p.onesDigit} is ${p.onesProduct} ${pl.one(p.onesProduct)}.`,
  loc, 'cubes', p.onesProduct))

  if (p.carry > 0) {
    const traded = p.carry * 10
    const tradeText = es
      ? (p.carry === 1
        ? `Tienes ${p.onesProduct} unidades: ¡cambia 10 por una decena!`
        : `Tienes ${p.onesProduct} unidades: ¡cambia ${traded} por ${p.carry} decenas!`)
      : (p.carry === 1
        ? `You have ${p.onesProduct} ones — trade 10 for a ten!`
        : `You have ${p.onesProduct} ones — trade ${traded} for ${p.carry} tens!`)
    out.push(step(tradeText, loc, 'trade', p.carry))
    out.push(step(es
      ? `${p.onesWrite === 1 ? 'Te queda' : 'Te quedan'} ${p.onesWrite} ${pl.one(p.onesWrite)}.`
      : `That leaves ${p.onesWrite} ${pl.one(p.onesWrite)}.`,
    loc, 'cubes', p.onesWrite))
  }

  out.push(step(es
    ? `Cuenta las decenas: ${p.b} grupos de ${p.tensDigit} son ${p.tensProduct} ${pl.ten(p.tensProduct)}.`
    : `Count the tens: ${p.b} groups of ${p.tensDigit} is ${p.tensProduct} ${pl.ten(p.tensProduct)}.`,
  loc, 'rods', p.tensProduct))

  if (p.carry > 0) {
    out.push(step(es
      ? `${p.tensProduct} ${pl.ten(p.tensProduct)} más ${p.carry} ${p.carry === 1 ? 'decena cambiada' : 'decenas cambiadas'} son ${p.tensSum} ${pl.ten(p.tensSum)}.`
      : `${p.tensProduct} ${pl.ten(p.tensProduct)} plus ${p.carry} traded ${pl.ten(p.carry)} is ${p.tensSum} ${pl.ten(p.tensSum)}.`,
    loc, 'rods', p.tensSum))
  }

  out.push(step(es
    ? `${p.tensSum} ${pl.ten(p.tensSum)} y ${p.onesWrite} ${pl.one(p.onesWrite)} son ${p.product}.`
    : `${p.tensSum} ${pl.ten(p.tensSum)} and ${p.onesWrite} ${pl.one(p.onesWrite)} make ${p.product}.`,
  loc, 'answer', p.product))
  out.push(step(answerLine(p.product, loc), loc, 'answer', p.product))
  return out
}

// ---------------------------------------------------------------- Quick Guess (estimation)

/** Nearest ten, halves up (45 → 50, 99 → 100). */
function nearestTen(a: number): number {
  return Math.round(a / 10) * 10
}

/** 42×3 → "42 is close to 40. 40 times 3 is 120, so 42 times 3 is about 120." */
export function estimateHint(a: number, b: number, locale: string): Step {
  const loc = normalizeLocale(locale)
  const p = parts(a, b)
  const r = nearestTen(p.a)
  const est = r * p.b
  const es = loc === 'es'
  if (r === p.a) {
    return step(es
      ? `${p.a} ya es redondo: ${p.a} por ${p.b} es ${est}.`
      : `${p.a} is already round: ${p.a} times ${p.b} is ${est}.`, loc, 'estimate', est)
  }
  return step(es
    ? `${p.a} está cerca de ${r}. ${r} por ${p.b} es ${est}, así que ${p.a} por ${p.b} es como ${est}.`
    : `${p.a} is close to ${r}. ${r} times ${p.b} is ${est}, so ${p.a} times ${p.b} is about ${est}.`,
  loc, 'estimate', est)
}

// ---------------------------------------------------------------- Misconceptions

function concat(left: number, right: number): number {
  return Number(`${left}${right}`)
}

function reverseDigits(n: number): number {
  return Number(String(n).split('').reverse().join(''))
}

/**
 * Which known error produced `wrong`? null when it is correct, not a whole number,
 * or matches no known pattern. Checked in order; first match wins.
 */
export function detectMisconception(a: number, b: number, wrong: number): MisconceptionKind | null {
  const p = parts(a, b)
  if (!Number.isInteger(wrong) || wrong < 0 || wrong === p.product) return null

  if (p.carry > 0) {
    // Wrote the ones digit and the tens product, never added the carry: 78×8 → 564.
    if (wrong === concat(p.tensProduct, p.onesWrite)) return 'forgotCarry'
    // Added the carry to the tens digit, then multiplied: (7+6)×8 = 104 → 1044.
    if (wrong === concat((p.tensDigit + p.carry) * p.b, p.onesWrite)) return 'carryBeforeMultiply'
    // Wrote the whole ones product in the ones place: 56|64 → 5664 (or 62|64 → 6264).
    if (wrong === concat(p.tensProduct, p.onesProduct) || wrong === concat(p.tensSum, p.onesProduct)) return 'fullOnesProduct'
  }

  // Multiplied only the ones: 78×8 → 64; or copied the tens digit down: 42×3 → 46.
  if (wrong === p.onesProduct || wrong === concat(p.tensDigit, p.onesWrite)) return 'onesOnly'

  // Place-value slip: treated the tens product as ones (56 + 64 = 120), off by ×10,
  // or digits in the wrong places (426 for 624).
  if (wrong === p.tensProduct + p.onesProduct) return 'placeValue'
  if (wrong === p.product * 10) return 'placeValue'
  if (p.product % 10 === 0 && wrong === p.product / 10) return 'placeValue'
  const rev = reverseDigits(p.product)
  if (rev !== p.product && p.product % 10 !== 0 && wrong === rev) return 'placeValue'

  return null
}

/**
 * A targeted, encouraging hint for a known error — never gives the final answer away.
 * Returns null when no pattern matches: the UI then falls back to the current step of the
 * mode's script (spec: "wrong answer ⇒ gentle shake + auto-hint showing the current step").
 */
export function misconceptionHint(a: number, b: number, wrongAnswer: number, locale: string): MisconceptionHint | null {
  const kind = detectMisconception(a, b, wrongAnswer)
  if (!kind) return null
  const loc = normalizeLocale(locale)
  const es = loc === 'es'
  const p = parts(a, b)
  const hint = (text: string, highlight: StepHighlight, value?: number): MisconceptionHint => ({ kind, ...step(text, loc, highlight, value) })

  switch (kind) {
    case 'forgotCarry':
      return hint(es
        ? `¡Casi! Se te olvidó el ${p.carry} que llevabas. Súmalo al ${p.tensProduct}.`
        : `So close! You forgot the ${p.carry} you carried. Add it to ${p.tensProduct}.`, 'carry', p.carry)
    case 'carryBeforeMultiply':
      return hint(es
        ? `¡Casi! Primero multiplica: ${p.tensDigit} por ${p.b} es ${p.tensProduct}. Después suma el ${p.carry} que llevabas.`
        : `Almost! Multiply first: ${p.tensDigit} times ${p.b} is ${p.tensProduct}. Then add the ${p.carry} you carried.`, 'tens', p.tensProduct)
    case 'fullOnesProduct':
      return hint(es
        ? `En el lugar de las unidades solo va el ${p.onesWrite}. Lleva el ${p.carry} a las decenas.`
        : `Only the ${p.onesWrite} goes in the ones place. Carry the ${p.carry} over to the tens.`, 'carry', p.carry)
    case 'onesOnly':
      return hint(es
        ? `¡Buen comienzo! Ya hiciste las unidades. Ahora multiplica también las decenas: ${p.tensDigit} por ${p.b}.`
        : `Good start! You did the ones. Now multiply the tens too: ${p.tensDigit} times ${p.b}.`, 'tens', p.tensProduct)
    case 'placeValue': {
      if (wrongAnswer === p.tensProduct + p.onesProduct && p.onesDigit !== 0) {
        const tv = p.tensDigit * 10
        return hint(es
          ? `¡Revisa los lugares! El ${p.tensDigit} de ${p.a} vale ${tv}, así que ${tv} por ${p.b} es ${tv * p.b}.`
          : `Check the places! The ${p.tensDigit} in ${p.a} means ${tv}, so ${tv} times ${p.b} is ${tv * p.b}.`, 'tens', tv * p.b)
      }
      return hint(es
        ? '¡Revisa los lugares! Cada número va en su columna: las unidades a la derecha y las decenas a la izquierda.'
        : 'Check the places! Each digit goes in its own column: ones on the right, tens on the left.', 'answer')
    }
  }
}
