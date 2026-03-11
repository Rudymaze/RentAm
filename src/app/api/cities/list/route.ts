import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { searchParams } = req.nextUrl;
  const region = searchParams.get('region') ?? '';
  const lang = searchParams.get('lang') === 'fr' ? 'fr' : 'en';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));

  let query = supabase
    .from('cameroon_cities')
    .select('id, name_en, name_fr, region, latitude, longitude', { count: 'exact' })
    .eq('is_active', true);

  if (region) query = query.eq('region', region);

  const nameCol = lang === 'fr' ? 'name_fr' : 'name_en';
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order(nameCol, { ascending: true })
    .range(from, to);

  if (error) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }

  const cities = (data ?? []).map((row) => ({
    id: row.id,
    name: lang === 'fr' ? row.name_fr : row.name_en,
    nameEn: row.name_en,
    nameFr: row.name_fr,
    region: row.region,
    latitude: row.latitude,
    longitude: row.longitude,
  }));

  return NextResponse.json(
    { success: true, data: { cities, total: count ?? 0, page, limit } },
    { headers: { 'Cache-Control': 'public, max-age=300' } }
  );
}
