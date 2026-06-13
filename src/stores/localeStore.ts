import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import { defaultLocale, isSupportedLocale } from '@/i18n';
import type { SupportedLocale } from '@/i18n';

const localeStorage = createMMKV({ id: 'ai-pos-locale' });
const localeStorageKey = 'locale';

type LocaleState = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
};

function readInitialLocale(): SupportedLocale {
  const storedLocale = localeStorage.getString(localeStorageKey);
  return isSupportedLocale(storedLocale) ? storedLocale : defaultLocale;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: readInitialLocale(),
  setLocale: (locale) => {
    localeStorage.set(localeStorageKey, locale);
    set({ locale });
  },
}));
