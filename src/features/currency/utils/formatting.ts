import type {
  CurrencyFormat,
  CurrencyPreferences,
  DecimalSeparator,
  Language,
  PriceValidationResult,
  ThousandsSeparator,
} from '../types';

const FCFA_MIN = 0;
const FCFA_MAX = 10_000_000_000;

export function getDefaultFormat(language: Language): CurrencyFormat {
  return language === 'fr' ? 'suffix' : 'prefix';
}

export function getDefaultDecimalSeparator(language: Language): DecimalSeparator {
  return language === 'fr' ? 'comma' : 'period';
}

export function getDefaultThousandsSeparator(language: Language): ThousandsSeparator {
  return language === 'fr' ? 'space' : 'comma';
}

export function formatPrice(amount: number, preferences: CurrencyPreferences): string {
  const { currencyFormat, currencyDecimalSeparator, currencyThousandsSeparator } = preferences;

  const decimalChar = currencyDecimalSeparator === 'comma' ? ',' : '.';
  const thousandsChar =
    currencyThousandsSeparator === 'space' ? ' '
    : currencyThousandsSeparator === 'comma' ? ','
    : '.';

  const parts = amount.toFixed(0).split('');
  const intPart = parts.join('');

  // Insert thousands separator
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsChar);
  const numberStr = `${formatted}${decimalChar}00`;

  return currencyFormat === 'prefix' ? `FCFA ${numberStr}` : `${numberStr} FCFA`;
}

export function validatePrice(amount: number): PriceValidationResult {
  const warnings: string[] = [];

  if (amount < FCFA_MIN) {
    return { valid: false, amount, formatted: '', warnings: ['Price cannot be negative'] };
  }

  if (amount > FCFA_MAX) {
    return { valid: false, amount, formatted: '', warnings: ['Price exceeds maximum allowed value'] };
  }

  const defaultPrefs: CurrencyPreferences = {
    currencyFormat: 'suffix',
    currencyDecimalSeparator: 'comma',
    currencyThousandsSeparator: 'space',
    preferredLanguage: 'fr',
  };

  if (amount === 0) warnings.push('Price is zero');
  if (amount < 10_000) warnings.push('Price seems unusually low for FCFA');

  return {
    valid: true,
    amount,
    formatted: formatPrice(amount, defaultPrefs),
    warnings,
  };
}
