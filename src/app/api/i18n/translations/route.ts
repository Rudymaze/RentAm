import { NextRequest, NextResponse } from 'next/server';
import { getI18nSupabaseAndUser, resolveLanguage, buildTranslationsMap } from '../_helpers';

export async function GET(request: NextRequest) {
  const { supabase, user, authError } = await getI18nSupabaseAndUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const categoryParam = params.get('category');

  // Get user preferred language
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_language')
    .eq('id', user.id)
    .single();

  const language = resolveLanguage(params.get('lang'), profile?.preferred_language);

  let query = supabase.from('ui_translations').select('key, content_en, content_fr');
  if (categoryParam) {
    query = query.eq('category', categoryParam);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ success: false, error: 'No translations found' }, { status: 404 });
  }

  const translations = buildTranslationsMap(data, language);

  return NextResponse.json(
    { success: true, data: { language, translations } },
    { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } }
  );
}
