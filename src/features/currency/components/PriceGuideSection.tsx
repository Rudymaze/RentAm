'use client';

import type { PriceGuide } from '@/features/currency/types';

interface PriceGuideSectionProps {
  priceGuide?: PriceGuide;
  loading?: boolean;
  className?: string;
}

const LABELS: { key: keyof PriceGuide; label: string }[] = [
  { key: 'studioApartmentMonthly', label: 'Studio apartment (monthly)' },
  { key: 'oneBedroomMonthly', label: '1-bedroom apartment (monthly)' },
  { key: 'twoBedroomMonthly', label: '2-bedroom apartment (monthly)' },
  { key: 'houseMonthly', label: 'House (monthly)' },
  { key: 'villaMonthly', label: 'Villa (monthly)' },
  { key: 'commercialMonthly', label: 'Commercial space (monthly)' },
];

function formatFcfa(n: number) {
  return n.toLocaleString('fr-CM') + ' FCFA';
}

function Skeleton() {
  return <span className="inline-block h-4 w-32 animate-pulse rounded bg-gray-200" />;
}

export function PriceGuideSection({ priceGuide, loading = false, className = '' }: PriceGuideSectionProps) {
  return (
    <div className={`rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900">FCFA Price Reference</h3>
      <p className="text-xs text-gray-400">Typical rental prices in Cameroon</p>

      <div className="divide-y divide-gray-100">
        {LABELS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-2.5">
            <span className="text-sm text-gray-600">{label}</span>
            {loading || !priceGuide ? (
              <Skeleton />
            ) : (
              <span className="text-xs font-medium text-gray-800 tabular-nums">
                {formatFcfa(priceGuide[key].min)} – {formatFcfa(priceGuide[key].max)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
