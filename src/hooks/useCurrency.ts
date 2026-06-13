import { formatCurrencyForLocale } from '@/i18n/format';
import { useLocaleStore } from '@/stores/localeStore';

export function useCurrency(currency = 'USD') {
  const locale = useLocaleStore((state) => state.locale);

  return (amount: number) => formatCurrencyForLocale(locale, amount, { currency });
}
