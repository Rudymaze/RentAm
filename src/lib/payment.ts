/**
 * Payment provider abstraction layer.
 * Currently configured for Flutterwave (popular in Cameroon/West Africa).
 * Swap the implementation here to change providers without touching feature code.
 */

export type PaymentMethod = 'credit_card' | 'mobile_money' | 'bank_transfer';
export type PaymentCurrency = 'XAF'; // FCFA

export interface PaymentIntent {
  id: string;
  redirectUrl: string;
  status: 'pending' | 'successful' | 'failed';
}

export interface PaymentMetadata {
  userId: string;
  itemType: string;
  itemId: string;
  description: string;
}

/**
 * Initiate a payment. Returns a payment intent with a redirect URL.
 */
export async function initiatePayment(
  amount: number,
  currency: PaymentCurrency,
  method: PaymentMethod,
  metadata: PaymentMetadata
): Promise<PaymentIntent> {
  const apiKey = process.env.PAYMENT_PROVIDER_API_KEY;
  if (!apiKey) throw new Error('Payment provider not configured');

  // Provider-agnostic interface — swap implementation per provider
  // Example: Flutterwave inline payment
  const res = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: `rentam-${metadata.itemId}-${Date.now()}`,
      amount,
      currency,
      payment_options: method === 'mobile_money' ? 'mobilemoneycameroon' : method,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/callback`,
      customer: { email: 'placeholder@rentam.cm' },
      meta: metadata,
    }),
  });

  if (!res.ok) throw new Error('Payment initiation failed');
  const data = await res.json();

  return {
    id: data.data?.tx_ref ?? '',
    redirectUrl: data.data?.link ?? '',
    status: 'pending',
  };
}

/**
 * Verify a payment by its transaction reference.
 */
export async function verifyPayment(transactionId: string): Promise<PaymentIntent> {
  const apiKey = process.env.PAYMENT_PROVIDER_API_KEY;
  if (!apiKey) throw new Error('Payment provider not configured');

  const res = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) throw new Error('Payment verification failed');
  const data = await res.json();

  return {
    id: transactionId,
    redirectUrl: '',
    status: data.data?.status === 'successful' ? 'successful' : 'failed',
  };
}
