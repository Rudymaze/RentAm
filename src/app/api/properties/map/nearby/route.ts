import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, CAM_BOUNDS } from '../../_helpers';
import { z } from 'zod';

import { applyRateLimit, STANDARD } from '@/lib/rate-limit';

// Approximate radius (km) for zoom levels
function radiusFromZoom(zoom: number): number {
  // zoom 20 = ~0.5km, zoom 15 = ~5km, zoom 10 = ~20km, zoom 5 = ~100km, zoom 1 = ~500km
  return Math.min(500, Math.max(0.5, 500 / Math.pow(2, zoom - 1)));
}

const Schema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  zoom_level: z.number().int().min(1).max(20).default(15),
  radius_km: z.number().min(0.1).max(500).optional(),
  cityId: z.string().uuid().optional(),
  listingType: z.enum(['rent', 'sale']).optional(),
  propertyType: z.enum(['apartment', 'house', 'villa', 'commercial', 'land']).optional(),
});

// Grid-based clustering: group points into cells of ~clusterKm size
function clusterListings(
  listings: Array<{ id: string; latitude: number; longitude: number; [key: string]: unknown }>,
  clusterKm: number
) {
  const cellDeg = clusterKm / 111;
  const cells = new Map<string, typeof listings>();
  for (const l of listings) {
    const cellLat = Math.floor(l.latitude / cellDeg);
    const cellLon = Math.floor(l.longitude / cellDeg);
    const key = `${cellLat}:${cellLon}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key)!.push(l);
  }
  return Array.from(cells.values()).map((group) => ({
    count: group.length,
    latitude: group.reduce((s, l) => s + l.latitude, 0) / group.length,
    longitude: group.reduce((s, l) => s + l.longitude, 0) / group.length,
    representative: group[0],
  }));
}

export async function GET(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const limited = applyRateLimit(`map:${user.id}`, STANDARD);
  if (limited) return limited;

  const sp = req.nextUrl.searchParams;
  const raw = {
    latitude: parseFloat(sp.get('latitude') ?? ''),
    longitude: parseFloat(sp.get('longitude') ?? ''),
    zoom_level: sp.has('zoom_level') ? parseInt(sp.get('zoom_level')!, 10) : 15,
    radius_km: sp.has('radius_km') ? parseFloat(sp.get('radius_km')!) : undefined,
    cityId: sp.get('cityId') ?? undefined,
    listingType: sp.get('listingType') ?? undefined,
    propertyType: sp.get('propertyType') ?? undefined,
  };

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid parameters', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { latitude, longitude, zoom_level, cityId, listingType, propertyType } = parsed.data;
  const radius_km = parsed.data.radius_km ?? radiusFromZoom(zoom_level);

  // Validate coordinates are within Cameroon
  const inCameroon =
    latitude >= CAM_BOUNDS.latMin && latitude <= CAM_BOUNDS.latMax &&
    longitude >= CAM_BOUNDS.lonMin && longitude <= CAM_BOUNDS.lonMax;
  if (!inCameroon) {
    return NextResponse.json({ success: false, error: 'Coordinates are outside Cameroon bounds' }, { status: 400 });
  }

  // Bounding-box pre-filter (1 degree ≈ 111km)
  const degOffset = radius_km / 111;
  let query = supabase
    .from('property_listings')
    .select('id, title, listing_type, property_type, rental_price, sale_price, latitude, longitude, city_id, images')
    .eq('status', 'approved')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .gte('latitude', latitude - degOffset)
    .lte('latitude', latitude + degOffset)
    .gte('longitude', longitude - degOffset)
    .lte('longitude', longitude + degOffset)
    .limit(500);

  if (cityId) query = query.eq('city_id', cityId);
  if (listingType) query = query.eq('listing_type', listingType);
  if (propertyType) query = query.eq('property_type', propertyType);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }

  // Haversine filter
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
    .map((row) => ({
      id: row.id,
      title: row.title,
      listing_type: row.listing_type,
      property_type: row.property_type,
      rental_price: row.rental_price,
      sale_price: row.sale_price,
      latitude: row.latitude,
      longitude: row.longitude,
      distance_km: Math.round(row.distance_km * 10) / 10,
      thumbnail_url: Array.isArray(row.images) && row.images.length > 0 ? row.images[0].url : null,
    }));

  const shouldCluster = filtered.length > 100;
  const clusterKm = Math.max(1, radius_km / 10);
  const clusters = shouldCluster ? clusterListings(filtered, clusterKm) : [];

  return NextResponse.json({
    success: true,
    data: {
      listings: shouldCluster ? [] : filtered,
      total: filtered.length,
      clustered: shouldCluster,
      ...(shouldCluster ? { clusters } : {}),
    },
  });
}
