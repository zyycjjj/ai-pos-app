import { createMMKV } from 'react-native-mmkv';

import { printerModule } from '@/native/printer/PrinterModule';
import {
  claimDevicePrintJob,
  fetchDevicePrintJobs,
  markDevicePrintJobFailed,
  markDevicePrintJobSucceeded,
} from '@/services/businessApi';

const storage = createMMKV({ id: 'ai-pos-print-runtime' });
const deviceIdKey = 'device-id';

export function getPrintDeviceId() {
  const existing = storage.getString(deviceIdKey);
  if (existing) return existing;
  const generated = `terminal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  storage.set(deviceIdKey, generated);
  return generated;
}

export async function processDevicePrintJobs(deviceId: string) {
  const jobs = await fetchDevicePrintJobs(deviceId);
  const results: Array<{ id: string; status: 'SUCCEEDED' | 'FAILED' }> = [];

  for (const pendingJob of jobs) {
    try {
      const job = await claimDevicePrintJob(pendingJob.id, deviceId);
      if (!job.renderedText) {
        throw new Error('Print job has no rendered document.');
      }
      await printerModule.printText(job.renderedText);
      await markDevicePrintJobSucceeded(job.id, deviceId);
      results.push({ id: job.id, status: 'SUCCEEDED' });
    } catch (error) {
      const message = sanitizePrintError(error);
      await markDevicePrintJobFailed(pendingJob.id, deviceId, message).catch(() => undefined);
      results.push({ id: pendingJob.id, status: 'FAILED' });
    }
  }

  return results;
}

function sanitizePrintError(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).slice(0, 1000);
}

