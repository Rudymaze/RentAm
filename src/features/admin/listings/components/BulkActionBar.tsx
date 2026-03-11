import { FiCheck, FiX, FiXCircle } from 'react-icons/fi';

interface BulkActionBarProps {
  selectedCount: number;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onClearSelection: () => void;
  loading?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onApproveAll,
  onRejectAll,
  onClearSelection,
  loading = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-30 mx-auto flex w-fit items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-600 px-4 py-3 shadow-lg">
      {/* Count */}
      <span className="text-sm font-semibold text-white">
        {selectedCount} listing{selectedCount !== 1 ? 's' : ''} selected
      </span>

      <div className="h-4 w-px bg-indigo-400" />

      {/* Approve all */}
      <button
        type="button"
        onClick={onApproveAll}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60 transition-colors"
      >
        <FiCheck className="h-3.5 w-3.5" />
        Approve All
      </button>

      {/* Reject all */}
      <button
        type="button"
        onClick={onRejectAll}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 transition-colors"
      >
        <FiX className="h-3.5 w-3.5" />
        Reject All
      </button>

      {/* Clear */}
      <button
        type="button"
        onClick={onClearSelection}
        className="text-indigo-200 hover:text-white transition-colors"
        aria-label="Clear selection"
      >
        <FiXCircle className="h-4 w-4" />
      </button>
    </div>
  );
}
