import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
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

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
  }

  const role = profile.role as string;
  const onboardingCompleted = profile.onboarding_completed ?? false;

  let redirectTo = '/onboarding';
  if (onboardingCompleted) {
    redirectTo = role === 'admin' ? '/admin/dashboard' : '/dashboard';
  } else if (role === 'tenant') {
    redirectTo = '/onboarding/tenant';
  } else if (role === 'landlord') {
    redirectTo = '/onboarding/landlord';
  }

  return NextResponse.json({
    success: true,
    data: { onboardingCompleted, role, redirectTo },
  });
}
