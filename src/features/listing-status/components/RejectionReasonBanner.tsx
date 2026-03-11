'use client';

import { useState, useEffect } from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';

interface RejectionReasonBannerProps {
  rejection_reason: string | null;
  autoDismissMs?: number;
  onDismiss?: () => void;
}

export function RejectionReasonBanner({
  rejection_reason,
  autoDismissMs,
  onDismiss,
}: RejectionReasonBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state if rejection_reason changes
  useEffect(() => {
    setDismissed(false);
  }, [rejection_reason]);

  // Auto-dismiss
  useEffect(() => {
    if (!rejection_reason || !autoDismissMs) return;
    const timer = setTimeout(() => {
      setDismissed(true);
      onDismiss?.();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [rejection_reason, autoDismissMs, onDismiss]);

  if (!rejection_reason || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
    >
      <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800">Listing Rejected</p>
        <p className="mt-0.5 text-sm text-red-700">{rejection_reason}</p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 text-red-400 hover:text-red-600 transition-colors"
        aria-label="Dismiss"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
}
