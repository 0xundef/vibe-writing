import { Translations } from './types';
import { en } from './en';
import { zh } from './zh';

const translations: Record<string, Translations> = {
  en,
  zh,
};

/**
 * Get translated text for a given key and language
 * @param key - Translation key
 * @param language - Language code (defaults to 'en')
 * @param params - Parameters to replace in the translation string
 * @returns Translated string
 */
export function t(key: keyof Translations, language: string = 'en', params?: Record<string, string>): string {
  let translation = translations[language]?.[key] || translations.en[key] || key;
  
  // Replace parameters in the translation string
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      translation = translation.replace(`{${param}}`, value);
    });
  }
  
  return translation;
}

/**
 * Get all available language codes
 * @returns Array of language codes
 */
export function getAvailableLanguages(): string[] {
  return Object.keys(translations);
}

/**
 * Get language display names
 * @returns Record of language codes to display names
 */
export function getLanguageNames(): Record<string, string> {
  return {
    en: 'English',
    zh: '中文',
  };
}

/**
 * Check if a language is supported
 * @param language - Language code to check
 * @returns True if language is supported
 */
export function isLanguageSupported(language: string): boolean {
  return language in translations;
}

export type { Translations } from './types';