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
  removeLine: (productId: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  addLine: (line) =>
    set((state) => ({
      lines: state.lines.some((item) => item.productId === line.productId)
        ? state.lines.map((item) =>
            item.productId === line.productId ? { ...item, quantity: item.quantity + line.quantity } : item,
          )
        : [...state.lines, line],
    })),
  removeLine: (productId) =>
    set((state) => ({
      lines: state.lines.filter((line) => line.productId !== productId),
    })),
  clear: () => set({ lines: [] }),
}));
