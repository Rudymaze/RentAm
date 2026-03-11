import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../../_helpers';

export async function PATCH(
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

  // Verify image belongs to listing
  const { data: image } = await supabase
    .from('property_images')
    .select('id, display_order')
    .eq('id', id)
    .eq('listing_id', listingId)
    .is('deleted_at', null)
    .single();

  if (!image) return notFoundResponse('Image not found');

  const now = new Date().toISOString();

  // Shift all images: bump existing primary (order 0) up by current image's order, then set this one to 0
  if (image.display_order !== 0) {
    // Increment all images with order < current image's order
    await supabase
      .from('property_images')
      .update({ display_order: image.display_order, updated_at: now })
      .eq('listing_id', listingId)
      .eq('display_order', 0);

    const { error } = await supabase
      .from('property_images')
      .update({ display_order: 0, updated_at: now })
      .eq('id', id);

    if (error) return serverErrorResponse('Failed to set primary image');
  }

  const { data: updated } = await supabase
    .from('property_images')
    .select('*')
    .eq('listing_id', listingId)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  return NextResponse.json({ success: true, data: { images: updated ?? [] } });
}
