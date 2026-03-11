import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../../cities/_helpers';
import { z } from 'zod';
import type { RejectionReason } from '@/features/admin/listings/types';

const REJECTION_REASONS: RejectionReason[] = [
  'photos_fake', 'location_invalid', 'pricing_unrealistic',
  'insufficient_description', 'landlord_unverified', 'duplicate_listing',
  'policy_violation', 'other',
];

const Schema = z.object({
  rejection_reason: z.enum(REJECTION_REASONS as [RejectionReason, ...RejectionReason[]]),
  admin_notes: z.string().min(10, 'Please provide at least 10 characters of notes').max(1000),
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

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { rejection_reason, admin_notes, checklist } = parsed.data;

  const { data: listing } = await adminSupabase
    .from('property_listings')
    .select('id, status')
    .eq('id', params.id)
    .single();

  if (!listing) return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
  if (listing.status !== 'pending_review') {
    return NextResponse.json({ success: false, error: 'Only pending_review listings can be rejected' }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: updated, error } = await adminSupabase
    .from('property_listings')
    .update({
      status: 'rejected',
      rejection_reason,
      rejected_at: now,
      rejected_by: userId,
      admin_review_notes: admin_notes,
      updated_at: now,
    })
    .eq('id', params.id)
    .select('id, title, status, rejection_reason, rejected_at')
    .single();

  if (error) return NextResponse.json({ success: false, error: 'Failed to reject listing' }, { status: 500 });

  await adminSupabase.from('listing_verification_logs').insert({
    listing_id: params.id,
    admin_id: userId,
    verification_type: 'manual_rejected',
    verification_result: 'failed',
    checklist_items: checklist ?? null,
    rejection_reason,
    admin_notes,
    verified_at: now,
  });

  await adminSupabase.from('listing_status_history').insert({
    listing_id: params.id,
    old_status: 'pending_review',
    new_status: 'rejected',
    changed_by: userId,
    changed_at: now,
    reason: `Rejected: ${rejection_reason}`,
  });

  return NextResponse.json({ success: true, data: updated });
}
