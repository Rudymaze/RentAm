import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../../cities/_helpers';
import { z } from 'zod';

const VALID_STATUSES = ['new', 'investigating', 'resolved', 'dismissed'] as const;

const Schema = z.object({
  status: z.enum(VALID_STATUSES),
  resolution_notes: z.string().max(2000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  let adminSupabase: Awaited<ReturnType<typeof verifyAdminFromRequest>>['adminSupabase'];
  try {
    ({ userId, adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) { return res as Response; }

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { status: newStatus, resolution_notes } = parsed.data;

  // Verify complaint exists
  const { data: complaint, error: findError } = await adminSupabase
    .from('user_complaints')
    .select('id, status')
    .eq('id', id)
    .single();
  if (findError || !complaint) return NextResponse.json({ success: false, error: 'Complaint not found' }, { status: 404 });

  const { data: updated, error } = await adminSupabase
    .from('user_complaints')
    .update({
      status: newStatus,
      resolution_notes: resolution_notes ?? null,
      admin_id: userId,
    })
    .eq('id', id)
    .select('id, status, resolution_notes, admin_id, updated_at')
    .single();

  if (error) {
    console.error('[admin/complaints/:id/status]', error);
    return NextResponse.json({ success: false, error: 'Failed to update complaint status' }, { status: 500 });
  }

  // Log action
  const actionType = newStatus === 'dismissed' ? 'dismiss_complaint' : 'resolve_complaint';
  if (['resolved', 'dismissed'].includes(newStatus)) {
    await adminSupabase.from('admin_actions_log').insert({
      admin_id: userId,
      action_type: actionType,
      resource_type: 'complaint',
      resource_id: id,
      details: { new_status: newStatus, resolution_notes },
    });
  }

  return NextResponse.json({ success: true, data: updated });
}
