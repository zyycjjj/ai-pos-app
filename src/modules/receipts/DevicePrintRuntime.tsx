import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuthStore } from '@/stores/authStore';

import { getPrintDeviceId, processDevicePrintJobs } from './devicePrintRuntime.service';

const POLL_INTERVAL_MS = 5000;

export function DevicePrintRuntime() {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (Platform.OS !== 'android' || !accessToken) return;
    const deviceId = getPrintDeviceId();
    let stopped = false;
    let processing = false;

    const poll = async () => {
      if (stopped || processing) return;
      processing = true;
      try {
        await processDevicePrintJobs(deviceId);
      } catch {
        // The next bounded poll retries fetching; claimed job errors are acknowledged by the service.
      } finally {
        processing = false;
      }
    };

    void poll();
    const timer = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [accessToken]);

  return null;
}

