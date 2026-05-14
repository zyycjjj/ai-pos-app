import { create } from 'zustand';

export type CartLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type CartState = {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  addLine: (line) =>
    set((state) => ({
      lines: [...state.lines, line],
    })),
  clear: () => set({ lines: [] }),
}));
