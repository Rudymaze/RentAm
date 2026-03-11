import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, CAM_BOUNDS } from '../_helpers';
import { reverseGeocode } from '@/features/geolocation/services/geocodingService';
import { z } from 'zod';
import { applyRateLimit, EXTERNAL } from '@/lib/rate-limit';

const Schema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export async function POST(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const limited = applyRateLimit(`reverse-geocode:${user.id}`, EXTERNAL);
  if (limited) return limited;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['landlord', 'agent'].includes(profile.role)) {
    return forbiddenResponse('Only landlords and agents can reverse geocode');
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { latitude, longitude } = parsed.data;

  const inCameroon =
    latitude >= CAM_BOUNDS.latMin && latitude <= CAM_BOUNDS.latMax &&
    longitude >= CAM_BOUNDS.lonMin && longitude <= CAM_BOUNDS.lonMax;

  if (!inCameroon) {
    return NextResponse.json({ success: false, error: 'Coordinates are outside Cameroon bounds' }, { status: 400 });
  }

  try {
    const result = await reverseGeocode(latitude, longitude);
    return NextResponse.json({
      success: true,
      data: {
        address: result.displayName,
        components: {
          street: result.road ?? null,
          city: result.city ?? null,
          country: result.country ?? 'Cameroon',
        },
        latitude,
        longitude,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Reverse geocoding failed' }, { status: 502 });
  }
}
