import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';

export type StoreRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'STAFF';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

export type AuthStoreItem = {
  storeId: string;
  storeName: string;
  role: StoreRole;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
  stores: AuthStoreItem[];
  activeStoreId: string;
  role: StoreRole;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  stores: AuthStoreItem[];
  activeStoreId: string | null;
  role: StoreRole | null;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
};

const authStorage = createMMKV({ id: 'ai-pos-auth' });
const authStorageKey = 'session';

function readStoredSession(): AuthSession | null {
  const stored = authStorage.getString(authStorageKey);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as AuthSession;
    return parsed.accessToken && parsed.activeStoreId ? parsed : null;
  } catch {
    return null;
  }
}

const initialSession = readStoredSession();

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initialSession?.accessToken ?? null,
  user: initialSession?.user ?? null,
  stores: initialSession?.stores ?? [],
  activeStoreId: initialSession?.activeStoreId ?? null,
  role: initialSession?.role ?? null,
  setSession: (session) => {
    authStorage.set(authStorageKey, JSON.stringify(session));
    set(session);
  },
  clearSession: () => {
    authStorage.remove(authStorageKey);
    set({
      accessToken: null,
      user: null,
      stores: [],
      activeStoreId: null,
      role: null,
    });
  },
}));
