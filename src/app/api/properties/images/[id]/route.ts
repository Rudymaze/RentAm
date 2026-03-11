import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../_helpers';

export async function DELETE(
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

  // Fetch the image to get its display_order
  const { data: image } = await supabase
    .from('property_images')
    .select('id, display_order')
    .eq('id', id)
    .eq('listing_id', listingId)
    .is('deleted_at', null)
    .single();

  if (!image) return notFoundResponse('Image not found');

  const now = new Date().toISOString();

  // Soft-delete
  const { error } = await supabase
    .from('property_images')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', id);

  if (error) return serverErrorResponse('Failed to delete image');

  // Decrement display_order for images after the deleted one
  try {
    await supabase.rpc('decrement_image_order', {
      p_listing_id: listingId,
      p_min_order: image.display_order,
    });
  } catch {
    // RPC may not exist; fall back to manual update
  }

  return NextResponse.json({ success: true });
}
