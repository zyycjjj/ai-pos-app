import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type { TodaySummary } from './types';

export function useTodaySummary() {
  return useQuery({
    queryKey: ['metrics', 'today'],
    queryFn: async () => {
      const { data } = await apiClient.get<TodaySummary>('/api/metrics/today');
      return data;
    },
  });
}