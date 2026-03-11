import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../_helpers';
import { z } from 'zod';

const Schema = z.object({
  listing_id: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

const WITHDRAWABLE_STATUSES = ['pending_approval', 'active'];

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

  const { listing_id, reason } = parsed.data;

  const { data: listing } = await supabase
    .from('property_listings')
    .select('id, created_by, status')
    .eq('id', listing_id)
    .single();

  if (!listing) return notFoundResponse('Listing not found');
  if (listing.created_by !== user.id) return forbiddenResponse('Not your listing');

  if (!WITHDRAWABLE_STATUSES.includes(listing.status)) {
    return NextResponse.json({
      success: false,
      error: `Cannot withdraw a listing with status '${listing.status}'`,
    }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('property_listings')
    .update({ status: 'draft', updated_at: now })
    .eq('id', listing_id)
    .select()
    .single();

  if (error) return serverErrorResponse('Failed to withdraw listing');

  await supabase.from('listing_status_history').insert({
    listing_id,
    old_status: listing.status,
    new_status: 'draft',
    changed_by: user.id,
    changed_at: now,
    reason: reason ?? 'Withdrawn by owner',
  });

  return NextResponse.json({ success: true, data: updated });
}
