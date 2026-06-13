import type { CurrencyFormatOptions, NumberFormatOptions, SupportedLocale } from './types';

export const localeToIntlLocale: Record<SupportedLocale, string> = {
  en: 'en-US',
  'zh-CN': 'zh-CN',
};

export function formatCurrencyForLocale(locale: SupportedLocale, amount: number, options?: CurrencyFormatOptions) {
  return new Intl.NumberFormat(localeToIntlLocale[locale], {
    style: 'currency',
    currency: options?.currency ?? 'USD',
  }).format(amount);
}

export function formatNumberForLocale(locale: SupportedLocale, value: number, options?: NumberFormatOptions) {
  return new Intl.NumberFormat(localeToIntlLocale[locale], options).format(value);
}
