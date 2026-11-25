// Red-team round 2 M1: a corrupt, tampered or full `mathquest-character` must never leave
// `/`, `/worlds`, `/wardrobe`, `/progress` on the loader, and must never crash the avatar.
// Same class as round 1 #2 (25ba930) and its yokoten (5d0dcc1).
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { mem, storage } from './memStorage'
import { useCharacterStore } from '../characterStore'
import { useGamePreferencesStore } from '../gamePreferencesStore'

const KEY = 'mathquest-character'
const st = () => useCharacterStore.getState()
const save = (state: unknown, version = 2) => mem.set(KEY, JSON.stringify({ state, version }))
const fresh = () => {
  st().resetCharacter()
  useCharacterStore.setState({ _hasHydrated: false })
}

// A saved character shaped like a real player's (synthetic values).
const PLAYER = {
  hasCreatedCharacter: true,
  characterName: 'Kiko',
  avatarStyle: 'wizard',
  primaryColor: '#805AD5',
  bodyType: 'body-regular',
  skinTone: '#8D5524',
  hairStyle: 'hair-curly',
  hairColor: '#E6BE8A',
  eyeShape: 'eyes-round',
  eyeColor: '#2E86AB',
  outfit: 'outfit-casual',
  accessories: ['acc-glasses'],
  petBuddy: 'pet-cat',
  effects: ['effect-sparkle'],
  animationState: 'idle',
  emotion: 'happy',
}

test('corrupt JSON (truncated write) still finishes hydration', async () => {
  fresh()
  mem.set(KEY, '{"state":{"x":')
  await useCharacterStore.persist.rehydrate()
  assert.equal(st()._hasHydrated, true)
  assert.equal(st().hasCreatedCharacter, false)
})

test('null / array / string state finishes hydration on defaults', async () => {
  for (const bad of [null, [1, 2], 'hello', 42]) {
    fresh()
    save(bad)
    await useCharacterStore.persist.rehydrate()
    assert.equal(st()._hasHydrated, true, JSON.stringify(bad))
    assert.equal(st().avatarStyle, 'explorer', JSON.stringify(bad))
    assert.ok(Array.isArray(st().accessories), JSON.stringify(bad))
  }
})

test('a saved key that shadows an action cannot break hydration or the actions', async () => {
  fresh()
  save({ ...PLAYER, setHasHydrated: 0, saveCharacter: 'x', toggleAccessory: null })
  await useCharacterStore.persist.rehydrate()
  assert.equal(st()._hasHydrated, true)
  assert.equal(typeof st().setHasHydrated, 'function')
  assert.equal(typeof st().saveCharacter, 'function')
  assert.equal(typeof st().toggleAccessory, 'function')
  assert.equal(st().characterName, 'Kiko')
})

test('wrong types fall back to defaults field by field; valid fields are kept', async () => {
  fresh()
  save({
    ...PLAYER,
    characterName: 5,
    avatarStyle: 'bogus',
    emotion: 'nope',
    animationState: { a: 1 },
    accessories: 'acc-glasses',
    effects: [1, 'effect-sparkle', null],
    hairColor: null,
    hasCreatedCharacter: 'yes',
  })
  await useCharacterStore.persist.rehydrate()
  const s = st()
  assert.equal(s._hasHydrated, true)
  assert.equal(s.characterName, '')
  assert.equal(s.avatarStyle, 'explorer')
  assert.equal(s.emotion, 'happy')
  assert.equal(s.animationState, 'idle')
  assert.deepEqual(s.accessories, [])
  assert.deepEqual(s.effects, ['effect-sparkle'])
  assert.equal(typeof s.hairColor, 'string')
  assert.equal(s.hasCreatedCharacter, false)
  // untouched valid fields survive
  assert.equal(s.skinTone, '#8D5524')
  assert.equal(s.petBuddy, 'pet-cat')
})

test('an existing player keeps the character — current, older and newer versions', async () => {
  for (const version of [2, 1, 0, 3]) {
    fresh()
    save(version === 2 ? { ...PLAYER, _hasHydrated: true } : PLAYER, version)
    await useCharacterStore.persist.rehydrate()
    const s = st()
    assert.equal(s._hasHydrated, true, `v${version}`)
    for (const [k, v] of Object.entries(PLAYER)) {
      assert.deepEqual(s[k as keyof typeof PLAYER], v, `v${version} ${k}`)
    }
  }
})

test('a character made this session is not un-made by a stale saved copy', async () => {
  fresh()
  st().setCharacterName('Kiko')
  st().saveCharacter()
  save({ ...PLAYER, hasCreatedCharacter: false, characterName: '' })
  await useCharacterStore.persist.rehydrate()
  assert.equal(st().hasCreatedCharacter, true)
  assert.equal(st()._hasHydrated, true)
})

test('accessory and effect caps are re-applied on load', async () => {
  fresh()
  save({ ...PLAYER, accessories: ['a', 'b', 'c', 'd', 'e'], effects: ['x', 'y', 'z'] })
  await useCharacterStore.persist.rehydrate()
  assert.equal(st().accessories.length, 3)
  assert.equal(st().effects.length, 2)
})

test('quota: a full storage never crashes the character actions', () => {
  const real = storage.setItem
  storage.setItem = () => { throw new DOMException('QuotaExceededError', 'QuotaExceededError') }
  try {
    assert.doesNotThrow(() => st().setCharacterName('Momo'))
    assert.doesNotThrow(() => st().saveCharacter())
    assert.doesNotThrow(() => st().randomizeAll())
    assert.equal(st().characterName, 'Momo')
    assert.equal(st().hasCreatedCharacter, true)
  } finally {
    storage.setItem = real
  }
})

test('getItem throwing mid-session still finishes hydration', async () => {
  fresh()
  const real = storage.getItem
  storage.getItem = () => { throw new DOMException('The operation is insecure.', 'SecurityError') }
  try {
    await useCharacterStore.persist.rehydrate()
    assert.equal(st()._hasHydrated, true)
  } finally {
    storage.getItem = real
  }
})

// /preferences also waits on gamePreferencesStore._hasHydrated — same class.
test('preferences: corrupt JSON and wrong shape still finish hydration', async () => {
  const PK = 'mathquest-preferences'
  const p = () => useGamePreferencesStore.getState()
  for (const raw of ['{"state":', JSON.stringify({ state: { setHasHydrated: 0, operations: 'x', gameStyle: 9, musicVolume: 'loud' }, version: 1 })]) {
    useGamePreferencesStore.setState({ _hasHydrated: false })
    mem.set(PK, raw)
    await useGamePreferencesStore.persist.rehydrate()
    assert.equal(p()._hasHydrated, true, raw)
    assert.equal(typeof p().setHasHydrated, 'function', raw)
    assert.ok(Array.isArray(p().operations), raw)
    assert.equal(p().gameStyle, 'mixed', raw)
    assert.equal(p().musicVolume, 70, raw)
  }
  useGamePreferencesStore.setState({ operations: ['counting'] })
  mem.set(PK, JSON.stringify({ state: { operations: ['division', 'bogus'], gameStyle: 'tap', sfxVolume: 30 }, version: 1 }))
  await useGamePreferencesStore.persist.rehydrate()
  assert.deepEqual(p().operations, ['division'])
  assert.equal(p().gameStyle, 'tap')
  assert.equal(p().sfxVolume, 30)
})
