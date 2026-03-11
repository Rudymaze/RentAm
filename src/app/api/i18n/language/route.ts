import { NextRequest, NextResponse } from 'next/server';
import { getI18nSupabaseAndUser } from '../_helpers';
import { z } from 'zod';

const updateSchema = z.object({ language: z.enum(['en', 'fr']) });

export async function GET() {
  const { supabase, user, authError } = await getI18nSupabaseAndUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_language')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    success: true,
    data: { preferredLanguage: profile?.preferred_language ?? 'en' },
  });
}

export async function PUT(request: NextRequest) {
  const { supabase, user, authError } = await getI18nSupabaseAndUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await supabase
    .from('profiles')
    .update({ preferred_language: parsed.data.language })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: { preferredLanguage: parsed.data.language, updatedAt: new Date().toISOString() },
  });
}
