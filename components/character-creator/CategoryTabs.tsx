'use client'

import { motion } from 'motion/react'

export type CategoryType = 'body' | 'skin' | 'hair' | 'hairColor' | 'eyes' | 'outfit' | 'accessory' | 'pet'

interface CategoryTabsProps {
  activeCategory: CategoryType
  onCategoryChange: (category: CategoryType) => void
}

const categories: { id: CategoryType; label: string; emoji: string }[] = [
  { id: 'body', label: 'Body', emoji: '👤' },
  { id: 'skin', label: 'Skin', emoji: '🎨' },
  { id: 'hair', label: 'Hair', emoji: '💇' },
  { id: 'hairColor', label: 'Color', emoji: '🌈' },
  { id: 'eyes', label: 'Eyes', emoji: '👀' },
  { id: 'outfit', label: 'Outfit', emoji: '👗' },
  { id: 'accessory', label: 'Accessories', emoji: '🎀' },
  { id: 'pet', label: 'Pet', emoji: '🐾' }
]

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-2 min-w-max px-2">
        {categories.map((category) => (
          <motion.button
            key={category.id}
            className={`
              flex flex-col items-center justify-center
              px-3 py-2 rounded-xl font-medium
              transition-all duration-200
              ${
                activeCategory === category.id
                  ? 'bg-gradient-to-b from-yellow-400 to-orange-500 text-white shadow-lg scale-105'
                  : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-md'
              }
            `}
            onClick={() => onCategoryChange(category.id)}
            whileHover={{ scale: activeCategory === category.id ? 1.05 : 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl mb-1">{category.emoji}</span>
            <span className="text-xs whitespace-nowrap">{category.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
