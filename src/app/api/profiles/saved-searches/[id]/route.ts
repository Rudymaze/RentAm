import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../../properties/_helpers';

import { applyRateLimit, MODERATE } from '@/lib/rate-limit';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const limited = applyRateLimit(`saved-search:delete:${user.id}`, MODERATE);
  if (limited) return limited;

  const { id } = await params;

  // Find the saved search
  const { data: saved, error: findError } = await supabase
    .from('user_saved_searches')
    .select('id, user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (findError || !saved) return notFoundResponse('Saved search not found');
  if (saved.user_id !== user.id) return forbiddenResponse('You do not own this saved search');

  const { error: deleteError } = await supabase
    .from('user_saved_searches')
    .delete()
    .eq('id', id);

  if (deleteError) return serverErrorResponse('Failed to delete saved search');

  return NextResponse.json({
    success: true,
    data: { id, message: 'Saved search deleted' },
  });
}
