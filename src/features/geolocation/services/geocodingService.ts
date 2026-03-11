const NOMINATIM_BASE_URL =
  process.env.NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org';

export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
}

export interface ReverseGeocodingResult {
  displayName: string;
  city?: string;
  country?: string;
  road?: string;
}

/**
 * Forward geocoding: address → coordinates
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    countrycodes: 'cm', // Cameroon
    limit: '5',
  });

  const res = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
    headers: { 'Accept-Language': 'en' },
  });

  if (!res.ok) throw new Error('Geocoding request failed');

  const data = await res.json();
  return data.map((item: Record<string, string>) => ({
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    displayName: item.display_name,
  }));
}

/**
 * Reverse geocoding: coordinates → address
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<ReverseGeocodingResult> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
  });

  const res = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
    headers: { 'Accept-Language': 'en' },
  });

  if (!res.ok) throw new Error('Reverse geocoding request failed');

  const data = await res.json();
  return {
    displayName: data.display_name,
    city: data.address?.city ?? data.address?.town ?? data.address?.village,
    country: data.address?.country,
    road: data.address?.road,
  };
}
