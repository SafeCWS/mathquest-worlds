'use client';
import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { GameModeProps } from '@/lib/types/gameEngine';
import { sounds } from '@/lib/sounds/webAudioSounds';

export function DragPhysicsMode({ problem, onCorrect, onWrong }: GameModeProps) {
  const constraintsRef = useRef(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [placedItems, setPlacedItems] = useState<string[]>([]);
  const targetValue = problem.correctValue ?? 0;

  const handleDrop = (assetId: string, assetValue: number, point: { x: number; y: number }) => {
    if (!dropZoneRef.current) return;

    const rect = dropZoneRef.current.getBoundingClientRect();
    const isInsideDropZone =
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom;

    if (!isInsideDropZone) return;

    sounds.playBubble();
    const newCount = placedItems.length + assetValue;

    if (newCount === targetValue) {
      onCorrect(Date.now());
    } else if (newCount > targetValue) {
      if (onWrong) onWrong(Date.now());
      sounds.playWrong();
      setPlacedItems([]);
    } else {
      setPlacedItems(prev => [...prev, assetId]);
    }
  };

  return (
    <div className="relative w-full h-full" ref={constraintsRef}>
      {/* Target Zone */}
      <div
        ref={dropZoneRef}
        id="drop-zone"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-48 border-4 border-dashed border-white/50 rounded-full"
      >
        <span className="absolute center text-white font-bold text-2xl flex items-center justify-center w-full h-full">
          {placedItems.length} / {targetValue}
        </span>
      </div>

      {/* Draggable Assets */}
      <div className="flex flex-wrap gap-4 p-4">
        {problem.assets.map((asset) => {
          if (placedItems.includes(asset.id)) return null;
          return (
            <motion.div
              key={asset.id}
              drag
              dragConstraints={constraintsRef}
              dragElastic={0.2}
              whileDrag={{ scale: 1.2, zIndex: 100 }}
              onDragEnd={(_, info) => handleDrop(asset.id, asset.value || 1, info.point)}
              className="cursor-grab active:cursor-grabbing text-4xl"
              style={{ touchAction: 'none' }}
            >
              {asset.content}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
