import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, serverErrorResponse } from '../_helpers';

export async function GET(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') ?? 'all';
  const city_id = searchParams.get('city_id') ?? '';
  const listing_type = searchParams.get('listing_type') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('property_listings')
    .select('id, title, status, listing_type, city_id, rental_price, sale_price, created_at, updated_at, images, view_count', { count: 'exact' })
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status !== 'all') query = query.eq('status', status);
  if (city_id) query = query.eq('city_id', city_id);
  if (listing_type) query = query.eq('listing_type', listing_type);

  const { data, error, count } = await query;
  if (error) return serverErrorResponse();

  return NextResponse.json({
    success: true,
    data: { listings: data ?? [], total: count ?? 0, page, limit },
  });
}
