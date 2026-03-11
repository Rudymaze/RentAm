import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse, rateLimitResponse, checkRateLimit } from '../_helpers';
import { z } from 'zod';

const TEMPLATE_TYPES = ['availability_check', 'viewing_request', 'price_negotiation', 'general_inquiry', 'custom'] as const;

const BodySchema = z.object({
  property_id: z.string().uuid(),
  template_type: z.enum(TEMPLATE_TYPES),
  message: z.string().min(20).max(500),
  contact_preferences: z.record(z.unknown()).optional(),
  attachments: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  // Rate limit: 10 requests/min per user for send
  if (!checkRateLimit(`send:${user.id}`, 10)) return rateLimitResponse();

  // Check user role is 'tenant'
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profileError || !profile) return serverErrorResponse('Failed to fetch user profile');
  if (profile.role !== 'tenant') return forbiddenResponse('Only tenants can send inquiries');

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { property_id, template_type, message, contact_preferences, attachments } = parsed.data;

  // Verify property exists and is approved
  const { data: property, error: propError } = await supabase
    .from('property_listings')
    .select('id, created_by, status')
    .eq('id', property_id)
    .single();

  if (propError || !property) return notFoundResponse('Property not found');
  if (property.status !== 'approved') {
    return NextResponse.json({ success: false, error: 'Property is not available for inquiries' }, { status: 400 });
  }

  // Check daily rate limit: max 20 inquiries per day
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayCount, error: countError } = await supabase
    .from('inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', user.id)
    .gte('created_at', todayStart.toISOString());

  if (countError) return serverErrorResponse('Failed to check inquiry limit');
  if ((todayCount ?? 0) >= 20) {
    return NextResponse.json({ success: false, error: 'Daily inquiry limit of 20 reached. Try again tomorrow.' }, { status: 429 });
  }

  // Create inquiry
  const { data: inquiry, error: insertError } = await supabase
    .from('inquiries')
    .insert({
      tenant_id: user.id,
      landlord_id: property.created_by,
      property_id,
      template_type,
      message,
      contact_preferences: contact_preferences ?? null,
      attachments: attachments ?? [],
      status: 'awaiting_response',
      is_read_by_landlord: false,
      has_response: false,
    })
    .select('id, property_id, landlord_id, status, created_at')
    .single();

  if (insertError) return serverErrorResponse('Failed to create inquiry');

  return NextResponse.json({ success: true, data: inquiry }, { status: 201 });
}
