import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'commercial', 'land'] as const;
const CAMEROON_PHONE_REGEX = /^\+237[0-9]{9}$/;

const landlordSetupSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(200),
  phoneNumber: z
    .string()
    .regex(CAMEROON_PHONE_REGEX, 'Phone must be in format +237XXXXXXXXX'),
  registrationNumber: z.string().max(100).optional(),
  primaryCity: z.string().min(1, 'Primary city is required'),
  propertyTypes: z.array(z.enum(PROPERTY_TYPES)).min(1, 'Select at least one property type'),
  yearsOfExperience: z.number().int().min(0, 'Years of experience cannot be negative'),
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
  const parsed = landlordSetupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'landlord') {
    return NextResponse.json({ success: false, error: 'Forbidden: landlord role required' }, { status: 403 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      landlord_profile: parsed.data,
      phone_number: parsed.data.phoneNumber,
    })
    .eq('id', user.id)
    .select('id, role, onboarding_completed, landlord_profile')
    .single();

  if (updateError) {
    console.error('[landlord-setup]', updateError);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: updated });
}
