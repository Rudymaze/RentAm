'use client';

import type { SupportedLanguage } from '@/features/i18n/types';
import { LANGUAGE_METADATA } from '@/lib/i18n/constants';

interface LanguageRadioGroupProps {
  selectedLanguage: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function LanguageRadioGroup({
  selectedLanguage,
  onChange,
  disabled = false,
  error,
  className = '',
}: LanguageRadioGroupProps) {
  const options: SupportedLanguage[] = ['en', 'fr'];

  return (
    <fieldset className={`space-y-3 ${className}`} disabled={disabled}>
      <legend className="sr-only">Select language</legend>
      {options.map((lang) => {
        const meta = LANGUAGE_METADATA[lang];
        const isSelected = selectedLanguage === lang;
        return (
          <label
            key={lang}
            className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 px-5 py-4 transition-all ${
              isSelected
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-indigo-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="language"
              value={lang}
              checked={isSelected}
              onChange={() => onChange(lang)}
              disabled={disabled}
              className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                {meta.nativeName}
              </p>
              <p className="text-xs text-gray-500">{meta.englishName}</p>
            </div>
          </label>
        );
      })}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </fieldset>
  );
}
