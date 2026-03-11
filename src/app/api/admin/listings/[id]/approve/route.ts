import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../../cities/_helpers';
import { z } from 'zod';

const Schema = z.object({
  admin_notes: z.string().max(1000).optional(),
  checklist: z.object({
    photos_authentic: z.boolean().optional(),
    location_valid: z.boolean().optional(),
    pricing_reasonable: z.boolean().optional(),
    description_detailed: z.boolean().optional(),
    landlord_verified: z.boolean().optional(),
  }).optional(),
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

  let body: unknown = {};
  try { body = await req.json(); } catch { /* empty body ok */ }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 400 });
  }

  const { admin_notes, checklist } = parsed.data;

  const { data: listing } = await adminSupabase
    .from('property_listings')
    .select('id, status')
    .eq('id', params.id)
    .single();

  if (!listing) return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
  if (listing.status !== 'pending_review') {
    return NextResponse.json({ success: false, error: 'Only pending_review listings can be approved' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();

  const { data: updated, error } = await adminSupabase
    .from('property_listings')
    .update({
      status: 'active',
      approved_at: now,
      approved_by: userId,
      listing_expiration_date: expiresAt,
      admin_review_notes: admin_notes ?? null,
      updated_at: now,
    })
    .eq('id', params.id)
    .select('id, title, status, approved_at')
    .single();

  if (error) return NextResponse.json({ success: false, error: 'Failed to approve listing' }, { status: 500 });

  // Log verification
  await adminSupabase.from('listing_verification_logs').insert({
    listing_id: params.id,
    admin_id: userId,
    verification_type: 'manual_approved',
    verification_result: 'passed',
    checklist_items: checklist ?? null,
    admin_notes: admin_notes ?? null,
    verified_at: now,
  });

  // Log status history
  await adminSupabase.from('listing_status_history').insert({
    listing_id: params.id,
    old_status: 'pending_review',
    new_status: 'active',
    changed_by: userId,
    changed_at: now,
    reason: 'Approved by admin',
  });

  return NextResponse.json({ success: true, data: updated });
}
