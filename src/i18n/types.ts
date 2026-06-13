import type { en } from './dictionaries/en';

export type SupportedLocale = 'en' | 'zh-CN';

export type TranslationKey = keyof typeof en;

export type TranslationParams = Record<string, string | number>;

export type TranslationDictionary = Record<TranslationKey, string>;

export type CurrencyFormatOptions = {
  currency?: string;
};

export type NumberFormatOptions = Intl.NumberFormatOptions;
