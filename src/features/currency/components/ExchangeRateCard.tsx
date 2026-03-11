'use client';

import type { ExchangeRateData } from '@/features/currency/types';

interface ExchangeRateCardProps {
  exchangeRates?: ExchangeRateData;
  loading?: boolean;
  className?: string;
}

function Skeleton() {
  return <span className="inline-block h-4 w-20 animate-pulse rounded bg-gray-200" />;
}

export function ExchangeRateCard({ exchangeRates, loading = false, className = '' }: ExchangeRateCardProps) {
  const rates = [
    { label: 'USD', value: exchangeRates ? `1 USD = ${Math.round(1 / exchangeRates.fcfaToUsd).toLocaleString()} FCFA` : null },
    { label: 'EUR', value: exchangeRates ? `1 EUR = ${Math.round(1 / exchangeRates.fcfaToEur).toLocaleString()} FCFA` : null },
  ];

  return (
    <div className={`rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Exchange Rates</h3>
        {loading ? (
          <Skeleton />
        ) : exchangeRates ? (
          <p className="text-xs text-gray-400">
            Updated {exchangeRates.lastUpdated.toLocaleDateString()}
          </p>
        ) : null}
      </div>

      <div className="divide-y divide-gray-100">
        {rates.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-gray-600">{label}</span>
            {loading ? (
              <Skeleton />
            ) : value ? (
              <span className="text-sm font-semibold text-gray-900 tabular-nums">{value}</span>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
