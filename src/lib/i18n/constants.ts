import type { LanguageMetadata, SupportedLanguage } from '@/features/i18n/types';

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ['en', 'fr'] as const;
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const LANGUAGE_METADATA: Record<SupportedLanguage, LanguageMetadata> = {
  en: { code: 'en', nativeName: 'English', englishName: 'English' },
  fr: { code: 'fr', nativeName: 'Français', englishName: 'French' },
};
