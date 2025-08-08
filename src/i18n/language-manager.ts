import { t, isLanguageSupported } from './index';
import { Translations } from './types';

/**
 * Language Manager for handling current language state
 */
export class LanguageManager {
  private currentLanguage: string = 'en';
  private static instance: LanguageManager;

  private constructor() {
    // Try to get language from localStorage or browser
    this.initializeLanguage();
  }

  public static getInstance(): LanguageManager {
    if (!LanguageManager.instance) {
      LanguageManager.instance = new LanguageManager();
    }
    return LanguageManager.instance;
  }

  private initializeLanguage(): void {
    // First priority: Obsidian's current language
    const obsidianLanguage = localStorage.getItem('language');
    if (obsidianLanguage && isLanguageSupported(obsidianLanguage)) {
      this.currentLanguage = obsidianLanguage;
      return;
    }

    // Second priority: Plugin's saved language
    const savedLanguage = localStorage.getItem('ai-assistant-language');
    if (savedLanguage && isLanguageSupported(savedLanguage)) {
      this.currentLanguage = savedLanguage;
      return;
    }

    // Fallback to browser language
    const browserLanguage = navigator.language.split('-')[0];
    if (isLanguageSupported(browserLanguage)) {
      this.currentLanguage = browserLanguage;
    }
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  public setLanguage(language: string): void {
    if (isLanguageSupported(language)) {
      this.currentLanguage = language;
      localStorage.setItem('ai-assistant-language', language);
    }
  }

  public getAvailableLanguages(): Array<{code: string, name: string}> {
		return [
			{ code: 'en', name: 'English' },
			{ code: 'zh', name: '中文' }
		];
	}

  /**
   * Translate a key using the current language
   */
  public translate(key: keyof Translations, params?: Record<string, string>): string {
    return t(key, this.currentLanguage, params);
  }
}

// Export a convenience function for easy access
export function translate(key: keyof Translations, params?: Record<string, string>): string {
  return LanguageManager.getInstance().translate(key, params);
}

// Export the instance for direct access
export const languageManager = LanguageManager.getInstance();

// Export additional convenience functions
export function initializeLanguage(language?: string): void {
  if (language) {
    languageManager.setLanguage(language);
  } else {
    languageManager['initializeLanguage']();
  }
}

export function setLanguage(language: string): void {
  languageManager.setLanguage(language);
}

export function getAvailableLanguages(): Array<{code: string, name: string}> {
  return languageManager.getAvailableLanguages();
}