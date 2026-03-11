import { NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorized } from '../_helpers';

export async function GET() {
  const { supabase, user, error } = await getSupabaseAndUser();
  if (error || !user) return unauthorized();

  const [profileResult, termsResult, privacyResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('terms_accepted_at, terms_accepted_version, privacy_accepted_at, privacy_accepted_version')
      .eq('id', user.id)
      .single(),
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

  const profile = profileResult.data;
  const currentTermsVersion = termsResult.data?.version ?? null;
  const currentPrivacyVersion = privacyResult.data?.version ?? null;

  const termsAccepted = !!profile?.terms_accepted_version &&
    profile.terms_accepted_version === currentTermsVersion;
  const privacyAccepted = !!profile?.privacy_accepted_version &&
    profile.privacy_accepted_version === currentPrivacyVersion;

  return NextResponse.json({
    success: true,
    data: {
      terms: {
        accepted: termsAccepted,
        acceptedAt: profile?.terms_accepted_at ?? null,
        acceptedVersion: profile?.terms_accepted_version ?? null,
        currentVersion: currentTermsVersion,
      },
      privacy: {
        accepted: privacyAccepted,
        acceptedAt: profile?.privacy_accepted_at ?? null,
        acceptedVersion: profile?.privacy_accepted_version ?? null,
        currentVersion: currentPrivacyVersion,
      },
      bothAccepted: termsAccepted && privacyAccepted,
    },
  });
}
