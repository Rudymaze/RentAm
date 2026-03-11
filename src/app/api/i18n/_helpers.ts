import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getI18nSupabaseAndUser() {
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
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user, authError: error };
}

export function resolveLanguage(param: string | null, profileLang?: string | null): 'en' | 'fr' {
  const lang = param ?? profileLang ?? 'en';
  return lang === 'fr' ? 'fr' : 'en';
}

export function buildTranslationsMap(
  rows: Array<{ key: string; content_en: string; content_fr: string }>,
  language: 'en' | 'fr'
): Record<string, string> {
  return Object.fromEntries(
    rows.map((r) => [r.key, language === 'fr' ? r.content_fr : r.content_en])
  );
}
