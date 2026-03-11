import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../cities/_helpers';

// Rate limiter: 20 req/min per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string, ip: string): boolean {
  const key = `admin-metrics:${userId}:${ip}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  let userId: string;
  let adminSupabase: ReturnType<typeof import('../../../cities/_helpers')['createSupabaseAdminClient']>;
  try {
    ({ userId, adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) { return res as Response; }

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!checkRateLimit(userId, ip)) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });
  }

  // Parse and validate query params
  const sp = req.nextUrl.searchParams;
  const dateRangeRaw = parseInt(sp.get('dateRange') ?? '30', 10);
  if (![7, 30, 90].includes(dateRangeRaw)) {
    return NextResponse.json({ success: false, error: 'Invalid dateRange. Use 7, 30, or 90.' }, { status: 400 });
  }
  const city_id = sp.get('city_id') ?? undefined;
  const listing_type = sp.get('listing_type') ?? undefined;
  if (listing_type && !['rent', 'sale'].includes(listing_type)) {
    return NextResponse.json({ success: false, error: 'Invalid listing_type. Use rent or sale.' }, { status: 400 });
  }

  // Date ranges
  const now = new Date();
  const endDate = now.toISOString();
  const startDate = new Date(Date.now() - dateRangeRaw * 86_400_000).toISOString();
  const prevStartDate = new Date(Date.now() - dateRangeRaw * 2 * 86_400_000).toISOString();

  // Current month range
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

  try {
    // Build base listing queries
    const buildListingQuery = (from: string, to: string) => {
      let q = adminSupabase
        .from('property_listings')
        .select('id, status', { count: 'exact' })
        .gte('created_at', from)
        .lte('created_at', to);
      if (city_id) q = q.eq('city_id', city_id);
      if (listing_type) q = q.eq('listing_type', listing_type);
      return q;
    };

    // Run all queries in parallel
    const [
      totalListingsResult,
      activeListingsResult,
      pendingListingsResult,
      rejectedListingsResult,
      archivedListingsResult,
      prevListingsResult,
      totalUsersResult,
      tenantsResult,
      landlordsResult,
      revenueResult,
      fraudAlertsResult,
      inquiriesResult,
      prevUsersResult,
      prevRevenueResult,
    ] = await Promise.all([
      buildListingQuery(startDate, endDate),
      adminSupabase.from('property_listings').select('id', { count: 'exact' }).eq('status', 'approved').gte('created_at', startDate).lte('created_at', endDate),
      adminSupabase.from('property_listings').select('id', { count: 'exact' }).eq('status', 'pending_review').gte('created_at', startDate).lte('created_at', endDate),
      adminSupabase.from('property_listings').select('id', { count: 'exact' }).eq('status', 'rejected').gte('created_at', startDate).lte('created_at', endDate),
      adminSupabase.from('property_listings').select('id', { count: 'exact' }).eq('status', 'archived').gte('created_at', startDate).lte('created_at', endDate),
      buildListingQuery(prevStartDate, startDate),
      adminSupabase.from('profiles').select('id', { count: 'exact' }),
      adminSupabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'tenant'),
      adminSupabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'landlord'),
      adminSupabase.from('listing_promotions').select('cost_fcfa').eq('payment_status', 'completed').gte('created_at', monthStart).lte('created_at', monthEnd),
      adminSupabase.from('fraud_alerts').select('id', { count: 'exact' }).in('status', ['new', 'investigating']),
      adminSupabase.from('inquiries').select('id', { count: 'exact' }).gte('created_at', monthStart).lte('created_at', monthEnd),
      adminSupabase.from('profiles').select('id', { count: 'exact' }).gte('created_at', startDate).lte('created_at', endDate),
      adminSupabase.from('listing_promotions').select('cost_fcfa').eq('payment_status', 'completed').gte('created_at', prevStartDate).lte('created_at', startDate),
    ]);

    // Calculate revenue
    const revenue = (revenueResult.data ?? []).reduce((sum: number, r: { cost_fcfa: number }) => sum + Number(r.cost_fcfa), 0);
    const prevRevenue = (prevRevenueResult.data ?? []).reduce((sum: number, r: { cost_fcfa: number }) => sum + Number(r.cost_fcfa), 0);

    const totalListings = totalListingsResult.count ?? 0;
    const prevListings = prevListingsResult.count ?? 0;
    const totalUsers = totalUsersResult.count ?? 0;
    const prevUsers = prevUsersResult.count ?? 0;

    // Calculate trends as percentage change
    const calcTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          total_listings: totalListings,
          active_listings: activeListingsResult.count ?? 0,
          pending_listings: pendingListingsResult.count ?? 0,
          rejected_listings: rejectedListingsResult.count ?? 0,
          expired_listings: archivedListingsResult.count ?? 0,
          avg_approval_time_hours: 0, // requires approved_at column not in base schema
          total_users: totalUsers,
          total_tenants: tenantsResult.count ?? 0,
          total_landlords: landlordsResult.count ?? 0,
          promotion_revenue_fcfa: revenue,
          fraud_alerts_count: fraudAlertsResult.count ?? 0,
          inquiries_this_month: inquiriesResult.count ?? 0,
        },
        trends: {
          listings_trend: calcTrend(totalListings, prevListings),
          users_trend: calcTrend(totalUsers, prevUsers),
          revenue_trend: calcTrend(revenue, prevRevenue),
        },
        last_updated: now.toISOString(),
      },
    });
  } catch (err) {
    console.error('[admin/dashboard/metrics]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
