import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, serverErrorResponse } from '../_helpers';
import { z } from 'zod';

// Simple in-memory rate limiter: 100 requests/min per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string, maxRequests: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

const VALID_SORT = ['newest', 'price_asc', 'price_desc'] as const;
const VALID_PROPERTY_TYPES = ['apartment', 'house', 'villa', 'commercial', 'land'] as const;
const VALID_LISTING_TYPES = ['rent', 'sale'] as const;

const SearchSchema = z.object({
  cityIds: z.string().optional(),
  propertyType: z.enum(VALID_PROPERTY_TYPES).optional(),
  listingType: z.enum(VALID_LISTING_TYPES).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  amenities: z.string().optional(),
  sortBy: z.enum(VALID_SORT).default('newest'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  searchQuery: z.string().max(200).optional(),
});

export async function GET(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  if (!checkRateLimit(user.id, 100)) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });
  }

  const sp = req.nextUrl.searchParams;
  const raw = {
    cityIds: sp.get('cityIds') ?? undefined,
    propertyType: sp.get('propertyType') ?? undefined,
    listingType: sp.get('listingType') ?? undefined,
    priceMin: sp.has('priceMin') ? Number(sp.get('priceMin')) : undefined,
    priceMax: sp.has('priceMax') ? Number(sp.get('priceMax')) : undefined,
    bedrooms: sp.has('bedrooms') ? Number(sp.get('bedrooms')) : undefined,
    bathrooms: sp.has('bathrooms') ? Number(sp.get('bathrooms')) : undefined,
    amenities: sp.get('amenities') ?? undefined,
    sortBy: sp.get('sortBy') ?? 'newest',
    page: Number(sp.get('page') ?? '1'),
    limit: Number(sp.get('limit') ?? '20'),
    searchQuery: sp.get('searchQuery') ?? undefined,
  };

  const parsed = SearchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid search parameters', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { cityIds, propertyType, listingType, priceMin, priceMax, bedrooms, bathrooms, amenities, sortBy, page, limit, searchQuery } = parsed.data;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('property_listings')
    .select(
      `id, title, description, property_type, listing_type, rental_price, sale_price,
       bedrooms, bathrooms, amenities, address, latitude, longitude, view_count, created_at,
       city_id,
       cameroon_cities!city_id(id, name_en, name_fr, region),
       property_images!listing_id(url, thumbnail_url, display_order)`,
      { count: 'exact' }
    )
    .eq('status', 'approved')
    .range(from, to);

  // Filters
  if (cityIds) {
    const ids = cityIds.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length > 0) query = query.in('city_id', ids);
  }
  if (propertyType) query = query.eq('property_type', propertyType);
  if (listingType) query = query.eq('listing_type', listingType);
  if (priceMin !== undefined) {
    query = query.or(`rental_price.gte.${priceMin},sale_price.gte.${priceMin}`);
  }
  if (priceMax !== undefined) {
    query = query.or(`rental_price.lte.${priceMax},sale_price.lte.${priceMax}`);
  }
  if (bedrooms !== undefined) query = query.eq('bedrooms', bedrooms);
  if (bathrooms !== undefined) query = query.eq('bathrooms', bathrooms);
  if (amenities) {
    const items = amenities.split(',').map((s) => s.trim()).filter(Boolean);
    for (const item of items) {
      query = query.contains('amenities', JSON.stringify([item]));
    }
  }
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  // Sorting
  if (sortBy === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sortBy === 'price_asc') {
    query = query.order('rental_price', { ascending: true, nullsFirst: false });
  } else if (sortBy === 'price_desc') {
    query = query.order('rental_price', { ascending: false, nullsFirst: false });
  }

  const { data, error, count } = await query;
  if (error) return serverErrorResponse('Search failed');

  const listings = (data ?? []).map((row: Record<string, unknown>) => {
    const images = Array.isArray(row.property_images)
      ? (row.property_images as Array<{ display_order: number; thumbnail_url: string | null; url: string }>)
          .sort((a, b) => a.display_order - b.display_order)
      : [];
    const thumbnail = images[0]?.thumbnail_url ?? images[0]?.url ?? null;
    return {
      id: row.id,
      title: row.title,
      property_type: row.property_type,
      listing_type: row.listing_type,
      rental_price: row.rental_price,
      sale_price: row.sale_price,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      view_count: row.view_count,
      created_at: row.created_at,
      city: row.cameroon_cities,
      thumbnail_url: thumbnail,
    };
  });

  const total = count ?? 0;
  return NextResponse.json({
    success: true,
    data: { listings, total, page, limit, hasMore: from + listings.length < total },
  });
}
