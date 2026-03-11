'use client';

import { useState, useRef, useCallback } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export interface FilterState {
  query: string;
  cityId: string;
  listingType: '' | 'rent' | 'sale';
  dateFrom: string;
  dateTo: string;
  sortBy: 'created_at_desc' | 'created_at_asc' | 'title_asc';
}

interface CityOption {
  id: string;
  name: string;
}

interface FilterToolbarProps {
  filters: FilterState;
  cities: CityOption[];
  loading?: boolean;
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
}

export const DEFAULT_FILTERS: FilterState = {
  query: '',
  cityId: '',
  listingType: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'created_at_desc',
};

export function FilterToolbar({
  filters,
  cities,
  loading = false,
  onSearch,
  onFilterChange,
}: FilterToolbarProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localQuery, setLocalQuery] = useState(filters.query);

  function handleQueryChange(q: string) {
    setLocalQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(q), 300);
  }

  function update(patch: Partial<FilterState>) {
    onFilterChange({ ...filters, ...patch });
  }

  function reset() {
    setLocalQuery('');
    onFilterChange(DEFAULT_FILTERS);
    onSearch('');
  }

  const hasActiveFilters =
    filters.cityId ||
    filters.listingType ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.sortBy !== 'created_at_desc' ||
    localQuery;

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      {/* Row 1: search + reset */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search title or landlord…"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <FiX className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Row 2: filters */}
      <div className="flex flex-wrap gap-2">
        {/* City */}
        <select
          value={filters.cityId}
          onChange={(e) => update({ cityId: e.target.value })}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:opacity-60"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Listing type */}
        <select
          value={filters.listingType}
          onChange={(e) => update({ listingType: e.target.value as FilterState['listingType'] })}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:opacity-60"
        >
          <option value="">All types</option>
          <option value="rent">For Rent</option>
          <option value="sale">For Sale</option>
        </select>

        {/* Date from */}
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => update({ dateFrom: e.target.value })}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:opacity-60"
          aria-label="Date from"
        />

        {/* Date to */}
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => update({ dateTo: e.target.value })}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:opacity-60"
          aria-label="Date to"
        />

        {/* Sort */}
        <select
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value as FilterState['sortBy'] })}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:opacity-60"
        >
          <option value="created_at_desc">Newest first</option>
          <option value="created_at_asc">Oldest first</option>
          <option value="title_asc">Title A–Z</option>
        </select>
      </div>
    </div>
  );
}
