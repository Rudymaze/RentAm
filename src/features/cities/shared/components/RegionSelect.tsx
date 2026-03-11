'use client';

export const CAMEROON_REGIONS = [
  'Adamawa',
  'Centre',
  'East',
  'Far North',
  'Littoral',
  'North',
  'Northwest',
  'South',
  'Southwest',
  'West',
] as const;

export type CameroonRegion = (typeof CAMEROON_REGIONS)[number];

interface RegionSelectProps {
  value: string;
  onChange: (region: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function RegionSelect({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = 'Select a region',
  className = '',
}: RegionSelectProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-red-400 text-red-700 focus:ring-red-400'
            : 'border-gray-300 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500'
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {CAMEROON_REGIONS.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
