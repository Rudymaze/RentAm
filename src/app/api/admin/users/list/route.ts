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
  const role = sp.get('role') ?? undefined;
  const status = sp.get('status') ?? undefined;
  const search = sp.get('search') ?? undefined;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = adminSupabase
    .from('profiles')
    .select('id, full_name, email, role, status, status_reason, suspended_until, created_at, updated_at, avatar_url', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (role && ['tenant', 'landlord', 'agent', 'admin'].includes(role)) query = query.eq('role', role);
  if (status && ['active', 'suspended', 'banned'].includes(status)) query = query.eq('status', status);
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) {
    console.error('[admin/users/list]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }

  const total = count ?? 0;
  return NextResponse.json({
    success: true,
    data: { users: data ?? [], total, page, hasMore: from + (data?.length ?? 0) < total },
  });
}
