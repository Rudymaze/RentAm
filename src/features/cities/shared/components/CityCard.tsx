'use client';

import { useState } from 'react';
import { FiMapPin, FiUsers } from 'react-icons/fi';
import type { City } from '@/features/cities/shared/types';

interface CityCardProps {
  city: City;
  onSelect?: (city: City) => void;
  showLanguageToggle?: boolean;
}

export function CityCard({ city, onSelect, showLanguageToggle = false }: CityCardProps) {
  const [lang, setLang] = useState<'en' | 'fr'>('en');

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(city)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.(city)}
      className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-2 ${
        onSelect ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 leading-tight">
          {city.getDisplayName(lang)}
        </h3>
        {showLanguageToggle && (
          <div className="inline-flex shrink-0 rounded-md border border-gray-200 bg-gray-100 p-0.5">
            {(['en', 'fr'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={(e) => { e.stopPropagation(); setLang(l); }}
                className={`rounded px-2 py-0.5 text-xs font-semibold uppercase transition ${
                  lang === l ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">{city.region}</p>

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <FiMapPin size={11} />
          {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
        </span>
        {city.population != null && (
          <span className="flex items-center gap-1">
            <FiUsers size={11} />
            {city.population.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
