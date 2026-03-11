'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiEye, FiCheck, FiX, FiImage, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import type { PendingListing } from '../types';

type SortField = 'title' | 'landlord_name' | 'city_name' | 'created_at';
type SortDir = 'asc' | 'desc';

interface PendingListingsTableProps {
  listings: PendingListing[];
  loading?: boolean;
  selectedListings: string[];
  onSelectionChange: (ids: string[]) => void;
  onRowClick: (listing: PendingListing) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  );
}

function SortHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
}) {
  const active = sortField === field;
  return (
    <th
      className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {active ? (
          sortDir === 'asc' ? <FiChevronUp className="h-3 w-3" /> : <FiChevronDown className="h-3 w-3" />
        ) : (
          <FiChevronDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

export function PendingListingsTable({
  listings,
  loading = false,
  selectedListings,
  onSelectionChange,
  onRowClick,
  onApprove,
  onReject,
}: PendingListingsTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const sorted = [...listings].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'created_at') {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else {
      cmp = String(a[sortField]).localeCompare(String(b[sortField]));
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const allSelected = listings.length > 0 && selectedListings.length === listings.length;

  function toggleAll() {
    onSelectionChange(allSelected ? [] : listings.map((l) => l.id));
  }

  function toggleOne(id: string) {
    onSelectionChange(
      selectedListings.includes(id)
        ? selectedListings.filter((x) => x !== id)
        : [...selectedListings, id]
    );
  }

  return (
    <>
      {/* ── Desktop table ─────────────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {/* Bulk select */}
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Photo
              </th>
              <SortHeader label="Title" field="title" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="Landlord" field="landlord_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortHeader label="City" field="city_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
              <SortHeader label="Submitted" field="created_at" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : sorted.length === 0
              ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                    No pending listings
                  </td>
                </tr>
              )
              : sorted.map((listing) => (
                <tr
                  key={listing.id}
                  className={`border-b border-gray-100 transition-colors ${
                    selectedListings.includes(listing.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedListings.includes(listing.id)}
                      onChange={() => toggleOne(listing.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>

                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    <div className="relative h-10 w-14 overflow-hidden rounded-md bg-gray-100">
                      {listing.thumbnail_url ? (
                        <Image src={listing.thumbnail_url} alt="" fill sizes="56px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <FiImage className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Title */}
                  <td
                    className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-900 hover:text-indigo-600 max-w-[180px] truncate"
                    onClick={() => onRowClick(listing)}
                  >
                    {listing.title}
                  </td>

                  {/* Landlord */}
                  <td className="px-4 py-3 text-sm text-gray-600">{listing.landlord_name}</td>

                  {/* City */}
                  <td className="px-4 py-3 text-sm text-gray-600">{listing.city_name}</td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        listing.listing_type === 'rent'
                          ? 'bg-violet-50 text-violet-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {listing.listing_type === 'rent' ? 'Rent' : 'Sale'}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(listing.created_at)}</td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onRowClick(listing)}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        title="Review"
                      >
                        <FiEye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onApprove(listing.id); }}
                        className="rounded p-1.5 text-green-600 hover:bg-green-50"
                        title="Approve"
                      >
                        <FiCheck className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onReject(listing.id); }}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50"
                        title="Reject"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ──────────────────────────────────────────── */}
      <div className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
            ))
          : sorted.map((listing) => (
              <div
                key={listing.id}
                className={`rounded-xl border bg-white p-3 shadow-sm ${
                  selectedListings.includes(listing.id) ? 'border-indigo-300' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedListings.includes(listing.id)}
                    onChange={() => toggleOne(listing.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600"
                  />
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {listing.thumbnail_url ? (
                      <Image src={listing.thumbnail_url} alt="" fill sizes="80px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <FiImage className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{listing.title}</p>
                    <p className="text-xs text-gray-500">{listing.landlord_name} · {listing.city_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(listing.created_at)}</p>
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => onRowClick(listing)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Review</button>
                  <button type="button" onClick={() => onApprove(listing.id)} className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100">Approve</button>
                  <button type="button" onClick={() => onReject(listing.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">Reject</button>
                </div>
              </div>
            ))}
      </div>
    </>
  );
}
