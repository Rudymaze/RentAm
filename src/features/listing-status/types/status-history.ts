import type { ListingStatus } from './listing';

export interface ListingStatusHistory {
  id: string;
  listing_id: string;
  previous_status: ListingStatus | null;
  new_status: ListingStatus;
  changed_by: string; // UUID or 'system'
  change_reason: string | null;
  metadata: Record<string, unknown> | null;
  changed_at: Date;
  getChangedByName(): string;
}

export function createListingStatusHistory(
  data: Omit<ListingStatusHistory, 'getChangedByName'>,
  adminNames?: Record<string, string>
): ListingStatusHistory {
  return {
    ...data,
    getChangedByName() {
      if (data.changed_by === 'system') return 'System';
      if (adminNames && adminNames[data.changed_by]) return adminNames[data.changed_by];
      return `Admin (${data.changed_by.slice(0, 8)}...)`;
    },
  };
}
