import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../cities/_helpers';

export async function GET(req: NextRequest) {
  let adminSupabase: any;
  try {
    ({ adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) { return res as Response; }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const city_id = searchParams.get('city_id') ?? '';
  const listing_type = searchParams.get('listing_type') ?? '';
  const sort = searchParams.get('sort') === 'oldest' ? true : false;
  const search = (searchParams.get('search') ?? '').trim();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = adminSupabase
    .from('property_listings')
    .select(`
      id, title, listing_type, created_at,
      landlord:profiles!created_by(id, full_name),
      city:cameroon_cities!city_id(id, name_en, name_fr),
      images:property_images(url, thumbnail_url, display_order)
    `, { count: 'exact' })
    .eq('status', 'pending_review')
    .order('created_at', { ascending: sort })
    .range(from, to);

  if (city_id) query = query.eq('city_id', city_id);
  if (listing_type) query = query.eq('listing_type', listing_type);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });

  // Get total pending count
  const { count: pendingCount } = await adminSupabase
    .from('property_listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending_review');

  const listings = (data ?? []).map((row: any) => {
    const images = (row.images ?? []).sort((a: any, b: any) => a.display_order - b.display_order);
    return {
      id: row.id,
      title: row.title,
      landlord_name: row.landlord?.full_name ?? 'Unknown',
      city_name: row.city?.name_en ?? '',
      listing_type: row.listing_type,
      created_at: row.created_at,
      thumbnail_url: images[0]?.thumbnail_url ?? images[0]?.url ?? null,
      status: 'pending_review',
    };
  });

  return NextResponse.json({
    success: true,
    data: { listings, total: count ?? 0, pending_count: pendingCount ?? 0, page, limit },
  });
}
