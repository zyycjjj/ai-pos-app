export type PrintFlowStatus = 'idle' | 'printing' | 'printed' | 'failed';
export type ModifierSelections = Record<string, string[]>;
export type PaymentMethod = 'CASH' | 'CARD' | 'MANUAL';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'PICKUP';

export type PaymentLineDraft = {
  id: string;
  method: PaymentMethod;
  amountText: string;
  amountReceivedText: string;
};
