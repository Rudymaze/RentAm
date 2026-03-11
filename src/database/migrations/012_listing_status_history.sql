-- ============================================================
-- Migration 012: Listing status lifecycle + history audit trail
-- ============================================================

-- Extend property_listings with full status lifecycle fields
ALTER TABLE public.property_listings
  ADD COLUMN IF NOT EXISTS listing_expiration_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_review_notes      TEXT,
  ADD COLUMN IF NOT EXISTS approved_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by             UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS rejected_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by             UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS marked_sold_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marked_rented_at        TIMESTAMPTZ;

-- Immutable status history audit trail
CREATE TABLE IF NOT EXISTS public.listing_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status      TEXT NOT NULL,
  changed_by      TEXT NOT NULL, -- user ID or 'system'
  change_reason   TEXT,
  metadata        JSONB,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_listing
  ON public.listing_status_history (listing_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_status_history_changed_by
  ON public.listing_status_history (changed_by, changed_at DESC);

-- RLS: owners and admins can read history
ALTER TABLE public.listing_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listing owners can read their status history"
  ON public.listing_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.property_listings l
      WHERE l.id = listing_id AND l.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can read all status history"
  ON public.listing_status_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "System can insert status history"
  ON public.listing_status_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Composite indexes on property_listings for status dashboard queries
CREATE INDEX IF NOT EXISTS idx_listings_user_status_date
  ON public.property_listings (created_by, status, created_at DESC);
