import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, isWithinCameroon, PRICE_MIN, PRICE_MAX, unauthorizedResponse, forbiddenResponse, serverErrorResponse } from '../_helpers';
import { listingFormSchema } from '@/features/properties/utils/validation';

export async function POST(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  // Verify landlord or agent role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['landlord', 'agent'].includes(profile.role)) {
    return forbiddenResponse('Only landlords and agents can create listings');
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = listingFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = parsed.data;

  // Validate city exists
  const { data: city } = await supabase
    .from('cameroon_cities')
    .select('id')
    .eq('id', data.city_id)
    .eq('is_active', true)
    .maybeSingle();

  if (!city) {
    return NextResponse.json({ success: false, error: 'City not found' }, { status: 404 });
  }

  // Validate coordinates within Cameroon
  if (!isWithinCameroon(data.latitude, data.longitude)) {
    return NextResponse.json({ success: false, error: 'Coordinates must be within Cameroon bounds' }, { status: 400 });
  }

  // Validate price range
  const price = data.listing_type === 'rent' ? data.rental_price : data.sale_price;
  if (price !== null && (price < PRICE_MIN || price > PRICE_MAX)) {
    return NextResponse.json({ success: false, error: `Price must be between ${PRICE_MIN.toLocaleString()} and ${PRICE_MAX.toLocaleString()} FCFA` }, { status: 400 });
  }

  // Rate limit: max 20 listings per day
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const { count: dailyCount } = await supabase
    .from('property_listings')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', user.id)
    .gte('created_at', oneDayAgo);

  if ((dailyCount ?? 0) >= 20) {
    return NextResponse.json({ success: false, error: 'Daily listing limit reached (20 per day)' }, { status: 429 });
  }

  const { data: listing, error } = await supabase
    .from('property_listings')
    .insert({
      title: data.title,
      description: data.description,
      property_type: data.property_type,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      city_id: data.city_id,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      amenities: data.amenities,
      listing_type: data.listing_type,
      rental_price: data.rental_price,
      sale_price: data.sale_price,
      images: data.images,
      status: 'pending_review',
      created_by: user.id,
    })
    .select('id, title, city_id, status, created_at')
    .single();

  if (error) return serverErrorResponse('Failed to create listing');

  // Delete any open draft for this user
  await supabase
    .from('property_listing_drafts')
    .delete()
    .eq('user_id', user.id)
    .is('listing_id', null);

  return NextResponse.json({ success: true, data: listing }, { status: 201 });
}
