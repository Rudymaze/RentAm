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

  const lang = req.nextUrl.searchParams.get('lang') === 'fr' ? 'fr' : 'en';

  const { data, error } = await supabase
    .from('city_favorites')
    .select('id, created_at, city:cameroon_cities(id, name_en, name_fr, region, latitude, longitude)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch favorites' }, { status: 500 });
  }

  const favorites = (data ?? []).map((row: any) => ({
    id: row.id,
    createdAt: row.created_at,
    city: row.city
      ? {
          id: row.city.id,
          name: lang === 'fr' ? row.city.name_fr : row.city.name_en,
          nameEn: row.city.name_en,
          nameFr: row.city.name_fr,
          region: row.city.region,
          latitude: row.city.latitude,
          longitude: row.city.longitude,
        }
      : null,
  }));

  return NextResponse.json({ success: true, data: { favorites, total: favorites.length } });
}
