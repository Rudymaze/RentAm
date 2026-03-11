'use client';

import type { CurrencyPreferences } from '@/features/currency/types';
import { formatPrice, getDefaultFormat, getDefaultDecimalSeparator, getDefaultThousandsSeparator } from '@/features/currency/utils/formatting';

const DEFAULT_PREFERENCES: CurrencyPreferences = {
  currencyFormat: getDefaultFormat('en'),
  currencyDecimalSeparator: getDefaultDecimalSeparator('en'),
  currencyThousandsSeparator: getDefaultThousandsSeparator('en'),
  preferredLanguage: 'en',
};

interface PriceDisplayProps {
  amount: number;
  preferences?: CurrencyPreferences;
  loading?: boolean;
  className?: string;
}

export function PriceDisplay({ amount, preferences, loading = false, className = '' }: PriceDisplayProps) {
  if (loading) {
    return (
      <span
        className={`inline-block h-5 w-24 animate-pulse rounded bg-gray-200 ${className}`}
        aria-label="Loading price"
      />
    );
  }

  const prefs = preferences ?? DEFAULT_PREFERENCES;
  const formatted = formatPrice(amount, prefs);

  return (
    <span className={`font-medium tabular-nums ${className}`}>
      {formatted}
    </span>
  );
}
