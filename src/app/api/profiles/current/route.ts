import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateFullName, validatePhoneNumber } from '@/features/profile/utils/validation';

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: profile });
}

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fieldErrors: Record<string, string> = {};

  if (body.full_name !== undefined) {
    const result = validateFullName(body.full_name as string);
    if (!result.valid) fieldErrors.full_name = result.error!;
    else updates.full_name = (body.full_name as string).trim();
  }

  if (body.phone_number !== undefined) {
    const result = validatePhoneNumber(body.phone_number as string);
    if (!result.valid) fieldErrors.phone_number = result.error!;
    else updates.phone_number = (body.phone_number as string).trim();
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ success: false, error: 'Validation failed', details: fieldErrors }, { status: 422 });
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ success: false, error: 'At least one field must be provided' }, { status: 400 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: profile });
}
