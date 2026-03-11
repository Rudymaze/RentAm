import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { formatPrice } from '@/features/currency/utils/formatting';

const schema = z.object({ amount: z.number(), currency: z.literal('FCFA').optional() });

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('currency_format, currency_decimal_separator, currency_thousands_separator, preferred_language')
    .eq('id', user.id)
    .single();

  const prefs = {
    currencyFormat: (profile?.currency_format ?? 'suffix') as 'prefix' | 'suffix',
    currencyDecimalSeparator: (profile?.currency_decimal_separator ?? 'comma') as 'period' | 'comma',
    currencyThousandsSeparator: (profile?.currency_thousands_separator ?? 'space') as 'space' | 'comma' | 'period',
    preferredLanguage: (profile?.preferred_language ?? 'fr') as 'en' | 'fr',
  };

  const formatted = formatPrice(parsed.data.amount, prefs);
  return NextResponse.json({ success: true, data: { formatted, amount: parsed.data.amount, language: prefs.preferredLanguage, format: prefs.currencyFormat } });
}
