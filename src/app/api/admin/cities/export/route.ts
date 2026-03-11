import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../cities/_helpers';

export async function GET(req: NextRequest) {
  let adminSupabase: any;
  try {
    ({ adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) {
    return res as Response;
  }

  const { searchParams } = req.nextUrl;
  const region = searchParams.get('region') ?? '';
  const status = searchParams.get('status') ?? 'all';
  const format = searchParams.get('format') ?? 'json'; // 'json' or 'csv'

  let query = adminSupabase
    .from('cameroon_cities')
    .select('id, name_en, name_fr, region, latitude, longitude, population, is_active, created_at, updated_at')
    .order('region', { ascending: true })
    .order('name_en', { ascending: true });

  if (region) query = query.eq('region', region);
  if (status === 'active') query = query.eq('is_active', true);
  else if (status === 'inactive') query = query.eq('is_active', false);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: 'Export failed' }, { status: 500 });
  }

  const cities = (data ?? []).map((row: any) => ({
    id: row.id,
    nameEn: row.name_en,
    nameFr: row.name_fr,
    region: row.region,
    latitude: row.latitude,
    longitude: row.longitude,
    population: row.population,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  if (format === 'csv') {
    const headers = ['id', 'nameEn', 'nameFr', 'region', 'latitude', 'longitude', 'population', 'isActive', 'createdAt', 'updatedAt'];
    const csvRows = [
      headers.join(','),
      ...cities.map((c: Record<string, unknown>) =>
        headers
          .map((h) => {
            const val = (c as any)[h] ?? '';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];
    return new Response(csvRows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="cameroon_cities.csv"',
      },
    });
  }

  return NextResponse.json({ success: true, data: { cities, total: cities.length } });
}
