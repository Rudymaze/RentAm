import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '../../properties/_helpers';
import { verifyPayment } from '@/lib/payment';
import { z } from 'zod';

const BodySchema = z.object({
  promotion_id: z.string().uuid(),
  payment_intent_id: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { promotion_id, payment_intent_id } = parsed.data;

  // Find the promotion
  const { data: promotion, error: promoError } = await supabase
    .from('listing_promotions')
    .select('id, landlord_id, tier, status, payment_status, listing_id')
    .eq('id', promotion_id)
    .single();

  if (promoError || !promotion) return notFoundResponse('Promotion not found');
  if (promotion.landlord_id !== user.id) return forbiddenResponse('You do not own this promotion');
  if (promotion.status !== 'pending_payment') {
    return NextResponse.json({ success: false, error: 'Promotion is not in pending_payment state' }, { status: 400 });
  }

  // Verify payment with provider
  let paymentResult;
  try {
    paymentResult = await verifyPayment(payment_intent_id);
  } catch {
    return serverErrorResponse('Payment verification failed');
  }

  if (paymentResult.status !== 'successful') {
    // Update payment status to failed
    await supabase
      .from('listing_promotions')
      .update({ payment_status: 'failed', status: 'cancelled' })
      .eq('id', promotion_id);
    return NextResponse.json({ success: false, error: 'Payment was not successful' }, { status: 400 });
  }

  // Get tier duration
  const { data: tierConfig, error: tierError } = await supabase
    .from('promotion_tiers')
    .select('duration_days')
    .eq('tier_name', promotion.tier)
    .single();

  if (tierError || !tierConfig) return serverErrorResponse('Failed to retrieve tier configuration');

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + tierConfig.duration_days);

  // Activate promotion
  const { error: updateError } = await supabase
    .from('listing_promotions')
    .update({
      status: 'active',
      payment_status: 'completed',
      payment_transaction_id: payment_intent_id,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    })
    .eq('id', promotion_id);

  if (updateError) return serverErrorResponse('Failed to activate promotion');

  return NextResponse.json({
    success: true,
    data: {
      promotion_id,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    },
  });
}
