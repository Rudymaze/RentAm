import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../cities/_helpers';
import { z } from 'zod';

const Schema = z.object({
  listing_id: z.string().uuid(),
  checklist_items: z.object({
    photos_authentic: z.boolean().optional(),
    location_valid: z.boolean().optional(),
    pricing_reasonable: z.boolean().optional(),
    description_detailed: z.boolean().optional(),
    landlord_verified: z.boolean().optional(),
  }).optional(),
  photo_verification: z.record(z.string(), z.unknown()).optional(),
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

  const { listing_id, checklist_items, photo_verification, admin_notes } = parsed.data;

  // Verify listing exists
  const { data: listing } = await adminSupabase
    .from('property_listings')
    .select('id, status')
    .eq('id', listing_id)
    .single();

  if (!listing) return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });

  const now = new Date().toISOString();

  // Upsert in-progress verification log
  const { data: existing } = await adminSupabase
    .from('listing_verification_logs')
    .select('id')
    .eq('listing_id', listing_id)
    .eq('admin_id', userId)
    .eq('verification_type', 'manual_verification_in_progress')
    .maybeSingle();

  let logId: string;
  if (existing) {
    await adminSupabase
      .from('listing_verification_logs')
      .update({
        checklist_items: checklist_items ?? null,
        auto_verification_flags: photo_verification ?? null,
        admin_notes: admin_notes ?? null,
        verified_at: now,
      })
      .eq('id', existing.id);
    logId = existing.id;
  } else {
    const { data: inserted } = await adminSupabase
      .from('listing_verification_logs')
      .insert({
        listing_id,
        admin_id: userId,
        verification_type: 'manual_verification_in_progress',
        verification_result: 'flagged_for_manual_review',
        checklist_items: checklist_items ?? null,
        auto_verification_flags: photo_verification ?? null,
        admin_notes: admin_notes ?? null,
        verified_at: now,
      })
      .select('id')
      .single();
    logId = inserted?.id;
  }

  return NextResponse.json({
    success: true,
    data: { verification_log_id: logId, listing_id, saved_at: now },
  });
}
