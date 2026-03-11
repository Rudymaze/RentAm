import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, serverErrorResponse } from '../../_helpers';

export async function GET(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const search = (searchParams.get('search') ?? '').trim();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('property_listing_drafts')
    .select('id, current_step, draft_data, listing_id, created_at, updated_at, expires_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (search) {
    // Filter by title in draft_data (JSONB path)
    query = query.ilike('draft_data->>title', `%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return serverErrorResponse();

  return NextResponse.json({
    success: true,
    data: {
      drafts: data ?? [],
      total: count ?? 0,
      page,
      hasMore: (count ?? 0) > page * limit,
    },
  });
}
