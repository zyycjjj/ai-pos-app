import { create } from 'zustand';

import type { SelectedModifier } from '@/types/modifiers';

export type CartLine = {
  lineId: string;
  productId: string;
  name: string;
  quantity: number;
  basePrice: number;
  unitPrice: number;
  modifiers: SelectedModifier[];
};

type CartLineInput = Omit<CartLine, 'lineId' | 'basePrice' | 'modifiers'> & {
  basePrice?: number;
  modifiers?: SelectedModifier[];
};

type CartState = {
  lines: CartLine[];
  addLine: (line: CartLineInput) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
};

function createLineId(line: CartLineInput) {
  const optionIds = (line.modifiers ?? []).map((modifier) => modifier.optionId).sort();
  return [line.productId, ...optionIds].join(':');
}

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  addLine: (line) =>
    set((state) => {
      const lineId = createLineId(line);
      const cartLine: CartLine = {
        ...line,
        lineId,
        basePrice: line.basePrice ?? line.unitPrice,
        modifiers: line.modifiers ?? [],
      };

      return {
        lines: state.lines.some((item) => item.lineId === lineId)
          ? state.lines.map((item) => (item.lineId === lineId ? { ...item, quantity: item.quantity + line.quantity } : item))
          : [...state.lines, cartLine],
      };
    }),
  setQuantity: (lineId, quantity) =>
    set((state) => ({
      lines:
        quantity <= 0
          ? state.lines.filter((line) => line.lineId !== lineId && line.productId !== lineId)
          : state.lines.map((line) => (line.lineId === lineId || line.productId === lineId ? { ...line, quantity } : line)),
    })),
  removeLine: (lineId) =>
    set((state) => ({
      lines: state.lines.filter((line) => line.lineId !== lineId && line.productId !== lineId),
    })),
  clear: () => set({ lines: [] }),
}));
