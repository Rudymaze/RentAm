import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, serverErrorResponse } from '../../_helpers';

const BUCKET = 'property-images';
const SIGNED_URL_EXPIRY = 3600; // 1 hour

export async function GET(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const { searchParams } = req.nextUrl;
  const listingId = searchParams.get('listing_id');
  const includeDeleted = searchParams.get('include_deleted') === 'true';

  if (!listingId) {
    return NextResponse.json({ success: false, error: 'listing_id is required' }, { status: 400 });
  }

  let query = supabase
    .from('property_images')
    .select('*')
    .eq('listing_id', listingId)
    .order('display_order', { ascending: true });

  if (!includeDeleted) {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query;
  if (error) return serverErrorResponse();

  // Generate signed URLs
  const images = await Promise.all(
    (data ?? []).map(async (img) => {
      const { data: signedMain } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(img.storage_path, SIGNED_URL_EXPIRY);

      let signedThumbUrl: string | null = null;
      if (img.thumbnail_url) {
        const thumbPath = img.storage_path.replace(/(\.[^.]+)$/, '_thumb$1');
        const { data: signedThumb } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(thumbPath, SIGNED_URL_EXPIRY);
        signedThumbUrl = signedThumb?.signedUrl ?? null;
      }

      return {
        ...img,
        signedUrl: signedMain?.signedUrl ?? img.url,
        signedThumbnailUrl: signedThumbUrl,
      };
    })
  );

  return NextResponse.json({ success: true, data: { images, total: images.length } });
}
