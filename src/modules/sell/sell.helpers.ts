import type { ProductModifierGroup, SelectedModifier } from '@/types/modifiers';

import type { ProductDto } from '../products/products.service';
import type { ModifierSelections, PaymentLineDraft, PaymentMethod, PrintFlowStatus } from './sell.types';
import type { OrderAdjustment } from './checkoutMath';

export function getModifierTotal(product: ProductDto, selections: ModifierSelections) {
  const modifierDelta = getSelectedModifiers(product.modifierGroups, selections).reduce((sum, modifier) => sum + modifier.priceDelta, 0);
  return Number((Number(product.price) + modifierDelta).toFixed(2));
}

export function isModifierSelectionComplete(groups: ProductModifierGroup[], selections: ModifierSelections) {
  return groups.every((group) => {
    const count = (selections[group.id] ?? []).length;
    return count >= (group.minSelect ?? (group.required ? 1 : 0)) && count <= (group.maxSelect ?? (group.multiSelect ? Number.MAX_SAFE_INTEGER : 1));
  });
}

export function isProductSoldOut(product: ProductDto) {
  return product.availabilityStatus === 'SOLD_OUT';
}

export function getSelectedModifiers(groups: ProductModifierGroup[], selections: ModifierSelections): SelectedModifier[] {
  return groups.flatMap((group) => {
    const optionIds = selections[group.id] ?? [];
    return group.options
      .filter((option) => optionIds.includes(option.id) && option.status !== 'SOLD_OUT')
      .map((option) => ({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionName: option.name,
        priceDelta: option.priceDelta,
      }));
  });
}

export function toCheckoutModifierSelections(modifiers: SelectedModifier[]) {
  const grouped = new Map<string, string[]>();
  for (const modifier of modifiers) {
    grouped.set(modifier.groupId, [...(grouped.get(modifier.groupId) ?? []), modifier.optionId]);
  }
  return Array.from(grouped, ([groupId, optionIds]) => ({ groupId, optionIds }));
}

export function createPaymentLine(method: PaymentMethod, amount: number, amountReceived = amount): PaymentLineDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    method,
    amountText: String(roundMoney(amount)),
    amountReceivedText: method === 'CASH' ? String(roundMoney(amountReceived)) : '',
  };
}

export function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export function paymentMethodLabel(method: PaymentMethod | null, t: (key: string) => string) {
  switch (method) {
    case 'CASH':
      return t('payment.cash');
    case 'CARD':
      return t('payment.card');
    case 'MANUAL':
      return t('payment.manual');
    default:
      return '-';
  }
}

export function formatAdjustmentLabel(adjustment: OrderAdjustment, money: (value: number) => string) {
  if (adjustment.type === 'discount') {
    return `${adjustment.value}%`;
  }
  if (adjustment.type === 'fixed_reduction') {
    return `-${money(adjustment.value)}`;
  }
  return money(adjustment.value);
}

export function printStatusLabel(status: PrintFlowStatus, t: (key: string) => string) {
  switch (status) {
    case 'printing':
      return t('sell.payment.status.printing');
    case 'printed':
      return t('sell.payment.status.printed');
    case 'failed':
      return t('sell.payment.status.failed');
    default:
      return t('sell.payment.status.notPrinted');
  }
}

export function isManagerApprovalError(error: unknown) {
  const candidate = error as { response?: { data?: { code?: string; message?: string | string[] } } };
  const data = candidate.response?.data;
  return data?.code === 'MANAGER_APPROVAL_REQUIRED' || String(data?.message ?? '').includes('Manager approval');
}

export function resolvePaymentErrorKey(error: unknown) {
  const candidate = error as { response?: { data?: { code?: string } } };
  if (candidate.response?.data?.code === 'PROMO_CODE_NOT_ELIGIBLE_FOR_CUSTOMER') {
    return 'payment.validation.customerPromoNotEligible';
  }
  return 'payment.validation.submitFailed';
}

export function resolvePromotionPreviewReasonKey(reasonCode?: string) {
  if (reasonCode === 'CUSTOMER_REQUIRED') return 'payment.preview.customerRequired';
  if (reasonCode === 'CUSTOMER_NOT_IN_SEGMENT' || reasonCode === 'PROMO_CODE_NOT_ELIGIBLE_FOR_CUSTOMER') {
    return 'payment.validation.customerPromoNotEligible';
  }
  if (reasonCode === 'ORDER_THRESHOLD_NOT_MET') return 'payment.preview.thresholdNotMet';
  if (reasonCode === 'PRODUCT_NOT_MATCHED') return 'payment.preview.productNotMatched';
  if (reasonCode === 'USAGE_LIMIT_REACHED') return 'payment.preview.usageLimitReached';
  if (reasonCode === 'PROMO_CODE_NOT_MATCHED') return 'payment.preview.codeNotMatched';
  return 'payment.preview.notAvailable';
}

export function createPromotionPreviewInputHash(input: {
  lineIds: string[];
  promoCode: string;
  customerId?: string | null;
  customerPhone: string;
  adjustment?: OrderAdjustment | null;
  tipAmount: number;
}) {
  return JSON.stringify({
    lineIds: input.lineIds,
    promoCode: input.promoCode.trim().toUpperCase(),
    customerId: input.customerId ?? null,
    customerPhone: input.customerPhone.trim(),
    adjustment: input.adjustment ?? null,
    tipAmount: roundMoney(input.tipAmount),
  });
}
