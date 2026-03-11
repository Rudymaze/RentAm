'use client';

import { useState, useCallback } from 'react';
import type { ListingType } from '../types';

interface PricingSectionProps {
  listingType: ListingType;
  rentalPrice: number | null;
  salePrice: number | null;
  onPriceChange: (price: number | null, type: 'rental' | 'sale') => void;
  onListingTypeChange: (type: ListingType) => void;
}

export function PricingSection({
  listingType,
  rentalPrice,
  salePrice,
  onPriceChange,
  onListingTypeChange,
}: PricingSectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const currentPrice = listingType === 'rent' ? rentalPrice : salePrice;
  const priceType = listingType === 'rent' ? 'rental' : 'sale';

  const validatePrice = useCallback(
    async (value: number) => {
      setIsValidating(true);
      setError(null);
      try {
        const res = await fetch('/api/currency/validate-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: value, currency: 'FCFA', context: 'listing' }),
        });
        const json = await res.json();
        if (!json.success || !json.data?.valid) {
          const msg = json.data?.warnings?.[0] ?? json.error ?? 'Invalid price';
          setError(msg);
        } else if (json.data?.warnings?.length) {
          setError(json.data.warnings[0]);
        }
      } catch {
        // Network errors are non-blocking
      } finally {
        setIsValidating(false);
      }
    },
    []
  );

  function handlePriceInput(raw: string) {
    if (raw === '' || raw === '0') {
      onPriceChange(null, priceType);
      setError(null);
      return;
    }
    const parsed = parseInt(raw.replace(/\D/g, ''), 10);
    if (isNaN(parsed)) return;
    onPriceChange(parsed, priceType);
    validatePrice(parsed);
  }

  return (
    <div className="space-y-4">
      {/* Rent / Sale toggle */}
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1">
        {(['rent', 'sale'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { onListingTypeChange(t); setError(null); }}
            className={`rounded-md px-5 py-1.5 text-sm font-semibold capitalize transition-colors ${
              listingType === t
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            For {t === 'rent' ? 'Rent' : 'Sale'}
          </button>
        ))}
      </div>

      {/* Price input */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {listingType === 'rent' ? 'Monthly Rent' : 'Sale Price'}
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-sm font-medium text-gray-500">FCFA</span>
          <input
            type="text"
            inputMode="numeric"
            value={currentPrice != null ? currentPrice.toLocaleString('fr-CM') : ''}
            onChange={(e) => handlePriceInput(e.target.value.replace(/\s/g, ''))}
            placeholder="0"
            className={`w-full rounded-lg border py-2 pl-16 pr-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-500 ${
              error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-indigo-400'
            }`}
          />
          {isValidating && (
            <span className="absolute right-3 text-xs text-gray-400">Validating…</span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <p className="text-xs text-gray-400">Range: 10,000 – 500,000,000 FCFA</p>
      </div>
    </div>
  );
}
