import { NextRequest, NextResponse } from 'next/server';
import { getI18nSupabaseAndUser, resolveLanguage, buildTranslationsMap } from '../../../_helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { supabase, user, authError } = await getI18nSupabaseAndUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { category } = await params;

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_language')
    .eq('id', user.id)
    .single();

  const language = resolveLanguage(request.nextUrl.searchParams.get('lang'), profile?.preferred_language);

  const { data, error } = await supabase
    .from('ui_translations')
    .select('key, content_en, content_fr')
    .eq('category', category);

  if (error) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ success: false, error: 'Category not found or empty' }, { status: 404 });
  }

  const translations = buildTranslationsMap(data, language);

  return NextResponse.json(
    { success: true, data: { category, language, translations } },
    { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } }
  );
}
