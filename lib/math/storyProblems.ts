// Story-based math problems for MathQuest Worlds
// Makes math FUN with characters, adventures, and narratives!

export interface StoryProblem {
  id: number
  type: 'addition' | 'subtraction' | 'counting'
  story: string
  question: string
  emoji: string
  num1: number
  num2: number
  answer: number
  options: number[]
  visualItems: string[]
  hint: string
}

// Story templates with placeholders
const ADDITION_STORIES = [
  {
    template: '{name} the {animal} found {n1} {items} in the morning. Later, {pronoun} found {n2} more! How many {items} does {name} have now?',
    animals: ['🐰 bunny', '🦊 fox', '🐻 bear', '🐿️ squirrel', '🦝 raccoon'],
    items: ['🍎 apples', '🥕 carrots', '🍓 strawberries', '🌰 acorns', '🍪 cookies']
  },
  {
    template: 'In the magical forest, {n1} {creatures} were dancing. Then {n2} more friends joined! How many {creatures} are dancing now?',
    creatures: ['🧚 fairies', '🦋 butterflies', '🐝 bees', '🦜 parrots', '🐸 frogs']
  },
  {
    template: '{name} has {n1} {toys} in one box and {n2} {toys} in another box. How many {toys} does {name} have in total?',
    toys: ['🎈 balloons', '🧸 teddy bears', '🎨 crayons', '🚗 toy cars', '⭐ stars']
  },
  {
    template: 'The pirates discovered {n1} gold {items} on the beach. The captain brought {n2} more from the ship! How many {items} do they have?',
    items: ['💰 coins', '💎 gems', '🏆 trophies', '📦 treasure chests', '🗝️ keys']
  },
  {
    template: 'At the space station, there were {n1} {things}. A rocket brought {n2} more! How many {things} are there now?',
    things: ['🚀 rockets', '🛸 UFOs', '👨‍🚀 astronauts', '🤖 robots', '⭐ shooting stars']
  }
]

const SUBTRACTION_STORIES = [
  {
    template: '{name} the {animal} had {n1} {items}. {pronoun} gave {n2} to a friend. How many {items} does {name} have left?',
    animals: ['🐰 bunny', '🐶 puppy', '🐱 kitten', '🐼 panda', '🦊 fox'],
    items: ['🍎 apples', '🍪 cookies', '🧁 cupcakes', '🍬 candies', '🎈 balloons']
  },
  {
    template: 'There were {n1} {creatures} at the party. Then {n2} had to go home. How many {creatures} are still at the party?',
    creatures: ['🦋 butterflies', '🐸 frogs', '🐝 bees', '🧚 fairies', '🐒 monkeys']
  },
  {
    template: 'The chef made {n1} {foods}. The hungry dragons ate {n2} of them! How many {foods} are left?',
    foods: ['🍕 pizzas', '🍩 donuts', '🧁 cupcakes', '🥧 pies', '🎂 cakes']
  },
  {
    template: '{name} had {n1} {items} in the treasure chest. A sneaky pirate took {n2}! How many {items} are left?',
    items: ['💎 diamonds', '💰 gold coins', '🔮 magic crystals', '👑 crowns', '📿 jewels']
  },
  {
    template: 'In the garden, there were {n1} {flowers}. The wind blew away {n2}. How many {flowers} are still in the garden?',
    flowers: ['🌸 flowers', '🌻 sunflowers', '🌹 roses', '🌺 hibiscus', '🌷 tulips']
  }
]

const COUNTING_STORIES = [
  {
    template: 'Look at the {place}! Can you count how many {items} there are?',
    places: ['magical garden', 'underwater palace', 'space station', 'candy land', 'dinosaur valley'],
    items: ['🌟 stars', '🐠 fish', '🦋 butterflies', '🍭 lollipops', '🥚 dino eggs']
  },
  {
    template: '{name} the explorer needs your help! Count the {items} to unlock the treasure!',
    items: ['💎 gems', '🗝️ keys', '🪙 coins', '🔮 crystals', '⭐ stars']
  }
]

const NAMES = ['Luna', 'Max', 'Zara', 'Leo', 'Maya', 'Finn', 'Ruby', 'Kai', 'Lily', 'Oscar']

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateWrongAnswers(correct: number, count: number): number[] {
  const wrongs = new Set<number>()
  const offsets = [-3, -2, -1, 1, 2, 3, -5, 5, 10, -10]

  for (const offset of shuffleArray(offsets)) {
    if (wrongs.size >= count) break
    const wrong = correct + offset
    if (wrong > 0 && wrong !== correct) {
      wrongs.add(wrong)
    }
  }

  return Array.from(wrongs).slice(0, count)
}

