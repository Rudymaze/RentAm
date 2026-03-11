import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../cities/_helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let adminSupabase: Awaited<ReturnType<typeof verifyAdminFromRequest>>['adminSupabase'];
  try {
    ({ adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) { return res as Response; }

  const { id } = await params;

  // Fetch all data in parallel
  const [
    profileResult,
    listingsResult,
    sentInquiriesResult,
    receivedInquiriesResult,
    fraudAlertsResult,
    complaintsFiledResult,
    complaintsAgainstResult,
    adminActionsResult,
  ] = await Promise.all([
    adminSupabase.from('profiles').select('*').eq('id', id).single(),
    adminSupabase.from('property_listings').select('id, title, status, listing_type, rental_price, sale_price, created_at').eq('created_by', id).order('created_at', { ascending: false }),
    adminSupabase.from('inquiries').select('id, status, message, created_at, property_id').eq('tenant_id', id).order('created_at', { ascending: false }).limit(20),
    adminSupabase.from('inquiries').select('id, status, message, created_at, property_id').eq('landlord_id', id).order('created_at', { ascending: false }).limit(20),
    adminSupabase.from('fraud_alerts').select('id, alert_type, severity, status, description, created_at').eq('user_id', id).order('created_at', { ascending: false }),
    adminSupabase.from('user_complaints').select('id, reason, status, resource_type, created_at').eq('reporter_id', id).order('created_at', { ascending: false }),
    adminSupabase.from('user_complaints').select('id, reason, status, resource_type, created_at').eq('reported_user_id', id).order('created_at', { ascending: false }),
    adminSupabase.from('admin_actions_log').select('id, action_type, resource_type, details, created_at').eq('target_user_id', id).order('created_at', { ascending: false }).limit(50),
  ]);

  if (profileResult.error || !profileResult.data) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      profile: profileResult.data,
      listings: listingsResult.data ?? [],
      inquiries: {
        sent: sentInquiriesResult.data ?? [],
        received: receivedInquiriesResult.data ?? [],
      },
      fraud_alerts: fraudAlertsResult.data ?? [],
      complaints: {
        filed: complaintsFiledResult.data ?? [],
        against: complaintsAgainstResult.data ?? [],
      },
      admin_actions: adminActionsResult.data ?? [],
    },
  });
}
