import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminFromRequest } from '../../../cities/_helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let adminSupabase: any;
  try {
    ({ adminSupabase } = await verifyAdminFromRequest(req));
  } catch (res) { return res as Response; }

  const { data: listing, error } = await adminSupabase
    .from('property_listings')
    .select(`
      id, title, description, property_type, bedrooms, bathrooms,
      amenities, city_id, address, latitude, longitude,
      listing_type, rental_price, sale_price, status, created_at,
      landlord:profiles!created_by(id, full_name, phone_number, avatar_url),
      city:cameroon_cities!city_id(name_en, name_fr, region),
      images:property_images(id, url, thumbnail_url, display_order)
    `)
    .eq('id', params.id)
    .single();

  if (error || !listing) {
    return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
  }

  const images = (listing.images ?? [])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((img: any) => ({ id: img.id, url: img.url, thumbnail_url: img.thumbnail_url, display_order: img.display_order }));

  return NextResponse.json({
    success: true,
    data: {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      property_type: listing.property_type,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      amenities: listing.amenities ?? [],
      city_id: listing.city_id,
      city_name: listing.city?.name_en ?? '',
      address: listing.address,
      latitude: listing.latitude,
      longitude: listing.longitude,
      listing_type: listing.listing_type,
      rental_price: listing.rental_price,
      sale_price: listing.sale_price,
      status: listing.status,
      images,
      landlord: {
        id: listing.landlord?.id,
        name: listing.landlord?.full_name ?? '',
        phone: listing.landlord?.phone_number ?? null,
        avatar_url: listing.landlord?.avatar_url ?? null,
      },
      created_at: listing.created_at,
    },
  });
}
