import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { applyRateLimit, STRICT } from '@/lib/rate-limit';

const MOVE_IN_TIMELINES = ['immediate', '1-3 months', 'flexible'] as const;
const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'commercial', 'land'] as const;

const tenantSetupSchema = z.object({
  preferredCities: z.array(z.string()).min(1, 'Select at least one city'),
  propertyTypes: z.array(z.enum(PROPERTY_TYPES)).min(1, 'Select at least one property type'),
  budgetMin: z.number().positive('Budget minimum must be positive'),
  budgetMax: z.number().positive('Budget maximum must be positive'),
  moveInTimeline: z.enum(MOVE_IN_TIMELINES),
}).refine(d => d.budgetMin <= d.budgetMax, {
  message: 'Budget minimum must not exceed maximum',
  path: ['budgetMin'],
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

  const limited = applyRateLimit(`onboarding:tenant:${user.id}`, STRICT);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = tenantSetupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'tenant') {
    return NextResponse.json({ success: false, error: 'Forbidden: tenant role required' }, { status: 403 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      tenant_preferences: parsed.data,
    })
    .eq('id', user.id)
    .select('id, role, onboarding_completed, tenant_preferences')
    .single();

  if (updateError) {
    console.error('[tenant-setup]', updateError);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: updated });
}
