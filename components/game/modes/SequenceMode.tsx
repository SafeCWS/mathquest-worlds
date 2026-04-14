'use client';
import { Reorder } from 'motion/react';
import { useState } from 'react';
import { GameModeProps } from '@/lib/types/gameEngine';

export function SequenceMode({ problem, onCorrect }: GameModeProps) {
  const [items, setItems] = useState(problem.assets);

  const handleReorder = (newOrder: typeof items) => {
    setItems(newOrder);

    const currentOrder = newOrder.map(i => i.id).join(',');
    const correctOrder = problem.correctSequence?.join(',');

    if (currentOrder === correctOrder) {
      onCorrect(Date.now());
    }
  };

  return (
    <Reorder.Group axis="x" values={items} onReorder={handleReorder} className="flex gap-4">
      {items.map((item) => (
        <Reorder.Item key={item.id} value={item} className="bg-white p-4 rounded-xl shadow-lg text-black" style={{ touchAction: 'none' }}>
          {item.content}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
