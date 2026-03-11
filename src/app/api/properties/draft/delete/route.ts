import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../_helpers';

export async function DELETE(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const draftId = req.nextUrl.searchParams.get('draft_id');
  if (!draftId) {
    return NextResponse.json({ success: false, error: 'draft_id is required' }, { status: 400 });
  }

  const { data: draft } = await supabase
    .from('property_listing_drafts')
    .select('id, user_id')
    .eq('id', draftId)
    .single();

  if (!draft) return notFoundResponse('Draft not found');
  if (draft.user_id !== user.id) return forbiddenResponse('Not your draft');

  const { error } = await supabase
    .from('property_listing_drafts')
    .delete()
    .eq('id', draftId);

  if (error) return serverErrorResponse('Failed to delete draft');

  return NextResponse.json({ success: true });
}
