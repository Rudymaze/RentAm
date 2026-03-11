import type { ListingStatus } from '../types';

const STATUS_CONFIG: Record<ListingStatus, { bg: string; text: string; label: string }> = {
  pending_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Review' },
  approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
  archived: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Archived' },
};

interface ListingStatusBadgeProps {
  status: ListingStatus;
  rejectionReason?: string | null;
}

export function ListingStatusBadge({ status, rejectionReason }: ListingStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <span
      title={status === 'rejected' && rejectionReason ? rejectionReason : undefined}
      className={`inline-flex cursor-default items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
      {status === 'rejected' && rejectionReason && (
        <span className="ml-1 text-red-400" title={rejectionReason}>ⓘ</span>
      )}
    </span>
  );
}
