import axios from 'axios';
import { Platform } from 'react-native';

import { getApiBaseUrl } from '@/config/api';
import { useAuthStore } from '@/stores/authStore';

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(Platform.OS),
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
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  },
);
