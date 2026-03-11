import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../properties/_helpers';
import { initiatePayment, PaymentMethod } from '@/lib/payment';
import { z } from 'zod';

const TIERS = ['basic', 'standard', 'premium'] as const;
const PAYMENT_METHODS = ['credit_card', 'mobile_money', 'bank_transfer'] as const;

// Rate limiter: 5 purchases/day per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkDailyLimit(userId: string): boolean {
  const now = Date.now();
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const key = `promo-purchase:${userId}`;
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: startOfDay.getTime() + 86_400_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

const BodySchema = z.object({
  listing_id: z.string().uuid(),
  tier: z.enum(TIERS),
  payment_method: z.enum(PAYMENT_METHODS),
});

export async function POST(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  // Check role is landlord or agent
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profileError || !profile) return serverErrorResponse('Failed to fetch user profile');
  if (!['landlord', 'agent'].includes(profile.role)) return forbiddenResponse('Only landlords or agents can purchase promotions');

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { listing_id, tier, payment_method } = parsed.data;

  // Verify listing exists, is owned by user, and is approved
  const { data: listing, error: listingError } = await supabase
    .from('property_listings')
    .select('id, created_by, status, title')
    .eq('id', listing_id)
    .single();

  if (listingError || !listing) return notFoundResponse('Listing not found');
  if (listing.created_by !== user.id) return forbiddenResponse('You do not own this listing');
  if (listing.status !== 'approved') {
    return NextResponse.json({ success: false, error: 'Only approved listings can be promoted' }, { status: 404 });
  }

  // Rate limit: 5 promotions per day
  if (!checkDailyLimit(user.id)) {
    return NextResponse.json({ success: false, error: 'Daily promotion limit of 5 reached. Try again tomorrow.' }, { status: 429 });
  }

  // Get tier configuration
  const { data: tierConfig, error: tierError } = await supabase
    .from('promotion_tiers')
    .select('id, tier_name, price_fcfa, duration_days, visibility_boost')
    .eq('tier_name', tier)
    .eq('is_active', true)
    .single();

  if (tierError || !tierConfig) {
    return NextResponse.json({ success: false, error: 'Selected tier is not available' }, { status: 400 });
  }

  // Create pending promotion record
  const { data: promotion, error: insertError } = await supabase
    .from('listing_promotions')
    .insert({
      listing_id,
      landlord_id: user.id,
      tier,
      status: 'pending_payment',
      cost_fcfa: tierConfig.price_fcfa,
      payment_status: 'pending',
      payment_method,
      visibility_settings: tierConfig.visibility_boost,
    })
    .select('id')
    .single();

  if (insertError) return serverErrorResponse('Failed to create promotion record');

  // Initiate payment
  let paymentIntent;
  try {
    paymentIntent = await initiatePayment(
      Number(tierConfig.price_fcfa),
      'XAF',
      payment_method as PaymentMethod,
      {
        userId: user.id,
        itemType: 'promotion',
        itemId: promotion.id,
        description: `RentAM ${tier} promotion for listing: ${listing.title}`,
      }
    );
  } catch (err) {
    // Rollback promotion record on payment failure
    await supabase.from('listing_promotions').delete().eq('id', promotion.id);
    return serverErrorResponse('Payment initiation failed. Please try again.');
  }

  // Save payment transaction ID
  await supabase
    .from('listing_promotions')
    .update({ payment_transaction_id: paymentIntent.id })
    .eq('id', promotion.id);

  return NextResponse.json({
    success: true,
    data: {
      promotion_id: promotion.id,
      payment_intent_id: paymentIntent.id,
      payment_url: paymentIntent.redirectUrl,
      cost_fcfa: tierConfig.price_fcfa,
      tier,
      listing_id,
    },
  }, { status: 201 });
}
