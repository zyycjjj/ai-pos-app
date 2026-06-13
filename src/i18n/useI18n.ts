import { useMemo } from 'react';

import { formatCurrencyForLocale, formatNumberForLocale } from './format';
import { createTranslator } from './index';
import type { CurrencyFormatOptions, NumberFormatOptions } from './types';
import { useLocaleStore } from '@/stores/localeStore';

export function useI18n() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  const t = useMemo(() => createTranslator(locale), [locale]);

  return {
    locale,
    setLocale,
    t,
    formatCurrency: (value: number, options?: CurrencyFormatOptions) => formatCurrencyForLocale(locale, value, options),
    formatNumber: (value: number, options?: NumberFormatOptions) => formatNumberForLocale(locale, value, options),
  };
}
