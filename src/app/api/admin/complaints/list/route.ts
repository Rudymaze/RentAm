import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../cities/_helpers';

export async function GET(req: NextRequest) {
  let adminSupabase: Awaited<ReturnType<typeof verifyAdminFromRequest>>['adminSupabase'];
  try {
    ({ adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) { return res as Response; }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '20', 10)));
  const status = sp.get('status') ?? undefined;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = adminSupabase
    .from('user_complaints')
    .select(
      `id, resource_type, resource_id, reason, details, status, resolution_notes, created_at, updated_at,
       reporter:profiles!reporter_id(id, full_name, email, avatar_url),
       reported:profiles!reported_user_id(id, full_name, email, avatar_url)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status && ['new', 'investigating', 'resolved', 'dismissed'].includes(status)) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('[admin/complaints/list]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch complaints' }, { status: 500 });
  }

  const total = count ?? 0;
  return NextResponse.json({
    success: true,
    data: { complaints: data ?? [], total, page, hasMore: from + (data?.length ?? 0) < total },
  });
}
