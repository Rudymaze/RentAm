import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../_helpers';
import { z } from 'zod';

const Schema = z.object({ listing_id: z.string().uuid() });

const RENEWAL_DAYS = 90;

export async function POST(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { listing_id } = parsed.data;

  const { data: listing } = await supabase
    .from('property_listings')
    .select('id, created_by, status')
    .eq('id', listing_id)
    .single();

  if (!listing) return notFoundResponse('Listing not found');
  if (listing.created_by !== user.id) return forbiddenResponse('Not your listing');
  if (listing.status !== 'expired') {
    return NextResponse.json({ success: false, error: 'Only expired listings can be renewed' }, { status: 400 });
  }

  const now = new Date();
  const newExpiry = new Date(now.getTime() + RENEWAL_DAYS * 86400000).toISOString();

  const { data: updated, error } = await supabase
    .from('property_listings')
    .update({
      status: 'pending_approval',
      listing_expiration_date: newExpiry,
      updated_at: now.toISOString(),
    })
    .eq('id', listing_id)
    .select()
    .single();

  if (error) return serverErrorResponse('Failed to renew listing');

  await supabase.from('listing_status_history').insert({
    listing_id,
    old_status: 'expired',
    new_status: 'pending_approval',
    changed_by: user.id,
    changed_at: now.toISOString(),
    reason: 'Listing renewed by owner',
  });

  return NextResponse.json({ success: true, data: updated });
}
