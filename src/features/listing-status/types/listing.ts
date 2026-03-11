export type ListingStatus =
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'sold'
  | 'rented'
  | 'expired'
  | 'archived';

export interface PropertyListing {
  id: string;
  user_id: string;
  title: string;
  city_id: string;
  listing_type: 'rent' | 'sale';
  status: ListingStatus;
  listing_expiration_date: Date | null;
  archived_at: Date | null;
  rejection_reason: string | null;
  admin_review_notes: string | null;
  approved_at: Date | null;
  approved_by: string | null;
  rejected_at: Date | null;
  rejected_by: string | null;
  marked_sold_at: Date | null;
  marked_rented_at: Date | null;
  created_at: Date;
  updated_at: Date;
  getDaysUntilExpiration(): number | null;
  isExpired(): boolean;
  canBeRenewed(): boolean;
  canBeArchived(): boolean;
  canBeEdited(): boolean;
}

export function createPropertyListingStatus(
  data: Omit<PropertyListing, 'getDaysUntilExpiration' | 'isExpired' | 'canBeRenewed' | 'canBeArchived' | 'canBeEdited'>
): PropertyListing {
  return {
    ...data,
    getDaysUntilExpiration() {
      if (!data.listing_expiration_date) return null;
      const now = new Date();
      const exp = new Date(data.listing_expiration_date);
      return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    },
    isExpired() {
      if (!data.listing_expiration_date) return false;
      return new Date(data.listing_expiration_date) < new Date();
    },
    canBeRenewed() {
      return data.status === 'expired';
    },
    canBeArchived() {
      return ['active', 'expired', 'sold', 'rented'].includes(data.status);
    },
    canBeEdited() {
      return ['draft', 'rejected'].includes(data.status);
    },
  };
}
