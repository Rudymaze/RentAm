import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../cities/_helpers';
import { z } from 'zod';

const Schema = z.object({
  listing_id: z.string().uuid(),
  flag_reason: z.string().min(5, 'Flag reason must be at least 5 characters').max(500),
  admin_notes: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  let userId: string;
  let adminSupabase: any;
  try {
    ({ userId, adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) { return res as Response; }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { listing_id, flag_reason, admin_notes } = parsed.data;

  const { data: listing } = await adminSupabase
    .from('property_listings')
    .select('id, status')
    .eq('id', listing_id)
    .single();

  if (!listing) return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });

  const now = new Date().toISOString();

  // Log as flagged for review
  const { error: logErr } = await adminSupabase.from('listing_verification_logs').insert({
    listing_id,
    admin_id: userId,
    verification_type: 'manual_flagged_for_review',
    verification_result: 'flagged_for_manual_review',
    admin_notes: `${flag_reason}${admin_notes ? '\n\n' + admin_notes : ''}`,
    verified_at: now,
  });

  if (logErr) return NextResponse.json({ success: false, error: 'Failed to flag listing' }, { status: 500 });

  await adminSupabase.from('listing_status_history').insert({
    listing_id,
    old_status: listing.status,
    new_status: listing.status,
    changed_by: userId,
    changed_at: now,
    reason: `Flagged for review: ${flag_reason}`,
  });

  return NextResponse.json({ success: true, data: { listing_id, flagged_at: now } });
}
