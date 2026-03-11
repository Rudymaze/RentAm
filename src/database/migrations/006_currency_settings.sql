-- ============================================================
-- Migration 006: Currency preferences + exchange rates
-- ============================================================

-- Add currency format preferences to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS currency_format              TEXT NOT NULL DEFAULT 'suffix'
    CHECK (currency_format IN ('prefix', 'suffix')),
  ADD COLUMN IF NOT EXISTS currency_decimal_separator   TEXT NOT NULL DEFAULT 'comma'
    CHECK (currency_decimal_separator IN ('period', 'comma')),
  ADD COLUMN IF NOT EXISTS currency_thousands_separator TEXT NOT NULL DEFAULT 'space'
    CHECK (currency_thousands_separator IN ('space', 'comma', 'period'));

-- Currency exchange rates table
CREATE TABLE IF NOT EXISTS public.currency_exchange_rates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fcfa_to_usd  NUMERIC(12, 6) NOT NULL,
  fcfa_to_eur  NUMERIC(12, 6) NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  price_guide  JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: authenticated read-only
ALTER TABLE public.currency_exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read exchange rates"
  ON public.currency_exchange_rates FOR SELECT
  USING (auth.role() = 'authenticated');

-- Index for efficient rate lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_last_updated
  ON public.currency_exchange_rates (last_updated DESC);

-- Auto-update trigger
CREATE TRIGGER currency_exchange_rates_updated_at
  BEFORE UPDATE ON public.currency_exchange_rates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
