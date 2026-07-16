import type { CartLine } from '@/stores/cartStore';

export type AdjustmentType = 'discount' | 'fixed_reduction' | 'price_override';

export type OrderAdjustment = {
  type: AdjustmentType;
  value: number;
  reason?: string;
};

export function getSubtotal(lines: CartLine[]) {
  return roundMoney(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
}

export function getAdjustmentAmount(subtotal: number, adjustment: OrderAdjustment | null) {
  if (!adjustment) {
    return 0;
  }

  if (adjustment.type === 'discount') {
    return roundMoney(subtotal * (adjustment.value / 100));
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

export function getTotal(subtotal: number, tax: number, serviceCharge = 0, tip = 0) {
  return roundMoney(subtotal + tax + serviceCharge + tip);
}

export function getCheckoutTotals(lines: CartLine[], taxRate = 0.0825, adjustment: OrderAdjustment | null = null, serviceChargeRate = 0, tip = 0) {
  const subtotal = getSubtotal(lines);
  const rawAdjustment = getAdjustmentAmount(subtotal, adjustment);
  const adjustmentAmount = Math.min(Math.max(rawAdjustment, 0), subtotal);
  const adjustedSubtotal = roundMoney(subtotal - adjustmentAmount);
  const tax = getTax(adjustedSubtotal, taxRate);
  const serviceCharge = roundMoney(adjustedSubtotal * serviceChargeRate);

  return {
    subtotal,
    adjustment: adjustmentAmount,
    adjustedSubtotal,
    tax,
    serviceCharge,
    tip: roundMoney(tip),
    total: getTotal(adjustedSubtotal, tax, serviceCharge, tip),
  };
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}
