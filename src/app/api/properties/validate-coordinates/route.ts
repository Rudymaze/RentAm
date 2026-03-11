import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, CAM_BOUNDS } from '../_helpers';
import { z } from 'zod';

const Schema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city_id: z.string().uuid().optional().nullable(),
});

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['landlord', 'agent'].includes(profile.role)) {
    return forbiddenResponse('Only landlords and agents can validate coordinates');
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { latitude, longitude, city_id } = parsed.data;
  const warnings: string[] = [];

  const inCameroon =
    latitude >= CAM_BOUNDS.latMin && latitude <= CAM_BOUNDS.latMax &&
    longitude >= CAM_BOUNDS.lonMin && longitude <= CAM_BOUNDS.lonMax;

  if (!inCameroon) {
    return NextResponse.json({
      success: true,
      data: { valid: false, latitude, longitude, accuracy: null, warnings: ['Coordinates are outside Cameroon bounds'] },
    });
  }

  let accuracy: 'precise' | 'approximate' | 'address_only' = 'precise';

  if (city_id) {
    const { data: city } = await supabase
      .from('cameroon_cities')
      .select('latitude, longitude, name_en')
      .eq('id', city_id)
      .single();

    if (!city) {
      return NextResponse.json({ success: false, error: 'City not found' }, { status: 404 });
    }

    const distKm = haversineKm(latitude, longitude, city.latitude, city.longitude);
    if (distKm > 50) {
      warnings.push(`Coordinates are ${Math.round(distKm)} km from ${city.name_en} city center`);
      accuracy = 'approximate';
    }
  }

  return NextResponse.json({
    success: true,
    data: { valid: true, latitude, longitude, accuracy, warnings },
  });
}
