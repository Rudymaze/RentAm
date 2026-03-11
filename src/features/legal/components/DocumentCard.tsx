'use client';

import { FiCheckCircle, FiAlertCircle, FiFileText } from 'react-icons/fi';
import type { DocumentType, UserAcceptance } from '@/features/legal/types';

const TITLES: Record<DocumentType, string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
};

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

interface DocumentCardProps {
  documentType: DocumentType;
  acceptance: UserAcceptance;
  onViewDocument: (documentType: DocumentType) => void;
}

export function DocumentCard({ documentType, acceptance, onViewDocument }: DocumentCardProps) {
  const title = TITLES[documentType];
  const accepted = acceptance.accepted && !acceptance.isOutOfDate();

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <FiFileText size={20} className="mt-0.5 shrink-0 text-indigo-500" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400">Version {acceptance.currentVersion}</p>
          {accepted && acceptance.acceptedAt ? (
            <p
              className="text-xs text-green-600"
              title={acceptance.acceptedAt.toLocaleString()}
            >
              Accepted {relativeTime(acceptance.acceptedAt)}
            </p>
          ) : acceptance.accepted && acceptance.isOutOfDate() ? (
            <p className="text-xs text-orange-500">New version requires re-acceptance</p>
          ) : (
            <p className="text-xs text-red-500">Not yet accepted</p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        {accepted ? (
          <FiCheckCircle size={20} className="text-green-500" />
        ) : (
          <FiAlertCircle size={20} className="text-red-400" />
        )}
        <button
          type="button"
          onClick={() => onViewDocument(documentType)}
          className="rounded-md border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
        >
          View Document
        </button>
      </div>
    </div>
  );
}
