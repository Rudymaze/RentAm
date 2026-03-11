import { StatusBadge } from './StatusBadge';
import { ExpirationCountdown } from './ExpirationCountdown';
import { ListingActionButtons } from './ListingActionButtons';
import type { PropertyListing } from '../types';

interface ListingTableRowProps {
  listing: PropertyListing;
  cityName?: string;
  loading?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onRenew?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function ListingTypePill({ type }: { type: 'rent' | 'sale' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        type === 'rent'
          ? 'bg-violet-50 text-violet-700'
          : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {type === 'rent' ? 'For Rent' : 'For Sale'}
    </span>
  );
}

export function ListingTableRow({
  listing,
  cityName,
  loading = false,
  onView,
  onEdit,
  onRenew,
  onArchive,
  onDelete,
}: ListingTableRowProps) {
  const actionProps = { listing, loading, onView, onEdit, onRenew, onArchive, onDelete };

  return (
    <>
      {/* ── Desktop table row ─────────────────────────────────────── */}
      <tr className="hidden border-b border-gray-100 hover:bg-gray-50 transition-colors md:table-row">
        {/* Title */}
        <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
          {listing.title}
        </td>

        {/* Location */}
        <td className="px-4 py-3 text-sm text-gray-600">
          {cityName ?? listing.city_id}
        </td>

        {/* Type */}
        <td className="px-4 py-3">
          <ListingTypePill type={listing.listing_type} />
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <StatusBadge status={listing.status} />
        </td>

        {/* Created */}
        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(listing.created_at)}</td>

        {/* Expiration */}
        <td className="px-4 py-3">
          <ExpirationCountdown listing_expiration_date={listing.listing_expiration_date} />
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <ListingActionButtons {...actionProps} />
        </td>
      </tr>

      {/* ── Mobile card ───────────────────────────────────────────── */}
      <tr className="block border-b border-gray-100 md:hidden">
        <td className="block px-4 py-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm space-y-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 leading-snug">{listing.title}</p>
              <StatusBadge status={listing.status} />
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {cityName && <span>{cityName}</span>}
              <ListingTypePill type={listing.listing_type} />
              <span>{formatDate(listing.created_at)}</span>
            </div>

            {/* Expiration */}
            <ExpirationCountdown listing_expiration_date={listing.listing_expiration_date} />

            {/* Actions */}
            <ListingActionButtons {...actionProps} />
          </div>
        </td>
      </tr>
    </>
  );
}
