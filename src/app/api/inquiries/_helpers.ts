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
export function rateLimitResponse() {
  return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
export function checkRateLimit(key: string, maxRequests: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}
