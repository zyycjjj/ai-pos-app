export const LOCAL_API_BASE_URL = 'http://127.0.0.1:4100';
export const ONLINE_API_BASE_URL = 'http://49.235.186.154:4100';

export type ApiPlatform = 'web' | 'android' | 'ios' | string;

export function getApiBaseUrl(platform: ApiPlatform, envValue = process.env.EXPO_PUBLIC_API_BASE_URL) {
  const override = envValue?.trim();

  if (override) {
    return normalizeApiBaseUrl(override);
  }

  return platform === 'web' ? LOCAL_API_BASE_URL : ONLINE_API_BASE_URL;
}

function normalizeApiBaseUrl(value: string) {
  return value.replace(/\/+$/, '').replace(/\/api$/, '');
}
