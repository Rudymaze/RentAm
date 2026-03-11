import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../../cities/_helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let adminSupabase: any;
  try {
    ({ adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) { return res as Response; }

  const { id } = await params;

  const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') ?? '50', 10)));

  const { data: listing } = await adminSupabase
    .from('property_listings')
    .select('id, status')
    .eq('id', id)
    .single();

  if (!listing) return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });

  const { data: logs, error } = await adminSupabase
    .from('listing_verification_logs')
    .select(`
      id, verification_type, verification_result,
      checklist_items, rejection_reason, admin_notes,
      auto_verification_flags, verified_at, created_at,
      admin:profiles!admin_id(id, full_name)
    `)
    .eq('listing_id', id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });

  return NextResponse.json({
    success: true,
    data: {
      listing_id: id,
      current_status: listing.status,
      history: logs ?? [],
      total: (logs ?? []).length,
    },
  });
}
