import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../_helpers';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const { id } = await params;

  const { data: listing } = await supabase
    .from('property_listings')
    .select('id, created_by, status')
    .eq('id', id)
    .single();

  if (!listing) return notFoundResponse('Listing not found');
  if (listing.created_by !== user.id) return forbiddenResponse('Not your listing');

  const { data: history, error } = await supabase
    .from('listing_status_history')
    .select('id, old_status, new_status, changed_at, reason, changed_by:profiles(id, full_name)')
    .eq('listing_id', id)
    .order('changed_at', { ascending: false });

  if (error) return serverErrorResponse();

  return NextResponse.json({
    success: true,
    data: {
      listing_id: id,
      current_status: listing.status,
      history: history ?? [],
      total: (history ?? []).length,
    },
  });
}
