export type PropertyType = 'apartment' | 'house' | 'villa' | 'commercial' | 'land';
export type ListingType = 'rent' | 'sale';
export type SortBy = 'newest' | 'price_asc' | 'price_desc' | 'distance';

export interface SearchFilters {
  cityIds?: string[];
  propertyTypes?: PropertyType[];
  listingType?: ListingType;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  sortBy?: SortBy;
  searchQuery?: string;
}

export interface PropertyListing {
  id: string;
  title: string;
  city_id: string;
  city_name: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  listing_type: ListingType;
  rental_price: number | null;
  sale_price: number | null;
  amenities: string[];
  thumbnail_url: string | null;
  landlord_name: string;
  created_at: string;
}

export interface SearchResults {
  listings: PropertyListing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SavedSearch {
  id: string;
  searchName: string;
  filterCriteria: SearchFilters;
  resultCount: number;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface MapProperty {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  listing_type: ListingType;
  rental_price: number | null;
  sale_price: number | null;
  thumbnail_url: string | null;
}
