import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, isWithinCameroon, PRICE_MIN, PRICE_MAX, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../_helpers';
import { listingFormSchema } from '@/features/properties/utils/validation';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const { data: listing, error } = await supabase
    .from('property_listings')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !listing) return notFoundResponse('Listing not found');

  // Draft listings visible only to their owner
  if (listing.status === 'draft' && listing.created_by !== user.id) {
    return forbiddenResponse('You cannot view this draft');
  }

  return NextResponse.json({ success: true, data: listing });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const { data: listing, error: fetchError } = await supabase
    .from('property_listings')
    .select('id, created_by, status')
    .eq('id', params.id)
    .single();

  if (fetchError || !listing) return notFoundResponse('Listing not found');
  if (listing.created_by !== user.id) return forbiddenResponse('Not your listing');

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const partialSchema = listingFormSchema.partial();
  const parsed = partialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;

  if (data.latitude !== undefined || data.longitude !== undefined) {
    const lat = data.latitude ?? null;
    const lon = data.longitude ?? null;
    if (!isWithinCameroon(lat, lon)) {
      return NextResponse.json({ success: false, error: 'Coordinates must be within Cameroon bounds' }, { status: 400 });
    }
  }

  const price = data.listing_type === 'rent' ? data.rental_price : data.sale_price;
  if (price !== undefined && price !== null && (price < PRICE_MIN || price > PRICE_MAX)) {
    return NextResponse.json({ success: false, error: `Price must be between ${PRICE_MIN.toLocaleString()} and ${PRICE_MAX.toLocaleString()} FCFA` }, { status: 400 });
  }

  // Rate limit: 20 updates per day
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const { count: updateCount } = await supabase
    .from('property_listings')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', user.id)
    .gte('updated_at', oneDayAgo);

  if ((updateCount ?? 0) >= 20) {
    return NextResponse.json({ success: false, error: 'Daily update limit reached (20 per day)' }, { status: 429 });
  }

  const updates: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };

  // Re-submit for review if it was approved
  if (listing.status === 'approved') {
    updates.status = 'pending_review';
  }

  const { data: updated, error } = await supabase
    .from('property_listings')
    .update(updates)
    .eq('id', params.id)
    .select('id, title, status, updated_at')
    .single();

  if (error) return serverErrorResponse('Failed to update listing');

  const wasApproved = listing.status === 'approved';
  return NextResponse.json({
    success: true,
    data: updated,
    ...(wasApproved ? { warning: 'Listing re-submitted for review after changes' } : {}),
  });
}
