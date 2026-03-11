import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => (cookieStore as any).getAll?.() ?? [],
        setAll: (list: { name: string; value: string; options?: any }[]) =>
          list.forEach(({ name, value, options }) =>
            (cookieStore as any).set?.(name, value, options)
          ),
      },
    }
  );
}

export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getAuthUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await (await supabase).auth.getUser();
  return { supabase: await supabase, user, error };
}

/**
 * Verify the request bearer token belongs to an admin.
 * Returns { userId, adminSupabase } or throws a Response.
 */
export async function verifyAdminFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.slice(7);
  const adminSupabase = createSupabaseAdminClient();

  const {
    data: { user },
    error,
  } = await adminSupabase.auth.getUser(token);

  if (error || !user) {
    throw new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Response(JSON.stringify({ success: false, error: 'Forbidden — admin only' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return { userId: user.id, adminSupabase };
}

export function mapCityRow(row: any) {
  return {
    id: row.id,
    nameEn: row.name_en,
    nameFr: row.name_fr,
    region: row.region,
    latitude: row.latitude,
    longitude: row.longitude,
    population: row.population ?? null,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}
