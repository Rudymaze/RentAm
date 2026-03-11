export type CurrencyFormat = 'prefix' | 'suffix';
export type DecimalSeparator = 'period' | 'comma';
export type ThousandsSeparator = 'space' | 'comma' | 'period';
export type Language = 'en' | 'fr';

export interface PriceRange {
  min: number;
  max: number;
}

export interface PriceGuide {
  studioApartmentMonthly: PriceRange;
  oneBedroomMonthly: PriceRange;
  twoBedroomMonthly: PriceRange;
  houseMonthly: PriceRange;
  villaMonthly: PriceRange;
  commercialMonthly: PriceRange;
}

export interface CurrencyPreferences {
  currencyFormat: CurrencyFormat;
  currencyDecimalSeparator: DecimalSeparator;
  currencyThousandsSeparator: ThousandsSeparator;
  preferredLanguage: Language;
}

export interface ExchangeRateData {
  fcfaToUsd: number;
  fcfaToEur: number;
  lastUpdated: Date;
  priceGuide: PriceGuide;
}

export interface PriceValidationResult {
  valid: boolean;
  amount: number;
  formatted: string;
  warnings: string[];
}

export interface FormattedPrice {
  formatted: string;
  amount: number;
  language: Language;
  format: CurrencyFormat;
}

export interface Translation {
  key: string;
  value: string;
}

export interface TranslationCategory {
  language: Language;
  translations: Record<string, string>;
}
