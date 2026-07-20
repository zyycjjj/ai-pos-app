import { useMutation } from '@tanstack/react-query';

import { apiClient } from '../apiClient';
import type { CustomerProfile } from './types';

export function useLookupCustomer() {
  return useMutation({
    mutationFn: async (phone: string) => {
      const { data } = await apiClient.get<CustomerProfile | null>('/api/customers/lookup', { params: { phone } });
      return data;
    },
  });
}

export function useQuickCreateCustomer() {
  return useMutation({
    mutationFn: async (payload: { phone: string; name?: string }) => {
      const { data } = await apiClient.post<CustomerProfile>('/api/customers/quick-create', payload);
      return data;
    },
  });
}
