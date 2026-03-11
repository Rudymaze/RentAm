export type SupportedLanguage = 'en' | 'fr';

export interface LanguageMetadata {
  code: SupportedLanguage;
  nativeName: string;
  englishName: string;
}

export interface Translation {
  id: string;
  key: string;
  contentEn: string;
  contentFr: string;
  category: string;
  context?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranslationResponse {
  success: boolean;
  data: {
    language: SupportedLanguage;
    translations: Record<string, string>;
  };
}

export interface TranslationByKeyResponse {
  success: boolean;
  data: {
    key: string;
    contentEn: string;
    contentFr: string;
    language: SupportedLanguage;
  };
}

export interface CategoryTranslationsResponse {
  success: boolean;
  data: {
    category: string;
    language: SupportedLanguage;
    translations: Record<string, string>;
  };
}

export interface LanguagePreference {
  preferredLanguage: SupportedLanguage;
  updatedAt: Date;
}
