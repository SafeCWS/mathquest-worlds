'use client';
import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { GameModeProps } from '@/lib/types/gameEngine';
import { sounds } from '@/lib/sounds/webAudioSounds';

export const DragPhysicsMode = ({ problem, onCorrect, onWrong }: GameModeProps) => {
  const constraintsRef = useRef(null);
  const [placedItems, setPlacedItems] = useState<string[]>([]);
  const targetValue = problem.correctValue ?? 0;

  return (
    <div className="relative w-full h-full" ref={constraintsRef}>
      {/* 1. The Target Zone (e.g., A Hungry Monster) */}
      <div
        id="drop-zone"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-48 border-4 border-dashed border-white/50 rounded-full"
      >
        {/* Visual feedback when items are dropped */}
        <span className="absolute center text-white font-bold text-2xl flex items-center justify-center w-full h-full">
          {placedItems.length} / {targetValue}
        </span>
      </div>

      {/* 2. The Draggable Assets */}
      <div className="flex flex-wrap gap-4 p-4">
        {problem.assets.map((asset) => (
          <motion.div
            key={asset.id}
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.2}
            whileDrag={{ scale: 1.2, zIndex: 100 }}
            onDragEnd={(e, info) => {
              // Simple bounding box collision detection
              // In production, use a dedicated collision library or ref-based measurement
              if (info.point.y > 400) { // Rough "bottom area" check
                sounds.playBubble();
                const newCount = placedItems.length + (asset.value || 1);

                if (newCount === targetValue) {
                  onCorrect(Date.now());
                } else if (newCount > targetValue) {
                  if (onWrong) onWrong(Date.now());
                  sounds.playWrong();
                  setPlacedItems([]); // Reset on overflow (Game mechanic)
                } else {
                  setPlacedItems(prev => [...prev, asset.id]);
                }
              }
            }}
            className="cursor-grab active:cursor-grabbing text-4xl"
          >
            {asset.content}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
