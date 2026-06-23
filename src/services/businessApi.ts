import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from './apiClient';
import type { SelectedModifier } from '@/types/modifiers';

export type CheckoutOrderItem = {
  id: string;
  productId: string;
  name: string;
  category?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  modifiers: SelectedModifier[];
};

export type CheckoutPaymentLine = {
  id?: string;
  method: 'CASH' | 'CARD' | 'MANUAL';
  amount: number;
  amountReceived: number | null;
  changeDue: number | null;
};

export type CheckoutOrder = {
  id: string;
  orderNumber: string;
  pickupNumber: string | null;
  status: 'OPEN' | 'PAID' | 'CANCELLED';
  printStatus: 'NOT_PRINTED' | 'PRINTING' | 'PRINTED' | 'FAILED';
  paymentMethod: 'CASH' | 'CARD' | 'MANUAL' | null;
  currency: string;
  subtotal: number;
  adjustment: number;
  adjustmentType: 'discount' | 'fixed_reduction' | 'price_override' | null;
  adjustmentValue: number | null;
  tax: number;
  tip: number;
  total: number;
  cashReceived: number | null;
  changeDue: number | null;
  paidAt: string | null;
  printedAt: string | null;
  createdAt: string;
  payments: CheckoutPaymentLine[];
  items: CheckoutOrderItem[];
};

export type TodaySummary = {
  salesTotal: number;
  orderCount: number;
  averageTicket: number;
  activeProducts: number;
  recentOrders: Array<Pick<CheckoutOrder, 'id' | 'orderNumber' | 'status' | 'total' | 'createdAt'>>;
};

export type AiMenuDraft = {
  id: string;
  prompt: string;
  structuredJson: {
    currency: string;
    items: Array<{
      name: string;
      category: string;
      price: number;
      currency: string;
    }>;
  };
  status: 'DRAFT' | 'CONFIRMED' | 'DISCARDED';
  createdAt: string;
};

export type ReceiptPayload = {
  format: string;
  store: { name: string };
  order: Pick<CheckoutOrder, 'id' | 'orderNumber' | 'status' | 'printStatus' | 'createdAt' | 'paidAt' | 'printedAt'>;
  currency: string;
  items: Array<Pick<CheckoutOrderItem, 'name' | 'quantity' | 'unitPrice' | 'lineTotal'>>;
  totals: Pick<CheckoutOrder, 'subtotal' | 'tax' | 'tip' | 'total'>;
  payments: CheckoutPaymentLine[];
  footer: {
    message: string;
    qrPayload: string;
  };
};

export function useTodaySummary() {
  return useQuery({
    queryKey: ['metrics', 'today'],
    queryFn: async () => {
      const { data } = await apiClient.get<TodaySummary>('/api/metrics/today');
      return data;
    },
  });
}

export function useCheckoutOrders(status?: CheckoutOrder['status']) {
  return useQuery({
    queryKey: ['checkout', 'orders', status ?? 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<CheckoutOrder[]>('/api/checkout/orders', {
        params: status ? { status } : undefined,
      });
      return data;
    },
  });
}

export function useCreateCheckoutOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      items: Array<{
        productId: string;
        quantity: number;
        modifiers?: Array<{ groupId: string; optionIds: string[] }>;
      }>;
      adjustment?: {
        type: 'discount' | 'fixed_reduction' | 'price_override';
        value: number;
      };
      payments: Array<{
        method: 'CASH' | 'CARD' | 'MANUAL';
        amount: number;
        amountReceived?: number;
      }>;
      tax?: number;
      tip?: number;
      currency?: string;
    }) => {
      const { data } = await apiClient.post<CheckoutOrder>('/api/checkout/orders', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['metrics', 'today'] });
    },
  });
}

export function useMarkOrderPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await apiClient.patch<CheckoutOrder>(`/api/checkout/orders/${orderId}/mark-paid`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['metrics', 'today'] });
    },
  });
}

export function useMarkOrderPrinted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await apiClient.patch<CheckoutOrder>(`/api/checkout/orders/${orderId}/mark-printed`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });
}

export function useCreateMenuDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { prompt: string; currency?: string }) => {
      const { data } = await apiClient.post<AiMenuDraft>('/api/ai/menu-drafts', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai', 'menu-drafts'] });
    },
  });
}

export function useConfirmMenuDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draftId: string) => {
      const { data } = await apiClient.patch(`/api/ai/menu-drafts/${draftId}/confirm`, {});
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai', 'menu-drafts'] });
      void queryClient.invalidateQueries({ queryKey: ['zenstack'] });
    },
  });
}

export function useReceipt(orderId?: string) {
  return useQuery({
    queryKey: ['receipts', orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      const { data } = await apiClient.get<ReceiptPayload>(`/api/receipts/orders/${orderId}`);
      return data;
    },
  });
}
