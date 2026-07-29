import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type { KitchenStation, KitchenTicket, KitchenTicketPreview, KitchenTicketStatus, PrintJob } from './types';

export function useKitchenStations() {
  return useQuery({
    queryKey: ['kitchen', 'stations'],
    queryFn: async () => {
      const { data } = await apiClient.get<KitchenStation[]>('/api/kitchen/stations');
      return data;
    },
  });
}

export function useKitchenTickets(filters: { stationId?: string; status?: KitchenTicketStatus | ''; take?: number } = {}) {
  return useQuery({
    queryKey: ['kitchen', 'tickets', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<KitchenTicket[]>('/api/kitchen/tickets', { params: filters });
      return data;
    },
    refetchInterval: 3_000,
  });
}

export function useKitchenTicketHistory(filters: { stationId?: string; status?: KitchenTicketStatus | ''; take?: number } = {}) {
  return useQuery({
    queryKey: ['kitchen', 'tickets', 'history', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<KitchenTicket[]>('/api/kitchen/tickets/history', { params: filters });
      return data;
    },
    refetchInterval: 10_000,
  });
}

function useTicketAction(path: (id: string) => string, method: 'patch' | 'post' = 'patch') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = method === 'patch' ? await apiClient.patch<KitchenTicket>(path(id)) : await apiClient.post<KitchenTicket>(path(id));
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['kitchen'] });
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
    },
  });
}

export function useStartKitchenTicket() {
  return useTicketAction((id) => `/api/kitchen/tickets/${id}/start`);
}

export function useReadyKitchenTicket() {
  return useTicketAction((id) => `/api/kitchen/tickets/${id}/ready`);
}

export function useCancelKitchenTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; reason: string }) => {
      const { data } = await apiClient.patch<KitchenTicket>(`/api/kitchen/tickets/${payload.id}/cancel`, { reason: payload.reason });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['kitchen'] });
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
    },
  });
}

export function useReprintKitchenTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<PrintJob>(`/api/print/kitchen-tickets/${id}`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
    },
  });
}

export function usePreviewKitchenTicket() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.get<KitchenTicketPreview>(`/api/kitchen/tickets/${id}/preview`);
      return data;
    },
  });
}
