import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST() {
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

  const meta = user.user_metadata ?? {};
  const oauthProvider = user.app_metadata?.provider ?? null;
  const oauthId = meta.sub ?? meta.provider_id ?? null;

  const { data: existing } = await supabase
    .from('profiles')
    .select('id, onboarding_completed')
    .eq('id', user.id)
    .single();

  let profile;
  let isNew = false;

  if (!existing) {
    isNew = true;
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: meta.full_name ?? meta.name ?? null,
        avatar_url: meta.avatar_url ?? meta.picture ?? null,
        oauth_provider: oauthProvider,
        oauth_id: oauthId,
        oauth_metadata: { provider_name: oauthProvider, provider_id: oauthId, raw_user_meta_data: meta },
        onboarding_completed: false,
      })
      .select('id, role, onboarding_completed')
      .single();

    if (createError) {
      console.error('[oauth/sync-profile] create error', createError);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
    profile = created;
  } else {
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        oauth_provider: oauthProvider,
        oauth_id: oauthId,
        oauth_metadata: { provider_name: oauthProvider, provider_id: oauthId, raw_user_meta_data: meta },
      })
      .eq('id', user.id)
      .select('id, role, onboarding_completed')
      .single();

    if (updateError) {
      console.error('[oauth/sync-profile] update error', updateError);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
    profile = updated;
  }

  const redirectTo = isNew || !profile?.onboarding_completed ? '/onboarding' : '/dashboard';
  return NextResponse.json({ success: true, data: { ...profile, redirectTo } });
}
