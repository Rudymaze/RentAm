import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, serverErrorResponse, rateLimitResponse, checkRateLimit } from '../_helpers';

export async function GET(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  if (!checkRateLimit(`sent:${user.id}`, 20)) return rateLimitResponse();

  // Check role is tenant
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profileError || !profile) return serverErrorResponse('Failed to fetch user profile');
  if (profile.role !== 'tenant') return forbiddenResponse('Only tenants can view sent inquiries');

  const sp = req.nextUrl.searchParams;
  const property_id = sp.get('property_id') ?? undefined;
  const status = sp.get('status') ?? undefined;
  const date_from = sp.get('date_from') ?? undefined;
  const date_to = sp.get('date_to') ?? undefined;
  const search = sp.get('search') ?? undefined;
  const sort_by = sp.get('sort_by') ?? 'newest';
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') ?? '20', 10)));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('inquiries')
    .select(
      `id, template_type, message, status, has_response, created_at, updated_at,
       property_id,
       property_listings!property_id(id, title, images),
       profiles!landlord_id(id, full_name, avatar_url)`,
      { count: 'exact' }
    )
    .eq('tenant_id', user.id)
    .is('deleted_at', null)
    .range(from, to);

  if (property_id) query = query.eq('property_id', property_id);
  if (status) query = query.eq('status', status);
  if (date_from) query = query.gte('created_at', date_from);
  if (date_to) query = query.lte('created_at', date_to);
  if (search) query = query.ilike('message', `%${search}%`);

  query = query.order('created_at', { ascending: sort_by === 'oldest' });

  const { data, error, count } = await query;
  if (error) return serverErrorResponse('Failed to fetch sent inquiries');

  const inquiries = (data ?? []).map((row: Record<string, unknown>) => {
    const property = row.property_listings as Record<string, unknown> | null;
    const images = Array.isArray(property?.images) ? property.images : [];
    return {
      id: row.id,
      template_type: row.template_type,
      message: row.message,
      status: row.status,
      has_response: row.has_response,
      created_at: row.created_at,
      updated_at: row.updated_at,
      property: property ? {
        id: property.id,
        title: property.title,
        thumbnail_url: images[0]?.url ?? null,
      } : null,
      landlord: row.profiles,
    };
  });

  // Count awaiting_response
  const { count: awaitingCount } = await supabase
    .from('inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', user.id)
    .eq('status', 'awaiting_response')
    .is('deleted_at', null);

  const total = count ?? 0;
  return NextResponse.json({
    success: true,
    data: {
      inquiries,
      total_count: total,
      page,
      has_more: from + inquiries.length < total,
      awaiting_response_count: awaitingCount ?? 0,
    },
  });
}
