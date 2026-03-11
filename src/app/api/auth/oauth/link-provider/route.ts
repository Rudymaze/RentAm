import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const linkSchema = z.object({
  provider: z.string().min(1),
  provider_id: z.string().min(1),
});

export async function POST(request: NextRequest) {
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

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { provider, provider_id } = parsed.data;

  // Check if provider_id is already linked to another account
  const { data: conflict } = await supabase
    .from('profiles')
    .select('id')
    .eq('oauth_id', provider_id)
    .neq('id', user.id)
    .single();

  if (conflict) {
    return NextResponse.json({ success: false, error: 'This provider account is already linked to another user' }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ oauth_provider: provider, oauth_id: provider_id })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { linkedAt: new Date().toISOString() } });
}
