import { createClient } from '@/lib/supabase/client';

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Request failed');
  }
  return res.json();
}

export const currencyApi = {
  getCurrencyFormat: () =>
    fetchWithAuth('/api/settings/currency-format'),

  updateCurrencyFormat: (data: Record<string, unknown>) =>
    fetchWithAuth('/api/settings/currency-format', { method: 'PATCH', body: JSON.stringify(data) }),

  validatePrice: (amount: number) =>
    fetchWithAuth('/api/currency/validate-price', { method: 'POST', body: JSON.stringify({ amount }) }),

  formatPrice: (amount: number, options?: Record<string, unknown>) =>
    fetchWithAuth('/api/currency/format-price', { method: 'POST', body: JSON.stringify({ amount, ...options }) }),

  getExchangeRate: () =>
    fetchWithAuth('/api/currency/exchange-rate'),

  getCurrencyTranslations: (lang = 'en') =>
    fetchWithAuth(`/api/i18n/translations/category/currency?lang=${lang}`),
};
