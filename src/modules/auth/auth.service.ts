import { apiClient } from '@/services/apiClient';
import type { AuthSession } from '@/stores/authStore';

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
