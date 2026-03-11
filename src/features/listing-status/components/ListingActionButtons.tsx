import { FiEye, FiEdit2, FiRefreshCw, FiArchive, FiTrash2 } from 'react-icons/fi';
import type { PropertyListing } from '../types';

interface ListingActionButtonsProps {
  listing: PropertyListing;
  loading?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onRenew?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

interface ActionBtn {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  variant: 'default' | 'danger';
}

export function ListingActionButtons({
  listing,
  loading = false,
  onView,
  onEdit,
  onRenew,
  onArchive,
  onDelete,
}: ListingActionButtonsProps) {
  const { status } = listing;

  const actions: ActionBtn[] = [];

  // View — always shown
  actions.push({ label: 'View', icon: <FiEye className="h-4 w-4" />, onClick: onView, variant: 'default' });

  // Edit — draft, pending_approval, active
  if (['draft', 'pending_approval', 'active'].includes(status)) {
    actions.push({ label: 'Edit', icon: <FiEdit2 className="h-4 w-4" />, onClick: onEdit, variant: 'default' });
  }

  // Renew — expired
  if (listing.canBeRenewed()) {
    actions.push({ label: 'Renew', icon: <FiRefreshCw className="h-4 w-4" />, onClick: onRenew, variant: 'default' });
  }

  // Archive — active, sold, rented, expired
  if (listing.canBeArchived()) {
    actions.push({ label: 'Archive', icon: <FiArchive className="h-4 w-4" />, onClick: onArchive, variant: 'default' });
  }

  // Delete — draft only
  if (status === 'draft') {
    actions.push({ label: 'Delete', icon: <FiTrash2 className="h-4 w-4" />, onClick: onDelete, variant: 'danger' });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            action.variant === 'danger'
              ? 'bg-red-50 text-red-700 hover:bg-red-100'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}
