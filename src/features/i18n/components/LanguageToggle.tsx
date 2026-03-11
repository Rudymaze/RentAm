'use client';

import type { SupportedLanguage } from '@/features/i18n/types';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/constants';

interface LanguageToggleProps {
  language: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
  disabled?: boolean;
  className?: string;
}

export function LanguageToggle({ language, onChange, disabled = false, className = '' }: LanguageToggleProps) {
  return (
    <div
      className={`inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 ${className}`}
      role="group"
      aria-label="Select language"
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          disabled={disabled}
          aria-pressed={language === lang}
          className={`rounded-md px-3 py-1 text-xs font-semibold uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            language === lang
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
