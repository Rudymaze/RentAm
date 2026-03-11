import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse, rateLimitResponse, checkRateLimit } from '../../_helpers';

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  if (!checkRateLimit(`mark-read:${user.id}`, 20)) return rateLimitResponse();

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

  if (user.id === inquiry.landlord_id) {
    const { error: updateError } = await supabase
      .from('inquiries')
      .update({ is_read_by_landlord: true, read_at: new Date().toISOString() })
      .eq('id', id);
    if (updateError) return serverErrorResponse('Failed to mark inquiry as read');
  } else {
    // Tenant: mark all unread responses as read
    const { error: updateError } = await supabase
      .from('inquiry_responses')
      .update({ is_read_by_tenant: true, read_at: new Date().toISOString() })
      .eq('inquiry_id', id)
      .eq('is_read_by_tenant', false);
    if (updateError) return serverErrorResponse('Failed to mark responses as read');
  }

  return NextResponse.json({ success: true });
}
