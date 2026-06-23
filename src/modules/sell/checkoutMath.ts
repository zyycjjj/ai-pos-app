import type { CartLine } from '@/stores/cartStore';

export type AdjustmentType = 'discount' | 'fixed_reduction' | 'price_override';

export type OrderAdjustment = {
  type: AdjustmentType;
  value: number;
};

export function getSubtotal(lines: CartLine[]) {
  return roundMoney(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
}

export function getAdjustmentAmount(subtotal: number, adjustment: OrderAdjustment | null) {
  if (!adjustment) {
    return 0;
  }

  if (adjustment.type === 'discount') {
    return roundMoney(subtotal * ((100 - adjustment.value) / 100));
  }
  if (adjustment.type === 'fixed_reduction') {
    return roundMoney(adjustment.value);
  }
  if (adjustment.type === 'price_override') {
    return roundMoney(subtotal - adjustment.value);
  }
  return 0;
}

export function getTax(subtotal: number, rate = 0.0825) {
  return roundMoney(subtotal * rate);
}

export function getTotal(subtotal: number, tax: number, tip = 0) {
  return roundMoney(subtotal + tax + tip);
}

export function getCheckoutTotals(lines: CartLine[], taxRate = 0.0825, adjustment: OrderAdjustment | null = null) {
  const subtotal = getSubtotal(lines);
  const rawAdjustment = getAdjustmentAmount(subtotal, adjustment);
  const adjustmentAmount = Math.min(Math.max(rawAdjustment, 0), subtotal);
  const adjustedSubtotal = roundMoney(subtotal - adjustmentAmount);
  const tax = getTax(adjustedSubtotal, taxRate);

  return {
    subtotal,
    adjustment: adjustmentAmount,
    adjustedSubtotal,
    tax,
    total: getTotal(adjustedSubtotal, tax),
  };
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}
