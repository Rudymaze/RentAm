import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function getSupabaseAndUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user, authError: error };
}

export const CAM_BOUNDS = { latMin: 1.67, latMax: 13.0, lonMin: 8.5, lonMax: 16.0 };
export const PRICE_MIN = 10_000;
export const PRICE_MAX = 500_000_000;

export function isWithinCameroon(lat: number | null, lon: number | null): boolean {
  if (lat == null || lon == null) return true; // optional fields
  return lat >= CAM_BOUNDS.latMin && lat <= CAM_BOUNDS.latMax &&
         lon >= CAM_BOUNDS.lonMin && lon <= CAM_BOUNDS.lonMax;
}

export function unauthorizedResponse() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export function forbiddenResponse(msg = 'Forbidden') {
  return NextResponse.json({ success: false, error: msg }, { status: 403 });
}

export function notFoundResponse(msg = 'Not found') {
  return NextResponse.json({ success: false, error: msg }, { status: 404 });
}

export function serverErrorResponse(msg = 'Database error') {
  return NextResponse.json({ success: false, error: msg }, { status: 500 });
}
