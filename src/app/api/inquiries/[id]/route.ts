import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse, rateLimitResponse, checkRateLimit } from '../_helpers';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  if (!checkRateLimit(`inquiry-get:${user.id}`, 20)) return rateLimitResponse();

  const { id } = await params;

  // Fetch inquiry with joins
  const { data: inquiry, error } = await supabase
    .from('inquiries')
    .select(
      `id, template_type, message, contact_preferences, attachments, status,
       is_read_by_landlord, read_at, has_response, created_at, updated_at,
       tenant_id, landlord_id, property_id,
       property_listings!property_id(id, title, images, rental_price, sale_price, listing_type, address),
       tenant:profiles!tenant_id(id, full_name, avatar_url),
       landlord:profiles!landlord_id(id, full_name, avatar_url)`
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !inquiry) return notFoundResponse('Inquiry not found');

  // Verify user is tenant or landlord of this inquiry
  if (inquiry.tenant_id !== user.id && inquiry.landlord_id !== user.id) {
    return forbiddenResponse('Access denied');
  }

  // Fetch responses
  const { data: responses, error: responsesError } = await supabase
    .from('inquiry_responses')
    .select('id, sender_id, message, attachments, is_read_by_tenant, read_at, created_at')
    .eq('inquiry_id', id)
    .order('created_at', { ascending: true });

  if (responsesError) return serverErrorResponse('Failed to fetch responses');

  // Mark as read by current user
  if (user.id === inquiry.landlord_id && !inquiry.is_read_by_landlord) {
    await supabase
      .from('inquiries')
      .update({ is_read_by_landlord: true, read_at: new Date().toISOString() })
      .eq('id', id);
  }
  if (user.id === inquiry.tenant_id && responses && responses.length > 0) {
    const unreadResponseIds = responses
      .filter((r) => !r.is_read_by_tenant)
      .map((r) => r.id);
    if (unreadResponseIds.length > 0) {
      await supabase
        .from('inquiry_responses')
        .update({ is_read_by_tenant: true, read_at: new Date().toISOString() })
        .in('id', unreadResponseIds);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      inquiry,
      responses: responses ?? [],
      property: inquiry.property_listings,
      tenant: inquiry.tenant,
      landlord: inquiry.landlord,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  if (!checkRateLimit(`inquiry-delete:${user.id}`, 20)) return rateLimitResponse();

  const { id } = await params;

  const { data: inquiry, error } = await supabase
    .from('inquiries')
    .select('id, tenant_id, landlord_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !inquiry) return notFoundResponse('Inquiry not found');
  if (inquiry.tenant_id !== user.id && inquiry.landlord_id !== user.id) {
    return forbiddenResponse('Access denied');
  }

  const { error: updateError } = await supabase
    .from('inquiries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) return serverErrorResponse('Failed to delete inquiry');

  return NextResponse.json({ success: true });
}
