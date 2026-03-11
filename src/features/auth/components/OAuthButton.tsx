'use client';

import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { getSupabaseClient } from '@/lib/supabase-client';

interface OAuthButtonProps {
  mode?: 'signin' | 'signup';
  redirectTo?: string;
}

export function OAuthButton({ mode = 'signin', redirectTo }: OAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google';

  async function handleClick() {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo ?? `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
      >
        <FcGoogle size={20} />
        {loading ? 'Redirecting…' : label}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
