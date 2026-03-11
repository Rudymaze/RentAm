import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest, mapCityRow } from '../../../cities/_helpers';

export async function GET(req: NextRequest) {
  let userId: string;
  let adminSupabase: any;
  try {
    ({ userId, adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) {
    return res as Response;
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
  const search = searchParams.get('search') ?? '';
  const region = searchParams.get('region') ?? '';
  const status = searchParams.get('status') ?? 'active';

  let query = adminSupabase
    .from('cameroon_cities')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name_en.ilike.%${search}%,name_fr.ilike.%${search}%`);
  }

  if (region) {
    query = query.eq('region', region);
  }

  if (status === 'active') {
    query = query.eq('is_active', true);
  } else if (status === 'inactive') {
    query = query.eq('is_active', false);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('name_en', { ascending: true })
    .range(from, to);

  if (error) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      cities: (data ?? []).map(mapCityRow),
      total: count ?? 0,
      page,
      limit,
      lastUpdated: new Date().toISOString(),
    },
  });
}
