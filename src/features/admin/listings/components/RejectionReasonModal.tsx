'use client';

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import type { RejectionReason } from '../../../admin-listing-verification/types';

const REJECTION_LABELS: Record<RejectionReason, string> = {
  photos_fake: 'Photos are fake or stock images',
  location_invalid: 'Location is invalid or outside Cameroon',
  pricing_unrealistic: 'Pricing is unrealistic',
  insufficient_description: 'Description is insufficient',
  landlord_unverified: 'Landlord identity cannot be verified',
  duplicate_listing: 'Duplicate listing',
  policy_violation: 'Policy violation',
  other: 'Other (please specify)',
};

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: RejectionReason, notes: string) => void;
  rejectionReasons?: RejectionReason[];
  loading?: boolean;
}

const DEFAULT_REASONS = Object.keys(REJECTION_LABELS) as RejectionReason[];

export function RejectionReasonModal({
  isOpen,
  onClose,
  onConfirm,
  rejectionReasons = DEFAULT_REASONS,
  loading = false,
}: RejectionReasonModalProps) {
  const [reason, setReason] = useState<RejectionReason | ''>('');
  const [notes, setNotes] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const notesRequired = reason === 'other';
  const canConfirm = reason !== '' && (!notesRequired || notes.trim().length > 0);

  function handleConfirm() {
    if (!canConfirm || !reason) return;
    onConfirm(reason as RejectionReason, notes.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Reject Listing</h2>
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
          {/* Reason select */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Rejection reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as RejectionReason | '')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">Select a reason…</option>
              {rejectionReasons.map((r) => (
                <option key={r} value={r}>
                  {REJECTION_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          {/* Notes textarea */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Admin notes{notesRequired && <span className="text-red-500"> *</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={
                notesRequired
                  ? 'Please describe the reason in detail…'
                  : 'Optional additional notes for the landlord…'
              }
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
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
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}
