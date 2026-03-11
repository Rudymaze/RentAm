import { createClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client — bypasses RLS.
 * NEVER use in client-side code. Server-side only.
 */
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
