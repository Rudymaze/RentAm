import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../_helpers';
import { reorderImageSchema } from '@/features/property-photos/types';

export async function PATCH(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = reorderImageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { listing_id, imageOrder } = parsed.data;

  // Verify user owns the listing
  const { data: listing } = await supabase
    .from('property_listings')
    .select('id, created_by')
    .eq('id', listing_id)
    .single();

  if (!listing) return notFoundResponse('Listing not found');
  if (listing.created_by !== user.id) return forbiddenResponse('Not your listing');

  // Verify all image IDs belong to this listing
  const { data: existingImages } = await supabase
    .from('property_images')
    .select('id')
    .eq('listing_id', listing_id)
    .is('deleted_at', null);

  const existingIds = new Set((existingImages ?? []).map((img) => img.id));
  const invalid = imageOrder.filter((item) => !existingIds.has(item.id));
  if (invalid.length > 0) {
    return NextResponse.json({ success: false, error: 'Some image IDs do not belong to this listing' }, { status: 400 });
  }

  // Update display_order for each image
  const updates = imageOrder.map(({ id, display_order }) =>
    supabase
      .from('property_images')
      .update({ display_order, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('listing_id', listing_id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return serverErrorResponse('Failed to reorder images');

  // Return updated images
  const { data: reordered } = await supabase
    .from('property_images')
    .select('*')
    .eq('listing_id', listing_id)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  return NextResponse.json({ success: true, data: { images: reordered ?? [] } });
}
