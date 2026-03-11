'use client';

interface LanguageToggleProps {
  currentLanguage: 'en' | 'fr';
  onChange: (lang: 'en' | 'fr') => void;
  className?: string;
}

export function LanguageToggle({ currentLanguage, onChange, className = '' }: LanguageToggleProps) {
  return (
    <div
      className={`inline-flex rounded-md border border-gray-200 bg-gray-100 p-0.5 ${className}`}
      role="group"
      aria-label="Display language"
    >
      {(['en', 'fr'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          aria-pressed={currentLanguage === lang}
          className={`rounded px-2.5 py-1 text-xs font-semibold uppercase transition ${
            currentLanguage === lang
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
