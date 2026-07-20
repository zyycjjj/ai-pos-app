import axios from 'axios';
import { Platform } from 'react-native';

import { getApiBaseUrl } from '@/config/api';
import { useAuthStore } from '@/stores/authStore';

const apiBaseUrl = getApiBaseUrl(Platform.OS);
const enableApiDebugLogs = process.env.NODE_ENV !== 'production';

if (enableApiDebugLogs) {
  console.info('[AI-POS API] baseURL', apiBaseUrl);
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 12000,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken, activeStoreId } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (activeStoreId) {
    config.headers['X-Store-Id'] = activeStoreId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (enableApiDebugLogs && response.config.url?.includes('/api/auth/login')) {
      console.info('[AI-POS API] login response', {
        url: `${response.config.baseURL ?? ''}${response.config.url ?? ''}`,
        status: response.status,
        data: redactAuthResponse(response.data),
      });
    }
    return response;
  },
  (error) => {
    if (enableApiDebugLogs && axios.isAxiosError(error)) {
      console.warn('[AI-POS API] request failed', {
        url: `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    if (error?.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  },
);

function redactAuthResponse(data: unknown) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  return {
    ...(data as Record<string, unknown>),
    accessToken: '<redacted>',
  };
}
