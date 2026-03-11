import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../../cities/_helpers';
import { z } from 'zod';

const APPEAL_DECISION_REASONS = [
  'still_photos_fake', 'still_location_invalid', 'still_pricing_unrealistic',
  'still_description_insufficient', 'still_landlord_unverified',
  'still_duplicate', 'still_policy_violation', 'other',
] as const;

const Schema = z.object({
  decision: z.enum(['approve', 'deny']),
  decision_reason: z.enum(APPEAL_DECISION_REASONS).optional(),
  admin_notes: z.string().min(10, 'Admin notes required (min 10 chars)').max(1000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const { decision, decision_reason, admin_notes } = parsed.data;

  const { data: listing } = await adminSupabase
    .from('property_listings')
    .select('id, status')
    .eq('id', params.id)
    .single();

  if (!listing) return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
  if (listing.status !== 'under_appeal') {
    return NextResponse.json({ success: false, error: 'Listing is not under appeal' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const newStatus = decision === 'approve' ? 'active' : 'rejected';
  const verificationType = decision === 'approve' ? 'appeal_approved' : 'appeal_denied';

  const updates: Record<string, unknown> = { status: newStatus, updated_at: now };
  if (decision === 'approve') {
    updates.approved_at = now;
    updates.approved_by = userId;
    updates.listing_expiration_date = new Date(Date.now() + 90 * 86400000).toISOString();
  } else {
    updates.rejected_at = now;
    updates.rejected_by = userId;
    if (decision_reason) updates.rejection_reason = decision_reason;
  }

  const { data: updated, error } = await adminSupabase
    .from('property_listings')
    .update(updates)
    .eq('id', params.id)
    .select('id, status')
    .single();

  if (error) return NextResponse.json({ success: false, error: 'Failed to resolve appeal' }, { status: 500 });

  await adminSupabase.from('listing_verification_logs').insert({
    listing_id: params.id,
    admin_id: userId,
    verification_type: verificationType,
    verification_result: decision === 'approve' ? 'passed' : 'failed',
    rejection_reason: decision_reason ?? null,
    admin_notes,
    verified_at: now,
  });

  await adminSupabase.from('listing_status_history').insert({
    listing_id: params.id,
    old_status: 'under_appeal',
    new_status: newStatus,
    changed_by: userId,
    changed_at: now,
    reason: `Appeal ${decision === 'approve' ? 'approved' : 'denied'} by admin`,
  });

  return NextResponse.json({ success: true, data: { listing_id: params.id, status: newStatus, decision, resolved_at: now } });
}
