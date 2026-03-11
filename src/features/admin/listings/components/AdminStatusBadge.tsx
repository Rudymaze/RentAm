interface AdminStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Review' },
  approved:       { bg: 'bg-green-100',  text: 'text-green-800',  label: 'Approved' },
  rejected:       { bg: 'bg-red-100',    text: 'text-red-800',    label: 'Rejected' },
  active:         { bg: 'bg-green-100',  text: 'text-green-800',  label: 'Active' },
  draft:          { bg: 'bg-gray-100',   text: 'text-gray-700',   label: 'Draft' },
  archived:       { bg: 'bg-slate-100',  text: 'text-slate-600',  label: 'Archived' },
  expired:        { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Expired' },
  sold:           { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'Sold' },
  rented:         { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Rented' },
};

export function AdminStatusBadge({ status, size = 'sm' }: AdminStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClass} ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}
