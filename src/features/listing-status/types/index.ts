export type { ListingStatus, PropertyListing } from './listing';
export { createPropertyListingStatus } from './listing';
export type { ListingStatusHistory } from './status-history';
export { createListingStatusHistory } from './status-history';

import type { ListingStatus } from './listing';

export interface StatusBadgeConfig {
  color: string;
  label: string;
  icon: string;
}

export const STATUS_BADGE_CONFIG: Record<ListingStatus, StatusBadgeConfig> = {
  draft:            { color: 'gray',   label: 'Draft',           icon: 'pencil' },
  pending_approval: { color: 'yellow', label: 'Pending Review',  icon: 'clock' },
  active:           { color: 'green',  label: 'Active',          icon: 'check-circle' },
  sold:             { color: 'blue',   label: 'Sold',            icon: 'tag' },
  rented:           { color: 'purple', label: 'Rented',          icon: 'key' },
  expired:          { color: 'orange', label: 'Expired',         icon: 'exclamation-circle' },
  archived:         { color: 'slate',  label: 'Archived',        icon: 'archive' },
};
