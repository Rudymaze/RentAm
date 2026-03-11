'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { createCity, type City } from '../types';

interface SearchBarProps {
  on_city_selected: (city: City) => void;
  placeholder?: string;
}

const RECENT_KEY = 'rentam_recent_cities';
const MAX_RECENT = 5;

function loadRecent(): City[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw) as Array<Omit<City, 'getDisplayName'>>;
    return items.map(createCity);
  } catch {
    return [];
  }
}

function saveRecent(cities: City[]) {
  try {
    // Strip the method before serialising
    const serialisable = cities.map(({ getDisplayName: _, ...rest }) => rest);
    localStorage.setItem(RECENT_KEY, JSON.stringify(serialisable));
  } catch {}
}

export function SearchBar({
  on_city_selected,
  placeholder = 'Search cities in Cameroon…',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<City[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/cities/search?q=${encodeURIComponent(q)}&limit=8`);
      const json = await res.json();
      if (json.success) {
        setResults(
          (json.data.cities as Array<Omit<City, 'getDisplayName'>>).map(createCity)
        );
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  }

  function handleSelect(city: City) {
    setQuery(city.nameEn);
    setResults([]);
    setOpen(false);
    on_city_selected(city);

    // Persist to recent
    const next = [city, ...recent.filter((c) => c.id !== city.id)].slice(0, MAX_RECENT);
    setRecent(next);
    saveRecent(next);
  }

  function clear() {
    setQuery('');
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    inputRef.current?.focus();
  }

  const showDropdown = open && (results.length > 0 || loading || (query.length >= 2));
  const showRecent = open && !query && recent.length > 0;

  return (
    <div className="relative w-full">
      {/* Input */}
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
          aria-label="Search cities"
          aria-autocomplete="list"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {(showDropdown || showRecent) && (
        <div className="absolute z-[1000] mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Recent searches */}
          {showRecent && (
            <div className="p-2">
              <p className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                Recent
              </p>
              {recent.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onMouseDown={() => handleSelect(city)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-800">{city.nameEn}</span>
                  <span className="ml-auto text-xs text-gray-400">{city.region}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search results */}
          {showDropdown && (
            <div className="p-2">
              {loading ? (
                <p className="px-2 py-1.5 text-xs text-gray-400">Searching…</p>
              ) : results.length === 0 && query.length >= 2 ? (
                <p className="px-2 py-1.5 text-xs text-gray-400">No cities found for "{query}"</p>
              ) : (
                results.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onMouseDown={() => handleSelect(city)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-indigo-50"
                  >
                    <span className="font-medium text-gray-800">{city.nameEn}</span>
                    <span className="ml-auto text-xs text-gray-400">{city.region}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent as quick-access pills (shown below input when dropdown is closed) */}
      {!open && recent.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {recent.slice(0, 5).map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => handleSelect(city)}
              className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-600 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-600"
            >
              {city.nameEn}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
