import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, serverErrorResponse } from '../../../properties/_helpers';
import { z } from 'zod';

import { applyRateLimit, STRICT } from '@/lib/rate-limit';

const FilterCriteriaSchema = z.object({
  cityIds: z.array(z.string()).optional(),
  propertyType: z.string().optional(),
  listingType: z.string().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  searchQuery: z.string().optional(),
}).passthrough();

const BodySchema = z.object({
  searchName: z.string().min(5).max(100),
  filterCriteria: FilterCriteriaSchema,
});

export async function POST(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const limited = applyRateLimit(`saved-search:save:${user.id}`, STRICT);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { searchName, filterCriteria } = parsed.data;

  // Check if user already has 10 saved searches
  const { count, error: countError } = await supabase
    .from('user_saved_searches')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null);

  if (countError) return serverErrorResponse('Failed to check saved searches count');
  if ((count ?? 0) >= 10) {
    return NextResponse.json(
      { success: false, error: 'Maximum of 10 saved searches reached. Delete one to add a new one.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('user_saved_searches')
    .insert({
      user_id: user.id,
      search_name: searchName,
      filter_criteria: filterCriteria,
      result_count: 0,
      created_at: new Date().toISOString(),
    })
    .select('id, search_name, filter_criteria, result_count, created_at')
    .single();

  if (error) return serverErrorResponse('Failed to save search');

  return NextResponse.json({ success: true, data }, { status: 201 });
}
