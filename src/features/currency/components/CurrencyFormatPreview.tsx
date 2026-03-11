'use client';

import type { CurrencyPreferences } from '@/features/currency/types';
import { formatPrice } from '@/features/currency/utils/formatting';

interface CurrencyFormatPreviewProps {
  amount: number;
  preferences: CurrencyPreferences;
  className?: string;
}

const ALT_PREFERENCES: CurrencyPreferences = {
  currencyFormat: 'suffix',
  currencyDecimalSeparator: 'comma',
  currencyThousandsSeparator: 'space',
  preferredLanguage: 'fr',
};

export function CurrencyFormatPreview({ amount, preferences, className = '' }: CurrencyFormatPreviewProps) {
  const currentFormatted = formatPrice(amount, preferences);

  // Build alt preferences: flip format for comparison
  const altPrefs: CurrencyPreferences = {
    ...ALT_PREFERENCES,
    currencyFormat: preferences.currencyFormat === 'prefix' ? 'suffix' : 'prefix',
  };
  const altFormatted = formatPrice(amount, altPrefs);

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <div className="rounded-xl border-2 border-indigo-400 bg-indigo-50 p-4 text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-500">
          Current
        </p>
        <p className="text-lg font-bold text-indigo-700 break-all">{currentFormatted}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Alternative
        </p>
        <p className="text-lg font-bold text-gray-600 break-all">{altFormatted}</p>
      </div>
    </div>
  );
}
