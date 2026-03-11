'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSearch, FiMapPin } from 'react-icons/fi';

interface CityOption {
  id: string;
  name: string;
  region: string;
}

interface CityAutocompleteProps {
  onCitySelect: (city: CityOption) => void;
  initialCity?: CityOption | null;
  placeholder?: string;
}

export function CityAutocomplete({ onCitySelect, initialCity, placeholder = 'Search city...' }: CityAutocompleteProps) {
  const [query, setQuery] = useState(initialCity?.name ?? '');
  const [results, setResults] = useState<CityOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<CityOption | null>(initialCity ?? null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cities/search?q=${encodeURIComponent(q)}&limit=8`);
      const json = await res.json();
      if (json.success) {
        setResults(json.data?.cities ?? []);
        setIsOpen(true);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleInput(value: string) {
    setQuery(value);
    setSelected(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function handleSelect(city: CityOption) {
    setSelected(city);
    setQuery(city.name);
    setResults([]);
    setIsOpen(false);
    onCitySelect(city);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <FiSearch className="absolute left-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
        />
        {isLoading && (
          <span className="absolute right-3 text-xs text-gray-400">Searching…</span>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                onClick={() => handleSelect(city)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-indigo-50"
              >
                <FiMapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="font-medium text-gray-900">{city.name}</span>
                <span className="ml-auto text-xs text-gray-400">{city.region}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <p className="mt-1 text-xs text-indigo-600">
          Selected: {selected.name}, {selected.region}
        </p>
      )}
    </div>
  );
}
