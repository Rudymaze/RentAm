'use client';

import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { StatusBadge } from './StatusBadge';
import { STATUS_BADGE_CONFIG } from '../types';
import type { ListingStatusHistory, ListingStatus } from '../types';

interface StatusTimelineProps {
  history: ListingStatusHistory[];
  currentStatus: ListingStatus;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function EventRow({
  event,
  isCurrent,
  isLast,
}: {
  event: ListingStatusHistory;
  isCurrent: boolean;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails =
    event.change_reason ||
    (event.metadata && Object.keys(event.metadata).length > 0);

  return (
    <div className="flex gap-3">
      {/* Spine */}
      <div className="flex flex-col items-center">
        <div
          className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 ${
            isCurrent
              ? 'border-indigo-500 bg-indigo-500'
              : 'border-gray-300 bg-white'
          }`}
        />
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200" />}
      </div>

      {/* Content */}
      <div className={`pb-4 flex-1 min-w-0 ${isLast ? 'pb-0' : ''}`}>
        {/* Status change row */}
        <div className="flex flex-wrap items-center gap-2">
          {event.previous_status ? (
            <>
              <StatusBadge status={event.previous_status} />
              <span className="text-xs text-gray-400">→</span>
            </>
          ) : null}
          <StatusBadge status={event.new_status} />
          {isCurrent && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
              Current
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>{formatDate(event.changed_at)}</span>
          <span>·</span>
          <span>{event.getChangedByName()}</span>
        </div>

        {/* Expand/collapse for details */}
        {hasDetails && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 flex items-center gap-1 text-xs text-indigo-600 hover:underline"
          >
            {expanded ? (
              <>
                <FiChevronUp className="h-3 w-3" /> Hide details
              </>
            ) : (
              <>
                <FiChevronDown className="h-3 w-3" /> Show details
              </>
            )}
          </button>
        )}

        {expanded && (
          <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-700 space-y-1">
            {event.change_reason && (
              <p>
                <span className="font-medium">Reason:</span> {event.change_reason}
              </p>
            )}
            {event.metadata &&
              Object.entries(event.metadata).map(([key, value]) => (
                <p key={key}>
                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                  {String(value)}
                </p>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusTimeline({ history, currentStatus }: StatusTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
        No history available
      </div>
    );
  }

  // Sort newest first
  const sorted = [...history].sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  return (
    <div className="space-y-0">
      {sorted.map((event, idx) => (
        <EventRow
          key={event.id}
          event={event}
          isCurrent={idx === 0 && event.new_status === currentStatus}
          isLast={idx === sorted.length - 1}
        />
      ))}
    </div>
  );
}
