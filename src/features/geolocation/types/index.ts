export type LocationAccuracy = 'precise' | 'approximate' | 'address_only';

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [longitude: number, latitude: number];
}

export interface City {
  id: string;
  nameEn: string;
  nameFr: string;
  region: string;
  latitude: number;
  longitude: number;
  population: number | null;
  isActive: boolean;
  geojson: GeoJSONPoint | null;
  getDisplayName(language: 'en' | 'fr'): string;
}

export interface LocationPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isSelected: boolean;
  distance_km: number | null;
}

export interface PropertyLocation {
  latitude: number;
  longitude: number;
  map_zoom_level: number;
  location_accuracy: LocationAccuracy;
  reverse_geocoded_address: string | null;
}

export interface MapState {
  center_lat: number;
  center_lng: number;
  zoom_level: number;
  selected_city: City | null;
  selected_coordinates: PropertyLocation | null;
  is_loading: boolean;
  error: string | null;
  search_query: string;
  search_results: City[];
  favorite_cities: City[];
}

export interface GeocodingComponents {
  street: string | null;
  city: string;
  region: string;
  country: string;
}

export interface GeocodingResult {
  address: string;
  components: GeocodingComponents;
  latitude: number;
  longitude: number;
}

export interface NearbyListing {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  listing_type: 'rent' | 'sale';
  rental_price: number | null;
  sale_price: number | null;
  thumbnail_url: string | null;
  created_by: string;
}

export interface NearbyListingsResult {
  listings: NearbyListing[];
  total: number;
  clustered: boolean;
}

export function createCity(data: Omit<City, 'getDisplayName'>): City {
  return {
    ...data,
    getDisplayName(language: 'en' | 'fr') {
      return language === 'fr' ? data.nameFr : data.nameEn;
    },
  };
}
