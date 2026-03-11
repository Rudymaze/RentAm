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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const query = (searchParams.get('q') ?? '').trim();
  const lang = searchParams.get('lang') === 'fr' ? 'fr' : 'en';
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));

  if (!query) {
    return NextResponse.json({ success: false, error: 'Search query is required' }, { status: 400 });
  }

  const nameCol = lang === 'fr' ? 'name_fr' : 'name_en';
  const otherCol = lang === 'fr' ? 'name_en' : 'name_fr';

  const { data, error } = await supabase
    .from('cameroon_cities')
    .select('id, name_en, name_fr, region, latitude, longitude, is_active')
    .eq('is_active', true)
    .or(`${nameCol}.ilike.%${query}%,${otherCol}.ilike.%${query}%`)
    .order(nameCol, { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }

  // Record recent search
  if (data && data.length > 0) {
    await supabase.from('city_recent_searches').upsert(
      { user_id: user.id, city_id: data[0].id, searched_at: new Date().toISOString() },
      { onConflict: 'user_id,city_id' }
    );
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

  return NextResponse.json({ success: true, data: { cities, total: cities.length } });
}
