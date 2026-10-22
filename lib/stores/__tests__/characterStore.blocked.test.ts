// Safari "Block All Cookies" from the first line: the character gate (/, /worlds, /wardrobe,
// /progress, /preferences) must still open, and a character made now lasts the session.
import './blockedStorageShim'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { useCharacterStore } from '../characterStore'
import { useGamePreferencesStore } from '../gamePreferencesStore'

test('character store hydrates and keeps a new character with storage blocked', async () => {
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(useCharacterStore.getState()._hasHydrated, true)
  useCharacterStore.getState().setCharacterName('Kiko')
  useCharacterStore.getState().saveCharacter()
  await useCharacterStore.persist.rehydrate()
  assert.equal(useCharacterStore.getState().characterName, 'Kiko')
  assert.equal(useCharacterStore.getState().hasCreatedCharacter, true)
})

test('preferences store hydrates with storage blocked', () => {
  assert.equal(useGamePreferencesStore.getState()._hasHydrated, true)
})
