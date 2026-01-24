import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ShopItem {
  id: string;
  name: string;
  cost: number;
  slot: 'head' | 'pet' | 'background';
  assetUrl: string;
}

interface EconomyState {
  stars: number;
  inventory: string[]; // IDs of owned items
  equipped: Record<string, string>; // { head: 'hat_1' }
  
  // Actions
  earnStars: (amount: number, source: 'quiz' | 'bonus') => void;
  buyItem: (item: ShopItem) => 'success' | 'poor' | 'owned';
  equipItem: (slot: string, itemId: string) => void;
}

export const useEconomyStore = create<EconomyState>()(
  persist(
    (set, get) => ({
      stars: 0,
      inventory: ['default_bg'],
      equipped: { background: 'default_bg' },

      earnStars: (amount) => set((state) => ({ stars: state.stars + amount })),

      buyItem: (item) => {
        const { stars, inventory } = get();
        if (inventory.includes(item.id)) return 'owned';
        if (stars < item.cost) return 'poor';
        
        set({ 
          stars: stars - item.cost, 
          inventory: [...inventory, item.id] 
        });
        return 'success';
      },

      equipItem: (slot, itemId) => 
        set((state) => ({ 
          equipped: { ...state.equipped, [slot]: itemId } 
        })),
    }),
    {
      name: 'mathquest-economy-v1', // Key in localStorage
      storage: createJSONStorage(() => localStorage), // Explicit storage
    }
  )
);
