import { en } from './dictionaries/en';
import { zhCN } from './dictionaries/zh-CN';
import type { SupportedLocale, TranslationDictionary, TranslationKey, TranslationParams } from './types';

export const defaultLocale: SupportedLocale = 'en';

export const supportedLocales: SupportedLocale[] = ['en', 'zh-CN'];

export const dictionaries = {
  en,
  'zh-CN': zhCN,
} satisfies Record<SupportedLocale, TranslationDictionary>;

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

export function translate(locale: SupportedLocale, key: TranslationKey | string, params?: TranslationParams) {
  const dictionary = dictionaries[locale] ?? dictionaries[defaultLocale];
  const template = dictionary[key as TranslationKey] ?? dictionaries[defaultLocale][key as TranslationKey];

  if (!template) {
    return `[missing:${key}]`;
  }

  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

export function createTranslator(locale: SupportedLocale) {
  return (key: TranslationKey | string, params?: TranslationParams) => translate(locale, key, params);
}

export type { CurrencyFormatOptions, NumberFormatOptions, SupportedLocale, TranslationKey, TranslationParams } from './types';
