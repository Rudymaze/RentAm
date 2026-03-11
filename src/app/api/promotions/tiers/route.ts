import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, serverErrorResponse } from '../../properties/_helpers';

export async function GET(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  const lang = req.nextUrl.searchParams.get('lang') ?? 'en';
  if (!['en', 'fr'].includes(lang)) {
    return NextResponse.json({ success: false, error: 'Invalid lang parameter. Use en or fr.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('promotion_tiers')
    .select('id, tier_name, display_name_en, display_name_fr, description_en, description_fr, duration_days, price_fcfa, features, visibility_boost, display_order, is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) return serverErrorResponse('Failed to fetch promotion tiers');

  const tiers = (data ?? []).map((tier) => ({
    id: tier.id,
    tier_name: tier.tier_name,
    display_name: lang === 'fr' ? tier.display_name_fr : tier.display_name_en,
    description: lang === 'fr' ? tier.description_fr : tier.description_en,
    duration_days: tier.duration_days,
    price_fcfa: tier.price_fcfa,
    features: tier.features,
    visibility_boost: tier.visibility_boost,
    display_order: tier.display_order,
  }));

  return NextResponse.json({ success: true, data: { tiers, language: lang } });
}
