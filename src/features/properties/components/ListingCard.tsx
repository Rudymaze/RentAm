'use client';

import Image from 'next/image';
import { FiMapPin, FiHome } from 'react-icons/fi';
import type { PropertyListing } from '../types';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Review' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
  archived: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Archived' },
};

interface ListingCardProps {
  listing: PropertyListing;
  onClick?: (listing: PropertyListing) => void;
}

export function ListingCard({ listing, onClick }: ListingCardProps) {
  const firstImage = listing.images?.[0]?.url ?? null;
  const status = STATUS_STYLES[listing.status] ?? STATUS_STYLES.draft;
  const price = listing.getFormattedPrice();

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(listing)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(listing)}
      className={`overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all ${
        onClick ? 'cursor-pointer hover:border-indigo-200 hover:shadow-md' : ''
      }`}
    >
      {/* Image */}
      <div className="relative h-40 w-full bg-gray-100">
        {firstImage ? (
          <Image src={firstImage} alt={listing.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FiHome className="h-10 w-10 text-gray-300" />
          </div>
        )}
        {/* Status badge */}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}
        >
          {status.label}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <h3 className="truncate text-sm font-semibold text-gray-900">{listing.title}</h3>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <FiMapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{listing.address ?? listing.city_id ?? 'Location not set'}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-bold text-indigo-600">{price}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
            {listing.property_type}
          </span>
        </div>
      </div>
    </div>
  );
}
