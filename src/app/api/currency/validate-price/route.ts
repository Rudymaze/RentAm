import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const schema = z.object({
  amount: z.number(),
  currency: z.literal('FCFA'),
  context: z.enum(['listing', 'payment', 'search']).optional(),
});

const BOUNDS: Record<string, { min: number; max: number }> = {
  listing: { min: 10_000, max: 500_000_000 },
  payment: { min: 1_000, max: 100_000_000 },
  search: { min: 0, max: Number.MAX_SAFE_INTEGER },
};

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (l) => l.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });

  const { amount, context = 'listing' } = parsed.data;
  const bounds = BOUNDS[context];
  const warnings: string[] = [];

  if (amount < 0) {
    return NextResponse.json({ success: true, data: { valid: false, amount, formatted: '', warnings: ['Amount cannot be negative'] } });
  }
  if (amount < bounds.min) warnings.push(`Amount is below the minimum for ${context} (${bounds.min.toLocaleString()} FCFA)`);
  if (amount > bounds.max) {
    return NextResponse.json({ success: true, data: { valid: false, amount, formatted: '', warnings: [`Amount exceeds maximum for ${context}`] } });
  }

  const formatted = `${amount.toLocaleString('fr-CM')} FCFA`;
  return NextResponse.json({ success: true, data: { valid: true, amount, formatted, warnings } });
}
