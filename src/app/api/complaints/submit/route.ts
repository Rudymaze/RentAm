import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, serverErrorResponse } from '../../properties/_helpers';
import { z } from 'zod';

const RESOURCE_TYPES = ['listing', 'user', 'inquiry'] as const;
const REASONS = ['spam', 'scam_or_fraud', 'inappropriate_content', 'harassment', 'other'] as const;

const Schema = z.object({
  reported_user_id: z.string().uuid(),
  resource_type: z.enum(RESOURCE_TYPES),
  resource_id: z.string().uuid(),
  reason: z.enum(REASONS),
  details: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
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

  const { reported_user_id, resource_type, resource_id, reason, details } = parsed.data;

  // Can't report yourself
  if (reported_user_id === user.id) {
    return NextResponse.json({ success: false, error: 'You cannot report yourself.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('user_complaints')
    .insert({
      reporter_id: user.id,
      reported_user_id,
      resource_type,
      resource_id,
      reason,
      details: details ?? null,
      status: 'new',
      admin_id: null,
    })
    .select('id, reporter_id, reported_user_id, resource_type, resource_id, reason, details, status, created_at')
    .single();

  if (error) return serverErrorResponse('Failed to submit complaint');

  return NextResponse.json({ success: true, data }, { status: 201 });
}
