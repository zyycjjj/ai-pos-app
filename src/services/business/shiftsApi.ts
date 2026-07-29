import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type { ManagerApprovalPayload } from './checkoutApi';
import type { Shift } from './types';

export function useActiveShift() {
  return useQuery({
    queryKey: ['shifts', 'active'],
    queryFn: async () => {
      const { data } = await apiClient.get<Shift | null>('/api/shifts/active');
      return data;
    },
  });
}

export function useShifts() {
  return useQuery({
    queryKey: ['shifts', 'list'],
    queryFn: async () => {
      const { data } = await apiClient.get<Shift[]>('/api/shifts');
      return data;
    },
  });
}

export function useOpenShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { openingCash: number; notes?: string }) => {
      const { data } = await apiClient.post<Shift>('/api/shifts/open', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useCashIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { shiftId: string; amount: number; reason: string }) => {
      const { shiftId, ...body } = payload;
      const { data } = await apiClient.post<Shift>(`/api/shifts/${shiftId}/cash-in`, body);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useCashOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { shiftId: string; amount: number; reason: string; managerApproval?: ManagerApprovalPayload }) => {
      const { shiftId, ...body } = payload;
      const { data } = await apiClient.post<Shift>(`/api/shifts/${shiftId}/cash-out`, body);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useCloseShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { shiftId: string; actualCash: number; notes?: string }) => {
      const { shiftId, ...body } = payload;
      const { data } = await apiClient.post<Shift>(`/api/shifts/${shiftId}/close`, body);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}
