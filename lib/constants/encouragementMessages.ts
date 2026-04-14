export const WRONG_ANSWER_MESSAGES = [
  "Almost! Let's look at this together...",
  "Good try! Here's how it works:",
  "So close! Let me show you:",
  "Not quite, but you're learning!",
  "Oops! That's OK, watch this:",
  "Let's figure this one out!",
  "Nice try! Here's a clue:",
]

export const CORRECT_ANSWER_MESSAGES = [
  'You got it! \uD83C\uDF1F',
  'Amazing! \uD83C\uDF89',
  "That's right! \u2728",
  'Woohoo! \uD83D\uDCAB',
  "You're a star! \u2B50",
  'Super smart! \uD83E\uDDE0',
  'Brilliant! \uD83D\uDC8E',
]

let lastWrongIndex = -1
let lastCorrectIndex = -1

/**
 * Returns a random message from the provided array,
 * never the same one twice in a row.
 */
export function getRandomMessage(messages: string[]): string {
  if (messages.length === 0) return ''
  if (messages.length === 1) return messages[0]

  const isWrong = messages === WRONG_ANSWER_MESSAGES
  const lastIndex = isWrong ? lastWrongIndex : lastCorrectIndex

  let index: number
  do {
    index = Math.floor(Math.random() * messages.length)
  } while (index === lastIndex)

  if (isWrong) {
    lastWrongIndex = index
  } else {
    lastCorrectIndex = index
  }

  return messages[index]
}