export function generateStoryProblem(
  id: number,
  type: 'addition' | 'subtraction' | 'counting',
  difficulty: 'easy' | 'medium' | 'hard',
  usedProblems: Set<string>
): StoryProblem {
  // Difficulty ranges
  const ranges = {
    easy: { min: 1, max: 5 },
    medium: { min: 3, max: 12 },
    hard: { min: 5, max: 20 }
  }
  const range = ranges[difficulty]

  const name = NAMES[randomInt(0, NAMES.length - 1)]
  const pronoun = ['she', 'he'][randomInt(0, 1)]

  let num1: number, num2: number, answer: number
  let story: string, question: string, emoji: string, hint: string
  let visualItems: string[]
  let problemKey: string

  // Keep generating until we get a unique problem
  do {
    if (type === 'addition') {
      const template = ADDITION_STORIES[randomInt(0, ADDITION_STORIES.length - 1)]
      num1 = randomInt(range.min, range.max)
      num2 = randomInt(range.min, Math.min(range.max, 10))
      answer = num1 + num2

      const items = template.items || template.creatures || template.toys || template.things || ['stars']
      const itemChoice = items[randomInt(0, items.length - 1)]
      const [itemEmoji, itemName] = itemChoice.split(' ')

      story = template.template
        .replace('{name}', name)
        .replace('{animal}', template.animals ? template.animals[randomInt(0, template.animals.length - 1)].split(' ')[1] : 'friend')
        .replace('{pronoun}', pronoun)
        .replace(/{n1}/g, String(num1))
        .replace(/{n2}/g, String(num2))
        .replace(/{items}/g, itemName)
        .replace(/{creatures}/g, itemName)
        .replace(/{toys}/g, itemName)
        .replace(/{things}/g, itemName)

      emoji = itemEmoji
      question = `${num1} + ${num2} = ?`
      visualItems = [...Array(num1).fill(itemEmoji), ...Array(num2).fill(itemEmoji)]
      hint = `Count ${num1} ${itemEmoji}, then add ${num2} more!`

    } else if (type === 'subtraction') {
      const template = SUBTRACTION_STORIES[randomInt(0, SUBTRACTION_STORIES.length - 1)]
      num1 = randomInt(Math.max(range.min + 2, 3), range.max)
      num2 = randomInt(1, num1 - 1)
      answer = num1 - num2

      const items = template.items || template.creatures || template.foods || template.flowers || ['stars']
      const itemChoice = items[randomInt(0, items.length - 1)]
      const [itemEmoji, itemName] = itemChoice.split(' ')

      story = template.template
        .replace('{name}', name)
        .replace('{animal}', template.animals ? template.animals[randomInt(0, template.animals.length - 1)].split(' ')[1] : 'friend')
        .replace('{pronoun}', pronoun.charAt(0).toUpperCase() + pronoun.slice(1))
        .replace(/{n1}/g, String(num1))
        .replace(/{n2}/g, String(num2))
        .replace(/{items}/g, itemName)
        .replace(/{creatures}/g, itemName)
        .replace(/{foods}/g, itemName)
        .replace(/{flowers}/g, itemName)

      emoji = itemEmoji
      question = `${num1} - ${num2} = ?`
      visualItems = Array(num1).fill(itemEmoji)
      hint = `Start with ${num1} ${itemEmoji}, take away ${num2}!`

    } else {
      // Counting
      const template = COUNTING_STORIES[randomInt(0, COUNTING_STORIES.length - 1)]
      num1 = randomInt(range.min, range.max)
      num2 = 0
      answer = num1

      const itemChoice = template.items[randomInt(0, template.items.length - 1)]
      const [itemEmoji, itemName] = itemChoice.split(' ')
      const place = template.places ? template.places[randomInt(0, template.places.length - 1)] : 'magical world'

      story = template.template
        .replace('{name}', name)
        .replace('{place}', place)
        .replace(/{items}/g, itemName)

      emoji = itemEmoji
      question = `How many ${itemName}?`
      visualItems = Array(num1).fill(itemEmoji)
      hint = `Count each ${itemEmoji} one by one!`
    }

    problemKey = `${type}-${num1}-${num2}`
  } while (usedProblems.has(problemKey) && usedProblems.size < 100)

  usedProblems.add(problemKey)

  const wrongAnswers = generateWrongAnswers(answer, 3)
  const options = shuffleArray([answer, ...wrongAnswers])

  return {
    id,
    type,
    story,
    question,
    emoji,
    num1,
    num2,
    answer,
    options,
    visualItems,
    hint
  }
}

// Generate a full set of story problems with progressive difficulty
export function generateStoryProblems(
  count: number = 10,
  mixOperations: boolean = true
): StoryProblem[] {
  const usedProblems = new Set<string>()
  const problems: StoryProblem[] = []

  for (let i = 0; i < count; i++) {
    // Progressive difficulty
    let difficulty: 'easy' | 'medium' | 'hard'
    if (i < count * 0.3) {
      difficulty = 'easy'
    } else if (i < count * 0.7) {
      difficulty = 'medium'
    } else {
      difficulty = 'hard'
    }

    // Mix operations
    let type: 'addition' | 'subtraction' | 'counting'
    if (mixOperations) {
      const rand = Math.random()
      if (rand < 0.4) {
        type = 'addition'
      } else if (rand < 0.8) {
        type = 'subtraction'
      } else {
        type = 'counting'
      }
    } else {
      type = i % 2 === 0 ? 'addition' : 'subtraction'
    }

    const problem = generateStoryProblem(i, type, difficulty, usedProblems)
    problems.push(problem)
  }

  return shuffleArray(problems).map((p, idx) => ({ ...p, id: idx }))
}
