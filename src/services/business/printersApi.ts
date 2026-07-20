import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type { PrintJob } from './types';

export function usePrintOrderReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await apiClient.post<PrintJob>(`/api/print/orders/${orderId}/receipt`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
    },
  });
}

export function useReprintOrderReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await apiClient.post<PrintJob>(`/api/print/orders/${orderId}/reprint`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
    },
  });
}

export function usePrintRefundReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (refundId: string) => {
      const { data } = await apiClient.post<PrintJob>(`/api/print/refunds/${refundId}`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
    },
  });
}

export function usePrintShiftSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftId: string) => {
      const { data } = await apiClient.post<PrintJob>(`/api/print/shifts/${shiftId}/summary`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
    },
  });
}

export function useReprintPrintJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data } = await apiClient.post<PrintJob>(`/api/print/jobs/${jobId}/reprint`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
    },
  });
}

export async function fetchDevicePrintJobs(deviceId: string) {
  const { data } = await apiClient.get<Array<PrintJob & { deviceId: string }>>('/api/print/device/jobs', {
    headers: { 'X-Device-Id': deviceId },
  });
  return data;
}

export async function claimDevicePrintJob(jobId: string, deviceId: string) {
  const { data } = await apiClient.post<PrintJob>(`/api/print/device/jobs/${jobId}/claim`, undefined, {
    headers: { 'X-Device-Id': deviceId },
  });
  return data;
}

export async function markDevicePrintJobSucceeded(jobId: string, deviceId: string) {
  const { data } = await apiClient.post<PrintJob>(`/api/print/device/jobs/${jobId}/success`, undefined, {
    headers: { 'X-Device-Id': deviceId },
  });
  return data;
}

export async function markDevicePrintJobFailed(jobId: string, deviceId: string, error: string) {
  const { data } = await apiClient.post<PrintJob>(`/api/print/device/jobs/${jobId}/fail`, { error }, {
    headers: { 'X-Device-Id': deviceId },
  });
  return data;
}
