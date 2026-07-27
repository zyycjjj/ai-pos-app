import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type { PrintJob } from './types';

export type PosPrinter = NonNullable<PrintJob['printer']> & {
  host?: string | null;
  port?: number | null;
  paperWidth?: number;
};

export function usePosPrinters() {
  return useQuery({
    queryKey: ['printers'],
    queryFn: async () => {
      const { data } = await apiClient.get<PosPrinter[]>('/api/print/printers');
      return data;
    },
  });
}

export function useCreateLanPrinter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; code: string; host: string; port: number; type?: 'RECEIPT' | 'KITCHEN' | 'MULTI_PURPOSE' }) => {
      const { data } = await apiClient.post<PosPrinter>('/api/print/printers', {
        name: payload.name,
        code: payload.code,
        type: payload.type ?? 'RECEIPT',
        connectionType: 'LAN',
        host: payload.host,
        port: payload.port,
        paperWidth: 80,
        autoCut: true,
        cashDrawerPulse: false,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['printers'] });
    },
  });
}

export function useTestPosPrinter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (printerId: string) => {
      const { data } = await apiClient.post<PrintJob>(`/api/print/printers/${printerId}/test`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
    },
  });
}

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
