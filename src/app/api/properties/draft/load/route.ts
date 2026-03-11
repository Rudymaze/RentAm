import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '../../_helpers';

export async function GET(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const draftId = req.nextUrl.searchParams.get('draft_id');

  let query = supabase
    .from('property_listing_drafts')
    .select('id, current_step, draft_data, listing_id, updated_at');

  if (draftId) {
    query = query.eq('id', draftId).eq('user_id', user.id);
  } else {
    query = query.eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1);
  }

  const { data, error } = draftId ? await query.single() : await query;

  if (error) return serverErrorResponse();

  const draft = Array.isArray(data) ? data[0] : data;
  if (!draft) return notFoundResponse('Draft not found');

  return NextResponse.json({ success: true, data: draft });
}
