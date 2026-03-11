import { createClient } from '@/lib/supabase/server';

/**
 * Returns the currently authenticated user from the session.
 * Returns null if not authenticated.
 * Use in API route handlers and Server Components.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}
