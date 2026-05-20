import type { CartLine } from '@/stores/cartStore';

export function getSubtotal(lines: CartLine[]) {
  return roundMoney(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
}

export function getTax(subtotal: number, rate = 0.0825) {
  return roundMoney(subtotal * rate);
}

export function getTotal(subtotal: number, tax: number, tip = 0) {
  return roundMoney(subtotal + tax + tip);
}

export function getCheckoutTotals(lines: CartLine[], taxRate = 0.0825) {
  const subtotal = getSubtotal(lines);
  const tax = getTax(subtotal, taxRate);

  return {
    subtotal,
    tax,
    total: getTotal(subtotal, tax),
  };
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}
