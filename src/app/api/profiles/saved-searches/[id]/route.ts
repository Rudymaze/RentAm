import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../../properties/_helpers';

// Simple in-memory rate limiter: 20 deletes/min per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });
  }

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
