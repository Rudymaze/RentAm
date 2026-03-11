import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest, mapCityRow } from '../../../cities/_helpers';
import { CityFormSchema } from '@/features/cities/shared/validation';

export async function POST(req: NextRequest) {
  let userId: string;
  let adminSupabase: any;
  try {
    ({ userId, adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) {
    return res as Response;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CityFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { nameEn, nameFr, region, latitude, longitude, population, isActive } = parsed.data;

  // Check for duplicate city
  const { data: existing } = await adminSupabase
    .from('cameroon_cities')
    .select('id')
    .eq('name_en', nameEn)
    .eq('name_fr', nameFr)
    .eq('region', region)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { success: false, error: 'A city with this name and region already exists' },
      { status: 409 }
    );
  }

  const { data, error } = await adminSupabase
    .from('cameroon_cities')
    .insert({
      name_en: nameEn,
      name_fr: nameFr,
      region,
      latitude,
      longitude,
      population: population ?? null,
      is_active: isActive ?? true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to create city' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: mapCityRow(data) }, { status: 201 });
}
