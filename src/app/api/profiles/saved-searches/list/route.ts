import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, serverErrorResponse } from '../../../properties/_helpers';

import { applyRateLimit, STANDARD } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const limited = applyRateLimit(`saved-search:list:${user.id}`, STANDARD);
  if (limited) return limited;

  const sortBy = req.nextUrl.searchParams.get('sortBy') ?? 'newest';
  if (!['newest', 'oldest', 'recent'].includes(sortBy)) {
    return NextResponse.json({ success: false, error: 'Invalid sortBy value. Use newest, oldest, or recent.' }, { status: 400 });
  }

  let query = supabase
    .from('user_saved_searches')
    .select('id, search_name, filter_criteria, result_count, created_at, last_used_at')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (sortBy === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sortBy === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else {
    // recent = by last_used_at DESC, nulls last
    query = query.order('last_used_at', { ascending: false, nullsFirst: false });
  }

  const { data, error } = await query;
  if (error) return serverErrorResponse('Failed to fetch saved searches');

  return NextResponse.json({
    success: true,
    data: { searches: data ?? [], total: (data ?? []).length },
  });
}
