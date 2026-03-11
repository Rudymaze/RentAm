import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, serverErrorResponse } from '../../_helpers';
import { z } from 'zod';

const SaveDraftSchema = z.object({
  current_step: z.number().int().min(1).max(6),
  draft_data: z.record(z.string(), z.unknown()),
  listing_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = SaveDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { current_step, draft_data, listing_id } = parsed.data;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Upsert: find existing draft for user (with same listing_id match)
  const existingQuery = supabase
    .from('property_listing_drafts')
    .select('id')
    .eq('user_id', user.id);

  const { data: existing } = listing_id
    ? await existingQuery.eq('listing_id', listing_id).maybeSingle()
    : await existingQuery.is('listing_id', null).maybeSingle();

  let result;
  if (existing) {
    result = await supabase
      .from('property_listing_drafts')
      .update({ current_step, draft_data, expires_at: expiresAt, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('id, current_step, updated_at')
      .single();
  } else {
    result = await supabase
      .from('property_listing_drafts')
      .insert({ user_id: user.id, listing_id: listing_id ?? null, current_step, draft_data, expires_at: expiresAt })
      .select('id, current_step, updated_at')
      .single();
  }

  if (result.error) return serverErrorResponse('Failed to save draft');

  return NextResponse.json({ success: true, data: result.data });
}
