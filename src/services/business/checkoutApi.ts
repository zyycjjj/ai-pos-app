import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type { CheckoutOrder, CheckoutRefund } from './types';

export function useCreateCheckoutOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      items: Array<{
        productId: string;
        quantity: number;
        modifiers?: Array<{ groupId: string; optionIds: string[] }>;
      }>;
      orderType?: CheckoutOrder['orderType'];
      adjustment?: {
        type: 'discount' | 'percentage_discount' | 'fixed_reduction' | 'price_override';
        value: number;
        reason?: string;
      };
      promoCode?: string;
      selectedPromotionIds?: string[];
      payments: Array<{
        method: 'CASH' | 'CARD' | 'MANUAL';
        amount: number;
        amountReceived?: number;
      }>;
      tax?: number;
      taxRate?: number;
      serviceChargeRate?: number;
      serviceCharge?: number;
      tip?: number;
      currency?: string;
    }) => {
      const { data } = await apiClient.post<CheckoutOrder>('/api/checkout/orders', payload, { timeout: 30_000 });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['metrics', 'today'] });
    },
  });
}

export function useHoldCheckoutOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      items: Array<{
        productId: string;
        quantity: number;
        modifiers?: Array<{ groupId: string; optionIds: string[] }>;
      }>;
      orderType?: CheckoutOrder['orderType'];
      adjustment?: {
        type: 'discount' | 'percentage_discount' | 'fixed_reduction' | 'price_override';
        value: number;
        reason?: string;
      };
      promoCode?: string;
      selectedPromotionIds?: string[];
      taxRate?: number;
      serviceChargeRate?: number;
      tip?: number;
      currency?: string;
    }) => {
      const { data } = await apiClient.post<CheckoutOrder>('/api/checkout/orders/hold', payload, { timeout: 30_000 });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
    },
  });
}

export function useResumeCheckoutOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await apiClient.patch<CheckoutOrder>(`/api/checkout/orders/${orderId}/resume`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
    },
  });
}

export function usePayCheckoutOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      orderId: string;
      payments: Array<{ method: 'CASH' | 'CARD' | 'MANUAL'; amount: number; amountReceived?: number }>;
    }) => {
      const { data } = await apiClient.post<CheckoutOrder>(`/api/checkout/orders/${payload.orderId}/pay`, { payments: payload.payments }, { timeout: 30_000 });
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

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { orderId: string; reason: string }) => {
      const { data } = await apiClient.patch<CheckoutOrder>(`/api/checkout/orders/${payload.orderId}/cancel`, { reason: payload.reason });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['metrics', 'today'] });
    },
  });
}

export function useVoidOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { orderId: string; reason: string; approvedById?: string }) => {
      const { data } = await apiClient.patch<CheckoutOrder>(`/api/checkout/orders/${payload.orderId}/void`, {
        reason: payload.reason,
        approvedById: payload.approvedById,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['metrics', 'today'] });
    },
  });
}

export function useRefundOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      orderId: string;
      idempotencyKey: string;
      reason: string;
      method?: 'CASH' | 'CARD' | 'MANUAL';
      amount?: number;
      items?: Array<{ orderItemId: string; quantity: number }>;
      approvedById?: string;
    }) => {
      const { orderId, ...body } = payload;
      const { data } = await apiClient.post<CheckoutRefund>(`/api/checkout/orders/${orderId}/refunds`, body);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['metrics', 'today'] });
      void queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });
}
