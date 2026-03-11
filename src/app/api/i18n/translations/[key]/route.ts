import { NextRequest, NextResponse } from 'next/server';
import { getI18nSupabaseAndUser, resolveLanguage } from '../../_helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { supabase, user, authError } = await getI18nSupabaseAndUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { key } = await params;

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_language')
    .eq('id', user.id)
    .single();

  const language = resolveLanguage(request.nextUrl.searchParams.get('lang'), profile?.preferred_language);

  const { data, error } = await supabase
    .from('ui_translations')
    .select('key, content_en, content_fr')
    .eq('key', key)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: 'Translation key not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: { key: data.key, contentEn: data.content_en, contentFr: data.content_fr, language },
  });
}
