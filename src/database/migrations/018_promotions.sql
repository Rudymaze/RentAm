-- ============================================================
-- Migration 018: Promotion tiers and listing promotions
-- ============================================================

-- -------------------------------------------------------
-- Promotion tiers (admin-managed configuration)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promotion_tiers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name         TEXT NOT NULL UNIQUE
                    CHECK (tier_name IN ('basic','standard','premium')),
  display_name_en   TEXT NOT NULL,
  display_name_fr   TEXT NOT NULL,
  description_en    TEXT,
  description_fr    TEXT,
  duration_days     INTEGER NOT NULL CHECK (duration_days IN (7,14,30)),
  price_fcfa        NUMERIC(15,0) NOT NULL,
  features          JSONB NOT NULL DEFAULT '[]',
  visibility_boost  JSONB,
  display_order     INTEGER NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotion_tiers_active_order
  ON public.promotion_tiers (is_active, display_order);

ALTER TABLE public.promotion_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active promotion tiers"
  ON public.promotion_tiers FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "Admins can manage promotion tiers"
  ON public.promotion_tiers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE TRIGGER promotion_tiers_updated_at
  BEFORE UPDATE ON public.promotion_tiers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------
-- Listing promotions (purchase records)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listing_promotions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id              UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
  landlord_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier                    TEXT NOT NULL CHECK (tier IN ('basic','standard','premium')),
  status                  TEXT NOT NULL DEFAULT 'pending_payment'
                          CHECK (status IN ('pending_payment','active','expired','cancelled')),
  start_date              TIMESTAMPTZ,
  end_date                TIMESTAMPTZ,
  cost_fcfa               NUMERIC(15,0) NOT NULL,
  payment_status          TEXT NOT NULL DEFAULT 'pending'
                          CHECK (payment_status IN ('pending','completed','failed','refunded')),
  payment_method          TEXT CHECK (payment_method IN ('credit_card','mobile_money','bank_transfer')),
  payment_transaction_id  TEXT,
  visibility_settings     JSONB,
  metrics                 JSONB DEFAULT '{"impressions":0,"clicks":0,"ctr":0,"conversions":0,"conversion_rate":0,"estimated_roi":0}',
  renewal_count           INTEGER NOT NULL DEFAULT 0,
  auto_renew              BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at            TIMESTAMPTZ,
  cancellation_reason     TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_promotions_listing
  ON public.listing_promotions (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_promotions_landlord
  ON public.listing_promotions (landlord_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_promotions_status
  ON public.listing_promotions (status, end_date);

ALTER TABLE public.listing_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage their own promotions"
  ON public.listing_promotions FOR ALL
  USING (auth.uid() = landlord_id);

CREATE POLICY "Admins can manage all promotions"
  ON public.listing_promotions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE TRIGGER listing_promotions_updated_at
  BEFORE UPDATE ON public.listing_promotions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
