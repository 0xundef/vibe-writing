# Internationalization (i18n) System

This directory contains the internationalization system for the Vibe Writing plugin, with modular language files and translation management utilities.

## Structure

```
src/i18n/
├── types.ts          # TypeScript interfaces for translations
├── en.ts             # English translations (reference language)
├── zh.ts             # Chinese translations
├── index.ts          # Main i18n module with utility functions
├── diff-checker.ts   # Translation diff checking utilities
└── README.md         # This documentation
```

## Usage

### Basic Translation

```typescript
import { t } from './i18n';

// Get translation for current language
const message = t('notice.no-selection', 'zh');

// With parameters
const confirmMsg = t('confirm.delete-suggestion', 'zh', { name: '建议名称' });
```

### Language Management

```typescript
import { getAvailableLanguages, getLanguageNames, isLanguageSupported } from './i18n';

// Get all available language codes
const languages = getAvailableLanguages(); // ['en', 'zh']

// Get language display names
const names = getLanguageNames(); // { en: 'English', zh: '中文' }

// Check if language is supported
const isSupported = isLanguageSupported('zh'); // true
```

## Translation Diff Checking

The system includes powerful utilities to check translation completeness across languages, using English as the reference language.

### Check Translation Differences

```typescript
import { checkTranslationDiff, printTranslationDiff } from './i18n';

// Get detailed diff report
const report = checkTranslationDiff();
console.log(report);

// Print formatted report to console
printTranslationDiff();
```

### Example Output

```
=== Translation Diff Report ===
Reference Language: en
Total Reference Keys: 45

--- ZH ---
Completeness: 95.6% (43/45 keys)

❌ Missing Keys (2):
  - notice.request-timeout
  - settings.img-quality-desc

⚠️  Extra Keys (0):

=== Summary ===
❌ Missing 2 required keys
```

### Get Missing Keys for Specific Language

```typescript
import { getMissingKeys, generateMissingTemplate } from './i18n';

// Get array of missing keys
const missing = getMissingKeys('zh');
console.log(missing); // ['notice.request-timeout', 'settings.img-quality-desc']

// Generate template for missing translations
const template = generateMissingTemplate('zh');
console.log(template);
```

### Template Output

```typescript
// Missing translations for zh:

  'notice.request-timeout': 'AI request timed out. Please try again.', // TODO: Translate
  'settings.img-quality-desc': 'Quality of compressed images (0.1-1.0)', // TODO: Translate
```

## Adding New Languages

1. Create a new language file (e.g., `fr.ts`):

```typescript
import { Translations } from './types';

export const fr: Translations = {
  'command.written-improvement': 'Amélioration de l\'écriture',
  // ... other translations
};
```

2. Update `index.ts` to include the new language:

```typescript
import { fr } from './fr';

const translations: Record<string, Translations> = {
  en,
  zh,
  fr, // Add new language
};
```

3. Update language names:

```typescript
export function getLanguageNames(): Record<string, string> {
  return {
    en: 'English',
    zh: '中文',
    fr: 'Français', // Add display name
  };
}
```

4. Use the diff checker to ensure completeness:

```typescript
printTranslationDiff(); // Check for missing translations
```

## Best Practices

1. **Use English as Reference**: Always keep English translations complete and up-to-date as other languages are compared against it.

2. **Regular Diff Checking**: Run `printTranslationDiff()` regularly during development to catch missing translations.

3. **Consistent Key Naming**: Use descriptive, hierarchical keys (e.g., `notice.error-occurred`, `settings.api-key`).

4. **Parameter Support**: Use `{paramName}` syntax for dynamic content in translations.

5. **Type Safety**: The `Translations` interface ensures all languages have the same structure.

## Development Workflow

1. Add new translation keys to `types.ts` interface
2. Add English translations to `en.ts`
3. Run diff checker to identify missing translations in other languages
4. Update other language files
5. Verify completeness with `printTranslationDiff()`

This system ensures consistent, maintainable internationalization across the entire plugin.