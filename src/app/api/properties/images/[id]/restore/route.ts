import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../../_helpers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const { id } = await params;

  const listingId = req.nextUrl.searchParams.get('listing_id');
  if (!listingId) {
    return NextResponse.json({ success: false, error: 'listing_id is required' }, { status: 400 });
  }

  // Verify listing ownership
  const { data: listing } = await supabase
    .from('property_listings')
    .select('created_by')
    .eq('id', listingId)
    .single();

  if (!listing) return notFoundResponse('Listing not found');
  if (listing.created_by !== user.id) return forbiddenResponse('Not your listing');

  // Verify image exists and is soft-deleted
  const { data: image } = await supabase
    .from('property_images')
    .select('id')
    .eq('id', id)
    .eq('listing_id', listingId)
    .not('deleted_at', 'is', null)
    .single();

  if (!image) return notFoundResponse('Deleted image not found');

  // Get max display_order to append at end
  const { data: maxRow } = await supabase
    .from('property_images')
    .select('display_order')
    .eq('listing_id', listingId)
    .is('deleted_at', null)
    .order('display_order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.display_order ?? -1) + 1;
  const now = new Date().toISOString();

  const { data: restored, error } = await supabase
    .from('property_images')
    .update({ deleted_at: null, display_order: nextOrder, updated_at: now })
    .eq('id', id)
    .select()
    .single();

  if (error) return serverErrorResponse('Failed to restore image');

  return NextResponse.json({ success: true, data: restored });
}
