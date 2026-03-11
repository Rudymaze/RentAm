import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (l) => l.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('currency_exchange_rates')
    .select('fcfa_to_usd, fcfa_to_eur, last_updated, price_guide')
    .order('last_updated', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return NextResponse.json({ success: false, error: 'Exchange rate not found' }, { status: 404 });

  return NextResponse.json(
    { success: true, data: { fcfaToUsd: data.fcfa_to_usd, fcfaToEur: data.fcfa_to_eur, lastUpdated: data.last_updated, priceGuide: data.price_guide } },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
