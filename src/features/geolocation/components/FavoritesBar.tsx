'use client';

import { FiStar } from 'react-icons/fi';
import type { City } from '../types';

interface FavoritesBarProps {
  favorite_cities: City[];
  on_city_selected: (city: City) => void;
}

export function FavoritesBar({ favorite_cities, on_city_selected }: FavoritesBarProps) {
  if (favorite_cities.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-hide">
      <span className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
        <FiStar className="h-3.5 w-3.5" />
        Quick:
      </span>
      {favorite_cities.map((city) => (
        <button
          key={city.id}
          type="button"
          onClick={() => on_city_selected(city)}
          className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
        >
          {city.nameEn}
        </button>
      ))}
    </div>
  );
}
