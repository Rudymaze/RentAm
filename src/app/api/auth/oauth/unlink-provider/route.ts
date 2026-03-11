import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { applyRateLimit, STRICT } from '@/lib/rate-limit';

const unlinkSchema = z.object({
  provider: z.string().min(1),
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

  const limited = applyRateLimit(`oauth:unlink:${user.id}`, STRICT);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = unlinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  // Ensure the user has a password-based auth as fallback
  // (Supabase stores email auth in auth.users — we only clear the profile OAuth fields)
  const hasEmail = !!user.email;
  if (!hasEmail) {
    return NextResponse.json(
      { success: false, error: 'Cannot unlink: no alternative authentication method available' },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ oauth_provider: null, oauth_id: null, oauth_metadata: null })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { unlinkedAt: new Date().toISOString() } });
}
