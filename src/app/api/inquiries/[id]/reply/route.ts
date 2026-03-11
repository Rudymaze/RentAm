import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse, rateLimitResponse, checkRateLimit } from '../../_helpers';
import { z } from 'zod';

const BodySchema = z.object({
  message: z.string().min(20).max(500),
  attachments: z.array(z.string()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  if (!checkRateLimit(`reply:${user.id}`, 10)) return rateLimitResponse();

  const { id } = await params;

  // Fetch inquiry to verify ownership
  const { data: inquiry, error } = await supabase
    .from('inquiries')
    .select('id, landlord_id, tenant_id, status')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !inquiry) return notFoundResponse('Inquiry not found');
  if (inquiry.landlord_id !== user.id) return forbiddenResponse('Only the landlord can reply to this inquiry');

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { message, attachments } = parsed.data;

  // Create response
  const { data: response, error: insertError } = await supabase
    .from('inquiry_responses')
    .insert({
      inquiry_id: id,
      sender_id: user.id,
      message,
      attachments: attachments ?? [],
      is_read_by_tenant: false,
    })
    .select('id, inquiry_id, sender_id, message, attachments, created_at')
    .single();

  if (insertError) return serverErrorResponse('Failed to create response');

  // Update inquiry status
  await supabase
    .from('inquiries')
    .update({ has_response: true, status: 'responded' })
    .eq('id', id);

  return NextResponse.json({ success: true, data: response }, { status: 201 });
}
