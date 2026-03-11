import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

async function getClient() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user, authError: error };
}

const updateSchema = z.object({
  currencyFormat: z.enum(['prefix', 'suffix']).optional(),
  currencyDecimalSeparator: z.enum(['period', 'comma']).optional(),
  currencyThousandsSeparator: z.enum(['space', 'comma', 'period']).optional(),
});

export async function GET() {
  const { supabase, user, authError } = await getClient();
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('profiles')
    .select('currency_format, currency_decimal_separator, currency_thousands_separator, preferred_language')
    .eq('id', user.id)
    .single();

  if (error || !data) return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });

  return NextResponse.json({ success: true, data: {
    currencyFormat: data.currency_format ?? 'suffix',
    currencyDecimalSeparator: data.currency_decimal_separator ?? 'comma',
    currencyThousandsSeparator: data.currency_thousands_separator ?? 'space',
    preferredLanguage: data.preferred_language ?? 'en',
  }});
}

export async function PATCH(request: NextRequest) {
  const { supabase, user, authError } = await getClient();
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });

  const updates: Record<string, string> = {};
  if (parsed.data.currencyFormat) updates.currency_format = parsed.data.currencyFormat;
  if (parsed.data.currencyDecimalSeparator) updates.currency_decimal_separator = parsed.data.currencyDecimalSeparator;
  if (parsed.data.currencyThousandsSeparator) updates.currency_thousands_separator = parsed.data.currencyThousandsSeparator;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('currency_format, currency_decimal_separator, currency_thousands_separator, updated_at')
    .single();

  if (error) return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });

  return NextResponse.json({ success: true, data: {
    currencyFormat: data.currency_format,
    currencyDecimalSeparator: data.currency_decimal_separator,
    currencyThousandsSeparator: data.currency_thousands_separator,
    updatedAt: data.updated_at,
  }});
}
