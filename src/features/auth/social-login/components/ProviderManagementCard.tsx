'use client';

import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FiLoader, FiLink, FiLink2 } from 'react-icons/fi';
import { getSupabaseClient } from '@/lib/supabase-client';

interface Provider {
  name: string;
  provider_id?: string;
}

interface ProviderManagementCardProps {
  linkedProviders: Provider[];
  availableProviders: Provider[];
  onLinkSuccess?: (provider: string) => void;
  onUnlinkSuccess?: (provider: string) => void;
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  google: <FcGoogle size={20} />,
};

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
};

export function ProviderManagementCard({
  linkedProviders,
  availableProviders,
  onLinkSuccess,
  onUnlinkSuccess,
}: ProviderManagementCardProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLink(providerName: string) {
    setLoadingProvider(providerName);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerName as 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/oauth/sync-profile`,
        },
      });
      if (error) throw error;
      onLinkSuccess?.(providerName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link provider');
    } finally {
      setLoadingProvider(null);
    }
  }

  async function handleUnlink(providerName: string) {
    setLoadingProvider(providerName);
    setError(null);
    try {
      const res = await fetch('/api/auth/oauth/unlink-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unlink provider');
      onUnlinkSuccess?.(providerName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink provider');
    } finally {
      setLoadingProvider(null);
    }
  }

  const isLoading = (name: string) => loadingProvider === name;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
      <h3 className="text-base font-semibold text-gray-900">Connected Accounts</h3>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {linkedProviders.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Linked</p>
          {linkedProviders.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {PROVIDER_ICONS[p.name] ?? <FiLink size={18} />}
                <span className="text-sm font-medium text-gray-800">
                  {PROVIDER_LABELS[p.name] ?? p.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUnlink(p.name)}
                disabled={isLoading(p.name)}
                className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {isLoading(p.name) ? <FiLoader size={12} className="animate-spin" /> : null}
                Unlink
              </button>
            </div>
          ))}
        </div>
      )}

      {availableProviders.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Available</p>
          {availableProviders.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-lg border border-dashed border-gray-200 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {PROVIDER_ICONS[p.name] ?? <FiLink2 size={18} />}
                <span className="text-sm font-medium text-gray-600">
                  {PROVIDER_LABELS[p.name] ?? p.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleLink(p.name)}
                disabled={isLoading(p.name)}
                className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading(p.name) ? <FiLoader size={12} className="animate-spin" /> : null}
                Link
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
