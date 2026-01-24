'use client'

import { motion } from 'motion/react'
import type { CharacterItem } from '@/lib/constants/characterItems'

interface ItemGridProps {
  items: CharacterItem[]
  selectedId: string
  onSelect: (id: string) => void
  multiSelect?: boolean
  selectedIds?: string[]
  lockedItems?: string[]
}

const getItemEmoji = (item: CharacterItem): string => {
  // Map items to visual emojis
  const emojiMap: Record<string, string> = {
    // Body types
    'body-1': '👤',
    'body-2': '🧍',
    'body-3': '🧍‍♀️',
    'body-4': '🏃',
    'body-5': '🧒',
    'body-6': '🧑',
    // Hair styles
    'hair-short': '💇',
    'hair-medium': '💇‍♀️',
    'hair-long': '👩‍🦰',
    'hair-curly': '👩‍🦱',
    'hair-wavy': '🌊',
    'hair-braids': '👧',
    'hair-ponytail': '🎀',
    'hair-pigtails': '👧',
    'hair-bun': '👩',
    'hair-afro': '🧑‍🦱',
    'hair-spiky': '⚡',
    'hair-mohawk': '🦔',
    'hair-twin-buns': '🐻',
    'hair-side-shave': '✂️',
    'hair-dreads': '🌿',
    // Eye shapes
    'eyes-round': '👁️',
    'eyes-almond': '👀',
    'eyes-cat': '😺',
    'eyes-droopy': '🥺',
    'eyes-wide': '😳',
    'eyes-narrow': '😑',
    'eyes-sparkle': '✨',
    'eyes-anime': '🌟',
    // Outfits
    'outfit-casual': '👕',
    'outfit-dress': '👗',
    'outfit-sporty': '🏋️',
    'outfit-overalls': '👖',
    'outfit-hoodie': '🧥',
    'outfit-jumpsuit': '🩱',
    'outfit-tshirt-jeans': '👕',
    'outfit-skirt-top': '👚',
    'outfit-tropical': '🌺',
    'outfit-adventurer': '🎒',
    'outfit-explorer': '🧭',
    'outfit-safari': '🦁',
    'outfit-astronaut': '👨‍🚀',
    'outfit-starfleet': '🚀',
    'outfit-mermaid': '🧜‍♀️',
    'outfit-pirate': '🏴‍☠️',
    'outfit-fairy': '🧚',
    'outfit-princess': '👸',
    'outfit-caveperson': '🦴',
    'outfit-dinosaur': '🦕',
    'outfit-candyprincess': '🍭',
    'outfit-gummybear': '🧸',
    'outfit-counting-champion': '🔢',
    'outfit-addition-wizard': '➕',
    'outfit-subtraction-star': '➖',
    'outfit-golden-adventurer': '🏆',
    // Accessories
    'acc-none': '❌',
    'acc-glasses': '👓',
    'acc-sunglasses': '🕶️',
    'acc-headband': '🎀',
    'acc-bow': '🎀',
    'acc-flower': '🌺',
    'acc-bandana': '🧢',
    'acc-cap': '🧢',
    'acc-beanie': '🧶',
    'acc-earrings': '💎',
    'acc-star-crown': '👑',
    'acc-glow-ring': '💍',
    'acc-magic-wand': '🪄',
    'acc-explorer-hat': '🎩',
    'acc-space-helmet': '🪖',
    'acc-shell-crown': '🐚',
    'acc-fairy-wings': '🧚',
    'acc-dino-horns': '🦖',
    'acc-lollipop': '🍭',
    // Pets
    'pet-none': '❌',
    'pet-parrot': '🦜',
    'pet-monkey': '🐒',
    'pet-turtle': '🐢',
    'pet-crab': '🦀',
    'pet-alien': '👽',
    'pet-seahorse': '🐴',
    'pet-unicorn': '🦄',
    'pet-babydino': '🦕',
    'pet-gummybear': '🧸',
    'pet-phoenix': '🔥',
    'pet-dragon': '🐲'
  }
  return emojiMap[item.id] || '❓'
}

export function ItemGrid({
  items,
  selectedId,
  onSelect,
  multiSelect = false,
  selectedIds = [],
  lockedItems = []
}: ItemGridProps) {
  const isSelected = (id: string) => {
    if (multiSelect) {
      return selectedIds.includes(id)
    }
    return selectedId === id
  }

  const isLocked = (id: string) => lockedItems.includes(id)

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 p-2">
      {items.map((item, index) => {
        const locked = isLocked(item.id)
        const selected = isSelected(item.id)

        return (
          <motion.button
            key={item.id}
            className={`
              relative flex flex-col items-center justify-center
              p-3 rounded-xl aspect-square
              transition-all duration-200
              ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${
                selected
                  ? 'bg-gradient-to-b from-yellow-300 to-yellow-500 shadow-lg ring-4 ring-yellow-200'
                  : 'bg-white/80 hover:bg-white hover:shadow-md'
              }
            `}
            onClick={() => !locked && onSelect(item.id)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            whileHover={!locked ? { scale: 1.05 } : {}}
            whileTap={!locked ? { scale: 0.95 } : {}}
          >
            <span className="text-3xl">{getItemEmoji(item)}</span>
            <span className="text-xs mt-1 font-medium text-gray-700 truncate max-w-full">
              {item.name}
            </span>

            {/* Lock overlay */}
            {locked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                <span className="text-2xl">🔒</span>
              </div>
            )}

            {/* Selected checkmark */}
            {selected && !locked && (
              <motion.div
                className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <span className="text-white text-xs">✓</span>
              </motion.div>
            )}

            {/* Unlock requirement badge */}
            {item.unlockType !== 'free' && !locked && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">
                  {item.unlockType === 'stars' && `⭐${item.unlockValue}`}
                  {item.unlockType === 'streak' && `🔥${item.unlockValue}`}
                  {item.unlockType === 'world' && `🌍`}
                  {item.unlockType === 'level' && `🎯`}
                </span>
              </div>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
