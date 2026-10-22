// The exact M1 repro: the corrupt value is already there when the app first loads `/`.
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { mem } from './memStorage'

test('corrupt mathquest-character at first load: `/` leaves the loader', async () => {
  mem.set('mathquest-character', '{"state":{"x":')
  mem.set('mathquest-preferences', 'not json')
  const { useCharacterStore } = await import('../characterStore')
  const { useGamePreferencesStore } = await import('../gamePreferencesStore')
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(useCharacterStore.getState()._hasHydrated, true)
  assert.equal(useGamePreferencesStore.getState()._hasHydrated, true)
})
