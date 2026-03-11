import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../../properties/_helpers';
import { z } from 'zod';
import { applyRateLimit, STRICT } from '@/lib/rate-limit';

const Schema = z.object({
  appeal_explanation: z.string().min(50, 'Appeal explanation must be at least 50 characters').max(3000),
  evidence_files: z.array(z.string().url()).max(10).optional(),
});

const MAX_APPEALS = 3;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const { id } = await params;

  const limited = applyRateLimit(`appeal:${user.id}`, STRICT);
  if (limited) return limited;

  const { data: listing } = await supabase
    .from('property_listings')
    .select('id, created_by, status')
    .eq('id', id)
    .single();

  if (!listing) return notFoundResponse('Listing not found');
  if (listing.created_by !== user.id) return forbiddenResponse('Not your listing');
  if (listing.status !== 'rejected') {
    return NextResponse.json({ success: false, error: 'Only rejected listings can be appealed' }, { status: 409 });
  }

  // Check max appeals
  const { count: appealCount } = await supabase
    .from('listing_verification_logs')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', id)
    .eq('verification_type', 'appeal_submitted');

  if ((appealCount ?? 0) >= MAX_APPEALS) {
    return NextResponse.json({ success: false, error: 'Maximum number of appeals (3) already submitted' }, { status: 400 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { appeal_explanation, evidence_files } = parsed.data;
  const now = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('property_listings')
    .update({
      status: 'under_appeal',
      appeal_submitted_at: now,
      appeal_explanation,
      appeal_evidence_urls: evidence_files ?? [],
      updated_at: now,
    })
    .eq('id', id)
    .select('id, status, appeal_submitted_at')
    .single();

  if (error) return serverErrorResponse('Failed to submit appeal');

  const { data: logEntry } = await supabase
    .from('listing_verification_logs')
    .insert({
      listing_id: id,
      admin_id: null,
      verification_type: 'appeal_submitted',
      verification_result: 'flagged_for_manual_review',
      admin_notes: appeal_explanation,
      verified_at: now,
    })
    .select('id')
    .single();

  await supabase.from('listing_status_history').insert({
    listing_id: id,
    old_status: 'rejected',
    new_status: 'under_appeal',
    changed_by: user.id,
    changed_at: now,
    reason: 'Appeal submitted by landlord',
  });

  return NextResponse.json({
    success: true,
    data: {
      listing_id: id,
      status: updated.status,
      appeal_submitted_at: updated.appeal_submitted_at,
      verification_log_id: logEntry?.id ?? null,
    },
  });
}
