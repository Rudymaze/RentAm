import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, CAM_BOUNDS } from '../_helpers';
import { z } from 'zod';

const Schema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius_km: z.number().min(0.1).max(100).default(10),
  limit: z.number().int().min(1).max(50).default(20),
  listing_type: z.enum(['rent', 'sale', 'all']).default('all'),
});

// Bounding-box pre-filter using 1 degree ≈ 111km
function degOffset(km: number) { return km / 111; }

export async function GET(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const rawBody = {
    latitude: parseFloat(searchParams.get('latitude') ?? ''),
    longitude: parseFloat(searchParams.get('longitude') ?? ''),
    radius_km: parseFloat(searchParams.get('radius_km') ?? '10'),
    limit: parseInt(searchParams.get('limit') ?? '20', 10),
    listing_type: searchParams.get('listing_type') ?? 'all',
  };

  const parsed = Schema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { latitude, longitude, radius_km, limit, listing_type } = parsed.data;

  const inCameroon =
    latitude >= CAM_BOUNDS.latMin && latitude <= CAM_BOUNDS.latMax &&
    longitude >= CAM_BOUNDS.lonMin && longitude <= CAM_BOUNDS.lonMax;

  if (!inCameroon) {
    return NextResponse.json({ success: false, error: 'Coordinates are outside Cameroon bounds' }, { status: 400 });
  }

  const offset = degOffset(radius_km);
  let query = supabase
    .from('property_listings')
    .select('id, title, latitude, longitude, listing_type, rental_price, sale_price, images')
    .eq('status', 'approved')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .gte('latitude', latitude - offset)
    .lte('latitude', latitude + offset)
    .gte('longitude', longitude - offset)
    .lte('longitude', longitude + offset)
    .limit(limit * 2); // over-fetch for haversine filtering

  if (listing_type !== 'all') {
    query = query.eq('listing_type', listing_type);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }

  // Haversine filter and distance sort
  const R = 6371;
  const filtered = (data ?? [])
    .map((row) => {
      const dLat = ((row.latitude - latitude) * Math.PI) / 180;
      const dLon = ((row.longitude - longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((latitude * Math.PI) / 180) *
        Math.cos((row.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
      const distance_km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...row, distance_km };
    })
    .filter((row) => row.distance_km <= radius_km)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      title: row.title,
      latitude: row.latitude,
      longitude: row.longitude,
      listing_type: row.listing_type,
      rental_price: row.rental_price,
      sale_price: row.sale_price,
      thumbnail_url: Array.isArray(row.images) && row.images.length > 0 ? row.images[0].url : null,
      distance_km: Math.round(row.distance_km * 10) / 10,
    }));

  return NextResponse.json({
    success: true,
    data: {
      listings: filtered,
      total: filtered.length,
      clustered: filtered.length >= limit,
    },
  });
}
