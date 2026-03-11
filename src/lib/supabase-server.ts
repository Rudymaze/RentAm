import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using service role key.
 * Bypasses RLS — use only in API routes, never in client code.
 */
export function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
