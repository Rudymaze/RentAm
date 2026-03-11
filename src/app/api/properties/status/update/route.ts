import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../_helpers';
import { z } from 'zod';

const Schema = z.object({
  listing_id: z.string().uuid(),
  new_status: z.enum(['sold', 'rented', 'archived']),
  reason: z.string().max(500).optional(),
});

// Allowed transitions for user-initiated status changes
const ALLOWED_FROM: Record<string, string[]> = {
  sold:     ['active', 'expired'],
  rented:   ['active', 'expired'],
  archived: ['active', 'expired', 'sold', 'rented'],
};

export async function PATCH(req: NextRequest) {
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

  const { listing_id, new_status, reason } = parsed.data;

  const { data: listing } = await supabase
    .from('property_listings')
    .select('id, created_by, status')
    .eq('id', listing_id)
    .single();

  if (!listing) return notFoundResponse('Listing not found');
  if (listing.created_by !== user.id) return forbiddenResponse('Not your listing');

  if (!ALLOWED_FROM[new_status].includes(listing.status)) {
    return NextResponse.json({
      success: false,
      error: `Cannot transition from '${listing.status}' to '${new_status}'`,
    }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { status: new_status, updated_at: now };
  if (new_status === 'sold') updates.marked_sold_at = now;
  if (new_status === 'rented') updates.marked_rented_at = now;
  if (new_status === 'archived') updates.archived_at = now;

  const { data: updated, error: updateErr } = await supabase
    .from('property_listings')
    .update(updates)
    .eq('id', listing_id)
    .select()
    .single();

  if (updateErr) return serverErrorResponse('Failed to update status');

  // Log to status history
  await supabase.from('listing_status_history').insert({
    listing_id,
    old_status: listing.status,
    new_status,
    changed_by: user.id,
    changed_at: now,
    reason: reason ?? null,
  });

  return NextResponse.json({ success: true, data: updated });
}
