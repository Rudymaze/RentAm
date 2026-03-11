import { NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorized } from '../_helpers';

export async function GET() {
  const { supabase, user, error } = await getSupabaseAndUser();
  if (error || !user) return unauthorized();

  const { data: profile } = await supabase
    .from('profiles')
    .select('terms_accepted_version, privacy_accepted_version')
    .eq('id', user.id)
    .single();

  const [termsResult, privacyResult] = await Promise.all([
    supabase
      .from('legal_documents')
      .select('version')
      .eq('document_type', 'terms')
      .order('version', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('legal_documents')
      .select('version')
      .eq('document_type', 'privacy')
      .order('version', { ascending: false })
      .limit(1)
      .single(),
  ]);

  const termsAccepted = !!profile?.terms_accepted_version &&
    profile.terms_accepted_version === termsResult.data?.version;
  const privacyAccepted = !!profile?.privacy_accepted_version &&
    profile.privacy_accepted_version === privacyResult.data?.version;

  return NextResponse.json({
    success: true,
    data: {
      termsAccepted,
      privacyAccepted,
      bothAccepted: termsAccepted && privacyAccepted,
    },
  });
}
