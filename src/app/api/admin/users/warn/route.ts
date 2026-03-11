import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../cities/_helpers';
import { z } from 'zod';

const Schema = z.object({
  user_id: z.string().uuid(),
  message: z.string().min(5).max(1000),
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

  const { user_id, message } = parsed.data;

  // Verify user exists
  const { data: target, error: findError } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('id', user_id)
    .single();
  if (findError || !target) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  // Log warning action
  const { error: logError } = await adminSupabase.from('admin_actions_log').insert({
    admin_id: userId,
    action_type: 'warn_user',
    resource_type: 'user',
    resource_id: user_id,
    target_user_id: user_id,
    details: { message },
  });

  if (logError) {
    console.error('[admin/users/warn]', logError);
    return NextResponse.json({ success: false, error: 'Failed to log warning' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { message: 'Warning sent' } });
}
