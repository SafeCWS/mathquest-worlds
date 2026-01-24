'use client';
import { Reorder } from 'motion/react';
import { useState, useEffect } from 'react';
import { GameModeProps } from '@/lib/types/gameEngine';

export const SequenceMode = ({ problem, onCorrect }: GameModeProps) => {
  const [items, setItems] = useState(problem.assets);

  // Check sequence every time items change order
  useEffect(() => {
    const currentOrderIds = items.map(i => i.id).join(',');
    const correctOrderIds = problem.correctSequence?.join(',');
    
    if (currentOrderIds === correctOrderIds) {
      onCorrect(Date.now());
    }
  }, [items, problem.correctSequence, onCorrect]);

  return (
    <Reorder.Group axis="x" values={items} onReorder={setItems} className="flex gap-4">
      {items.map((item) => (
        <Reorder.Item key={item.id} value={item} className="bg-white p-4 rounded-xl shadow-lg text-black">
          {item.content}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
};
