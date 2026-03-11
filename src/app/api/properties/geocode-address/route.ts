import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse } from '../_helpers';
import { geocodeAddress } from '@/features/geolocation/services/geocodingService';
import { z } from 'zod';
import { applyRateLimit, EXTERNAL } from '@/lib/rate-limit';

const Schema = z.object({
  address: z.string().min(3, 'Address must be at least 3 characters').max(500),
});

export async function POST(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const limited = applyRateLimit(`geocode:${user.id}`, EXTERNAL);
  if (limited) return limited;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['landlord', 'agent'].includes(profile.role)) {
    return forbiddenResponse('Only landlords and agents can geocode addresses');
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const results = await geocodeAddress(parsed.data.address);
    if (!results.length) {
      return NextResponse.json({ success: true, data: { results: [], found: false } });
    }

    return NextResponse.json({
      success: true,
      data: {
        results: results.map((r) => ({
          address: r.displayName,
          latitude: r.lat,
          longitude: r.lon,
        })),
        found: true,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Geocoding service unavailable' }, { status: 502 });
  }
}
