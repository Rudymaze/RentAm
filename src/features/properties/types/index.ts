export type PropertyType = 'apartment' | 'house' | 'villa' | 'commercial' | 'land';
export type ListingType = 'rent' | 'sale';
export type ListingStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';

export interface Image {
  url: string;
  order: number;
  uploadedAt: string;
}

export interface PropertyListing {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  property_type: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  city_id: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  amenities: string[];
  listing_type: ListingType;
  rental_price: number | null;
  sale_price: number | null;
  images: Image[];
  status: ListingStatus;
  rejection_reason: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  getFormattedPrice(): string;
  getStatusColor(): string;
  isOwnedBy(userId: string): boolean;
}

export interface PropertyListingDraft {
  id: string;
  user_id: string;
  listing_id: string | null;
  current_step: number;
  draft_data: Partial<ListingFormData>;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface PropertyListingFavorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface ListingFormData {
  title: string;
  description: string;
  property_type: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  city_id: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  amenities: string[];
  listing_type: ListingType;
  rental_price: number | null;
  sale_price: number | null;
  images: Image[];
}

export interface CityRef {
  id: string;
  name: string;
  region: string;
}

export function createPropertyListing(
  data: Omit<PropertyListing, 'getFormattedPrice' | 'getStatusColor' | 'isOwnedBy'>
): PropertyListing {
  return {
    ...data,
    getFormattedPrice() {
      const price = data.listing_type === 'rent' ? data.rental_price : data.sale_price;
      if (!price) return 'Price on request';
      return `${price.toLocaleString('fr-CM')} FCFA${data.listing_type === 'rent' ? '/month' : ''}`;
    },
    getStatusColor() {
      const colors: Record<ListingStatus, string> = {
        draft: 'gray',
        pending_review: 'yellow',
        approved: 'green',
        rejected: 'red',
        archived: 'slate',
      };
      return colors[data.status] ?? 'gray';
    },
    isOwnedBy(userId: string) {
      return data.created_by === userId;
    },
  };
}
