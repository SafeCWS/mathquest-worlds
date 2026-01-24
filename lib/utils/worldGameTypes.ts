// World-specific game type overrides
// This allows certain worlds to have their own themed mini-games

import type { GameType } from '@/lib/constants/levels'

// Cat world has special themed games that can be used
const CAT_WORLD_GAMES: GameType[] = [
  'catTreats',
  'yarnBall',
  'catNap',
  'catTower',
  'kittyDance'
]

// Space Galaxy world has special themed games
const SPACE_WORLD_GAMES: GameType[] = [
  'asteroidBlast',
  'planetHop',
  'alienFeeding',
  'starCollector'
]

// Ocean Kingdom world has special themed games
const OCEAN_WORLD_GAMES: GameType[] = [
  'bubbleCount',
  'fishSchool',
  'treasureChest',
  'seashellSort'
]

// Map of world IDs to their themed game types
const WORLD_GAME_OVERRIDES: Record<string, GameType[]> = {
  lovelycat: CAT_WORLD_GAMES,
  space: SPACE_WORLD_GAMES,
  ocean: OCEAN_WORLD_GAMES
}

/**
 * Get a game type for a specific world
 * If the world has themed games, randomly select one
 * Otherwise, return the default game type from the module
 */
export function getWorldGameType(worldId: string, defaultGameType: GameType): GameType {
  const worldGames = WORLD_GAME_OVERRIDES[worldId]

  if (worldGames && worldGames.length > 0) {
    // 70% chance to use world-specific game, 30% chance to use default
    // This provides variety while still showcasing the themed games
    if (Math.random() < 0.7) {
      return worldGames[Math.floor(Math.random() * worldGames.length)]
    }
  }

  return defaultGameType
}

/**
 * Check if a world has special themed games
 */
export function hasWorldThemedGames(worldId: string): boolean {
  return worldId in WORLD_GAME_OVERRIDES
}

/**
 * Get all themed game types for a world
 */
export function getWorldThemedGames(worldId: string): GameType[] {
  return WORLD_GAME_OVERRIDES[worldId] || []
}
