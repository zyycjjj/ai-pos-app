import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type { ReceiptPayload, RefundReceiptPayload } from './types';

export function useReceipt(orderId?: string) {
  return useQuery({
    queryKey: ['receipts', orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      return fetchReceiptPayload(orderId);
    },
  });
}

export async function fetchReceiptPayload(orderId?: string) {
  if (!orderId) {
    throw new Error('Order id is required to fetch receipt payload.');
  }

  const { data } = await apiClient.get<ReceiptPayload>(`/api/receipts/orders/${orderId}`);
  return data;
}

export async function fetchRefundReceiptPayload(refundId: string) {
  const { data } = await apiClient.get<RefundReceiptPayload>(`/api/receipts/refunds/${refundId}`);
  return data;
}