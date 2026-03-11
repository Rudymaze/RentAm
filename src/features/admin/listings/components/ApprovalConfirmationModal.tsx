'use client';

import { FiX, FiCheckCircle } from 'react-icons/fi';
import type { VerificationChecklist } from '../types';

const CHECKLIST_LABELS: Record<keyof VerificationChecklist, string> = {
  photos_authentic: 'Photos authentic',
  location_valid: 'Location valid',
  pricing_reasonable: 'Pricing reasonable',
  description_detailed: 'Description detailed',
  landlord_verified: 'Landlord verified',
};

interface ApprovalConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  listing_title: string;
  checklist_items?: VerificationChecklist;
  loading?: boolean;
}

export function ApprovalConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  listing_title,
  checklist_items,
  loading = false,
}: ApprovalConfirmationModalProps) {
  if (!isOpen) return null;

  const checkedKeys = checklist_items
    ? (Object.keys(checklist_items) as Array<keyof VerificationChecklist>).filter(
        (k) => checklist_items[k]
      )
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Approve Listing</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          <p className="text-sm text-gray-600">
            You are about to approve:
          </p>
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
            {listing_title}
          </p>

          {/* Checklist summary */}
          {checkedKeys.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Verified items
              </p>
              <div className="space-y-1">
                {checkedKeys.map((key) => (
                  <div key={key} className="flex items-center gap-2 text-sm text-green-700">
                    <FiCheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                    {CHECKLIST_LABELS[key]}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500">
            This will make the listing visible to all users. This action can be reversed by the admin.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Approving…' : 'Approve Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}
