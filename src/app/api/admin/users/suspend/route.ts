import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../cities/_helpers';
import { z } from 'zod';

const Schema = z.object({
  user_id: z.string().uuid(),
  duration_days: z.number().int().min(1).max(365),
  reason: z.string().min(5).max(500),
});

export async function POST(req: NextRequest) {
  let userId: string;
  let adminSupabase: Awaited<ReturnType<typeof verifyAdminFromRequest>>['adminSupabase'];
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

  const { user_id, duration_days, reason } = parsed.data;

  // Verify user exists
  const { data: target, error: findError } = await adminSupabase
    .from('profiles')
    .select('id, role')
    .eq('id', user_id)
    .single();
  if (findError || !target) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  const suspended_until = new Date(Date.now() + duration_days * 86_400_000).toISOString();

  const { data: updated, error } = await adminSupabase
    .from('profiles')
    .update({ status: 'suspended', status_reason: reason, suspended_until })
    .eq('id', user_id)
    .select('id, full_name, email, role, status, status_reason, suspended_until')
    .single();

  if (error) {
    console.error('[admin/users/suspend]', error);
    return NextResponse.json({ success: false, error: 'Failed to suspend user' }, { status: 500 });
  }

  // Log action
  await adminSupabase.from('admin_actions_log').insert({
    admin_id: userId,
    action_type: 'suspend_user',
    resource_type: 'user',
    resource_id: user_id,
    target_user_id: user_id,
    details: { reason, duration_days, suspended_until },
  });

  return NextResponse.json({ success: true, data: updated });
}
