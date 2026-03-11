import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorized } from '../../_helpers';
import { z } from 'zod';

const schema = z.object({ version: z.string().regex(/^\d+\.\d+$/, 'Invalid version format') });

export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getSupabaseAndUser();
  if (error || !user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { version } = parsed.data;

  const { data: doc } = await supabase
    .from('legal_documents')
    .select('id')
    .eq('document_type', 'privacy')
    .eq('version', version)
    .single();

  if (!doc) {
    return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 });
  }

  const acceptedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ privacy_accepted_at: acceptedAt, privacy_accepted_version: version })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { privacyAcceptedAt: acceptedAt, privacyAcceptedVersion: version } });
}
