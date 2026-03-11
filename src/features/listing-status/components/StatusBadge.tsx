import { STATUS_BADGE_CONFIG } from '../types';
import type { ListingStatus } from '../types';

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-700' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  green:  { bg: 'bg-green-100',  text: 'text-green-800' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-800' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-800' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800' },
  slate:  { bg: 'bg-slate-100',  text: 'text-slate-600' },
};

interface StatusBadgeProps {
  status: ListingStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_BADGE_CONFIG[status];
  const colors = COLOR_CLASSES[config.color] ?? COLOR_CLASSES.gray;
  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClass} ${colors.bg} ${colors.text}`}
    >
      {config.label}
    </span>
  );
}
