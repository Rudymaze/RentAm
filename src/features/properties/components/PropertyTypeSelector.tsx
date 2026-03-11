'use client';

import type { PropertyType } from '../types';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Land' },
];

interface PropertyTypeSelectorProps {
  selectedType: PropertyType | '';
  onTypeChange: (type: PropertyType) => void;
}

export function PropertyTypeSelector({ selectedType, onTypeChange }: PropertyTypeSelectorProps) {
  return (
    <select
      value={selectedType}
      onChange={(e) => onTypeChange(e.target.value as PropertyType)}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
    >
      <option value="" disabled>Select property type</option>
      {PROPERTY_TYPES.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
}
