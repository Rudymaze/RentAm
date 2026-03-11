import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, notFoundResponse, serverErrorResponse } from '../../_helpers';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const { data: listing } = await supabase
    .from('property_listings')
    .select('id, view_count')
    .eq('id', params.id)
    .single();

  if (!listing) return notFoundResponse('Listing not found');

  const newCount = (listing.view_count ?? 0) + 1;

  const { error } = await supabase
    .from('property_listings')
    .update({ view_count: newCount })
    .eq('id', params.id);

  if (error) return serverErrorResponse('Failed to update view count');

  return NextResponse.json({ success: true, data: { view_count: newCount } });
}
