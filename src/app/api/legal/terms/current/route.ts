import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorized } from '../../_helpers';

export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getSupabaseAndUser();
  if (error || !user) return unauthorized();

  const lang = request.nextUrl.searchParams.get('lang') ?? 'en';
  const contentField = lang === 'fr' ? 'content_fr' : 'content_en';

  const { data, error: dbError } = await supabase
    .from('legal_documents')
    .select(`id, document_type, version, ${contentField}, effective_date, created_at`)
    .eq('document_type', 'terms')
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (dbError || !data) {
    return NextResponse.json({ success: false, error: 'Terms document not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}
