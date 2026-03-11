import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '../../_helpers';
import { applyRateLimit, MODERATE } from '@/lib/rate-limit';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const { id } = await params;

  // Prevent artificial view inflation — one batch per user per minute
  const limited = applyRateLimit(`view-count:${user.id}`, MODERATE);
  if (limited) return limited;

  const { data: listing } = await supabase
    .from('property_listings')
    .select('id, view_count')
    .eq('id', id)
    .single();

  if (!listing) return notFoundResponse('Listing not found');

  const newCount = (listing.view_count ?? 0) + 1;

  const { error } = await supabase
    .from('property_listings')
    .update({ view_count: newCount })
    .eq('id', id);

  if (error) return serverErrorResponse('Failed to update view count');

  return NextResponse.json({ success: true, data: { view_count: newCount } });
}
