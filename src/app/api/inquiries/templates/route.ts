import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, serverErrorResponse, rateLimitResponse, checkRateLimit } from '../_helpers';

export async function GET(_req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  if (!checkRateLimit(`templates:${user.id}`, 20)) return rateLimitResponse();

  const { data, error } = await supabase
    .from('inquiry_templates')
    .select('id, template_type, title, message_body, is_default, language, created_at')
    .eq('is_default', true)
    .order('template_type', { ascending: true });

  if (error) return serverErrorResponse('Failed to fetch templates');

  // Group by template_type, providing both en and fr versions
  const grouped: Record<string, { en: unknown; fr: unknown }> = {};
  for (const t of (data ?? [])) {
    if (!grouped[t.template_type]) grouped[t.template_type] = { en: null, fr: null };
    if (t.language === 'en') grouped[t.template_type].en = t;
    else if (t.language === 'fr') grouped[t.template_type].fr = t;
  }

  return NextResponse.json({
    success: true,
    data: { templates: data ?? [], grouped },
  });
}
