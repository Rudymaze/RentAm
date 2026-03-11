import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const AddFavoriteSchema = z.object({
  cityId: z.string().uuid('Invalid city ID'),
});

export async function POST(req: NextRequest) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = AddFavoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { cityId } = parsed.data;

  // Verify city exists and is active
  const { data: city } = await supabase
    .from('cameroon_cities')
    .select('id')
    .eq('id', cityId)
    .eq('is_active', true)
    .maybeSingle();

  if (!city) {
    return NextResponse.json({ success: false, error: 'City not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('city_favorites')
    .upsert({ user_id: user.id, city_id: cityId }, { onConflict: 'user_id,city_id' })
    .select('id, created_at')
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to add favorite' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { id: data.id, cityId, createdAt: data.created_at } }, { status: 201 });
}
