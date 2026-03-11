import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../cities/_helpers';
import { CityFormSchema } from '@/features/cities/shared/validation';
import { z } from 'zod';

const ImportSchema = z.array(CityFormSchema).min(1).max(500);

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

  const parsed = ImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const rows = parsed.data.map((city) => ({
    name_en: city.nameEn,
    name_fr: city.nameFr,
    region: city.region,
    latitude: city.latitude,
    longitude: city.longitude,
    population: city.population ?? null,
    is_active: city.isActive ?? true,
    created_by: userId,
  }));

  // Upsert on (name_en, name_fr, region) to avoid duplicates
  const { data, error } = await adminSupabase
    .from('cameroon_cities')
    .upsert(rows, { onConflict: 'name_en,name_fr,region', ignoreDuplicates: false })
    .select('id');

  if (error) {
    return NextResponse.json({ success: false, error: 'Import failed', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: { imported: data?.length ?? 0, total: rows.length },
  });
}
