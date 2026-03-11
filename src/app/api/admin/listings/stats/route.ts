import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../cities/_helpers';

export async function GET(req: NextRequest) {
  let adminSupabase: any;
  try {
    ({ adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) { return res as Response; }

  const statuses = ['pending_review', 'active', 'rejected', 'archived', 'expired', 'draft'];

  const counts = await Promise.all(
    statuses.map(async (status) => {
      const { count } = await adminSupabase
        .from('property_listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', status);
      return { status, count: count ?? 0 };
    })
  );

  const statusMap = Object.fromEntries(counts.map(({ status, count }) => [status, count]));

  // Approvals today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: approvedToday } = await adminSupabase
    .from('property_listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('approved_at', todayStart.toISOString());

  const { count: rejectedToday } = await adminSupabase
    .from('property_listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'rejected')
    .gte('rejected_at', todayStart.toISOString());

  return NextResponse.json({
    success: true,
    data: {
      pending: statusMap['pending_review'] ?? 0,
      active: statusMap['active'] ?? 0,
      rejected: statusMap['rejected'] ?? 0,
      archived: statusMap['archived'] ?? 0,
      expired: statusMap['expired'] ?? 0,
      draft: statusMap['draft'] ?? 0,
      approved_today: approvedToday ?? 0,
      rejected_today: rejectedToday ?? 0,
    },
  });
}
