import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../cities/_helpers';
import { z } from 'zod';

const Schema = z.object({
  listing_ids: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(['approve', 'reject', 'archive']),
  rejection_reason: z.string().optional(),
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

  const { listing_ids, action, rejection_reason, admin_notes } = parsed.data;

  if (action === 'reject' && !rejection_reason) {
    return NextResponse.json({ success: false, error: 'rejection_reason is required for reject action' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();

  const statusMap: Record<string, string> = { approve: 'active', reject: 'rejected', archive: 'archived' };
  const newStatus = statusMap[action];

  const updates: Record<string, unknown> = { status: newStatus, updated_at: now };
  if (action === 'approve') { updates.approved_at = now; updates.approved_by = userId; updates.listing_expiration_date = expiresAt; }
  if (action === 'reject') { updates.rejected_at = now; updates.rejected_by = userId; updates.rejection_reason = rejection_reason; }
  if (action === 'archive') { updates.archived_at = now; }
  if (admin_notes) updates.admin_review_notes = admin_notes;

  const { data: updated, error } = await adminSupabase
    .from('property_listings')
    .update(updates)
    .in('id', listing_ids)
    .eq('status', 'pending_review')
    .select('id, status');

  if (error) return NextResponse.json({ success: false, error: 'Bulk action failed' }, { status: 500 });

  // Log history for each updated listing
  const historyRows = (updated ?? []).map((row: any) => ({
    listing_id: row.id,
    old_status: 'pending_review',
    new_status: newStatus,
    changed_by: userId,
    changed_at: now,
    reason: admin_notes ?? `Bulk ${action} by admin`,
  }));

  if (historyRows.length > 0) {
    await adminSupabase.from('listing_status_history').insert(historyRows);
  }

  return NextResponse.json({
    success: true,
    data: {
      processed: (updated ?? []).length,
      action,
      listing_ids: (updated ?? []).map((r: any) => r.id),
    },
  });
}
