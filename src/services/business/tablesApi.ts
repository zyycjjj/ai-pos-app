import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type { CheckoutOrder, DiningTable } from './types';

export function useCheckoutOrders(status?: CheckoutOrder['status']) {
  return useQuery({
    queryKey: ['checkout', 'orders', status ?? 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<CheckoutOrder[]>('/api/checkout/orders', {
        params: status ? { status } : undefined,
      });
      return data;
    },
    refetchInterval: 3_000,
  });
}

export function useDiningTables() {
  return useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data } = await apiClient.get<DiningTable[]>('/api/tables');
      return data;
    },
    refetchInterval: 3_000,
  });
}

export function useOpenTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { tableId: string; guestCount: number }) => {
      const { data } = await apiClient.post<DiningTable>(`/api/tables/${payload.tableId}/open`, { guestCount: payload.guestCount });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
    },
  });
}

export function useAddTableItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      tableId: string;
      items: Array<{ productId: string; quantity: number; modifiers?: Array<{ groupId: string; optionIds: string[] }> }>;
    }) => {
      const { tableId, ...body } = payload;
      const { data } = await apiClient.post<DiningTable>(`/api/tables/${tableId}/items`, body);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
    },
  });
}

export function useUpdateTableOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { tableId: string; itemId: string; quantity: number }) => {
      const { data } = await apiClient.patch<DiningTable>(`/api/tables/${payload.tableId}/items/${payload.itemId}`, { quantity: payload.quantity });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
    },
  });
}

export function useDeleteTableOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { tableId: string; itemId: string }) => {
      const { data } = await apiClient.post<DiningTable>(`/api/tables/${payload.tableId}/items/${payload.itemId}/delete`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
    },
  });
}

export function useCheckoutTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      tableId: string;
      payments: Array<{ method: 'CASH' | 'CARD' | 'MANUAL'; amount: number; amountReceived?: number }>;
      tip?: number;
    }) => {
      const { tableId, ...body } = payload;
      const { data } = await apiClient.post<DiningTable>(`/api/tables/${tableId}/checkout`, body, { timeout: 30_000 });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['metrics', 'today'] });
    },
  });
}

export function useTransferTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { tableId: string; targetTableId: string }) => {
      const { tableId, ...body } = payload;
      const { data } = await apiClient.post<DiningTable>(`/api/tables/${tableId}/transfer`, body);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
    },
  });
}

export function useClearTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tableId: string) => {
      const { data } = await apiClient.post<DiningTable>(`/api/tables/${tableId}/clear`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}
