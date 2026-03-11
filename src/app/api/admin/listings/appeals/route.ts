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
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await adminSupabase
    .from('property_listings')
    .select(`
      id, title, listing_type, status,
      appeal_submitted_at, appeal_explanation, appeal_evidence_urls,
      rejection_reason, rejected_at,
      landlord:profiles!created_by(id, full_name, phone_number),
      city:cameroon_cities!city_id(name_en)
    `, { count: 'exact' })
    .eq('status', 'under_appeal')
    .order('appeal_submitted_at', { ascending: true })
    .range(from, to);

  if (error) return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });

  const listings = (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    listing_type: row.listing_type,
    city_name: row.city?.name_en ?? '',
    landlord_name: row.landlord?.full_name ?? '',
    landlord_phone: row.landlord?.phone_number ?? null,
    original_rejection_reason: row.rejection_reason,
    rejected_at: row.rejected_at,
    appeal_explanation: row.appeal_explanation,
    appeal_evidence_urls: row.appeal_evidence_urls ?? [],
    appeal_submitted_at: row.appeal_submitted_at,
  }));

  return NextResponse.json({
    success: true,
    data: { listings, total: count ?? 0, page, limit },
  });
}
