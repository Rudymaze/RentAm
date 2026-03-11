import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '../../_helpers';
import { z } from 'zod';
import { applyRateLimit, MODERATE } from '@/lib/rate-limit';

const Schema = z.object({ listing_id: z.string().uuid('Invalid listing ID') });

export async function POST(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const limited = applyRateLimit(`fav:toggle:${user.id}`, MODERATE);
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { listing_id } = parsed.data;

  // Verify listing exists
  const { data: listing } = await supabase
    .from('property_listings')
    .select('id')
    .eq('id', listing_id)
    .single();

  if (!listing) return notFoundResponse('Listing not found');

  // Check if already favorited
  const { data: existing } = await supabase
    .from('property_listing_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listing_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('property_listing_favorites')
      .delete()
      .eq('id', existing.id);

    if (error) return serverErrorResponse('Failed to remove favorite');
    return NextResponse.json({ success: true, data: { isFavorited: false } });
  }

  const { error } = await supabase
    .from('property_listing_favorites')
    .insert({ user_id: user.id, listing_id });

  if (error) return serverErrorResponse('Failed to add favorite');
  return NextResponse.json({ success: true, data: { isFavorited: true } });
}
