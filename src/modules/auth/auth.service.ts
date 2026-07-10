import { apiClient } from '@/services/apiClient';
import type { AuthSession } from '@/stores/authStore';
import axios from 'axios';

export async function loginWithPassword(input: { email: string; password: string }) {
  const { data } = await apiClient.post<AuthSession>('/api/auth/login', input);
  return data;
}

export async function fetchCurrentAuthSession() {
  const { data } = await apiClient.get<AuthSession>('/api/auth/me');
  return data;
}

export async function switchActiveStore(storeId: string) {
  const { data } = await apiClient.post<AuthSession>('/api/auth/switch-store', { storeId });
  return data;
}

export function getAuthErrorMessage(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const responseMessage = getResponseMessage(error.response?.data);
  return `${fallbackMessage} (${error.response?.status ?? 'network'}${responseMessage ? `: ${responseMessage}` : ''})`;
}

function getResponseMessage(data: unknown) {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const message = (data as { message?: unknown }).message;
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  return typeof message === 'string' ? message : undefined;
}
