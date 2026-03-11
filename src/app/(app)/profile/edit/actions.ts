'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { ProfileUpdatePayload, ProfileResponse } from '@/features/profile/types';

export async function updateProfile(payload: ProfileUpdatePayload): Promise<ProfileResponse> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'Unauthorized' };

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) return { success: false, error: 'Failed to update profile' };
  return { success: true, data: profile };
}
