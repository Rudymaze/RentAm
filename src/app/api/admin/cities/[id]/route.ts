import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest, mapCityRow } from '../../../cities/_helpers';
import { CityFormSchema } from '@/features/cities/shared/validation';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let userId: string;
  let adminSupabase: any;
  try {
    ({ userId, adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) {
    return res as Response;
  }

  const { id } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const partialSchema = CityFormSchema.partial();
  const parsed = partialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { success: false, error: 'At least one field must be provided' },
      { status: 400 }
    );
  }

  const { nameEn, nameFr, region, latitude, longitude, population, isActive } = parsed.data;

  // Check for duplicate if name/region changed
  if (nameEn || nameFr || region) {
    const { data: current } = await adminSupabase
      .from('cameroon_cities')
      .select('name_en, name_fr, region')
      .eq('id', id)
      .single();

    if (current) {
      const checkEn = nameEn ?? current.name_en;
      const checkFr = nameFr ?? current.name_fr;
      const checkRegion = region ?? current.region;

      const { data: duplicate } = await adminSupabase
        .from('cameroon_cities')
        .select('id')
        .eq('name_en', checkEn)
        .eq('name_fr', checkFr)
        .eq('region', checkRegion)
        .neq('id', id)
        .maybeSingle();

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'A city with this name and region already exists' },
          { status: 409 }
        );
      }
    }
  }

  const updates: Record<string, any> = {};
  if (nameEn !== undefined) updates.name_en = nameEn;
  if (nameFr !== undefined) updates.name_fr = nameFr;
  if (region !== undefined) updates.region = region;
  if (latitude !== undefined) updates.latitude = latitude;
  if (longitude !== undefined) updates.longitude = longitude;
  if (population !== undefined) updates.population = population;
  if (isActive !== undefined) updates.is_active = isActive;

  const { data, error } = await adminSupabase
    .from('cameroon_cities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: 'City not found or update failed' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: mapCityRow(data) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let adminSupabase: any;
  try {
    ({ adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) {
    return res as Response;
  }

  const { id } = params;

  const { error } = await adminSupabase
    .from('cameroon_cities')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: 'City not found or delete failed' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'City deleted' });
}
