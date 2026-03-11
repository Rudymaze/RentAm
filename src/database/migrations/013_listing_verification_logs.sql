-- ============================================================
-- Migration 013: Listing verification logs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.listing_verification_logs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id              UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
  admin_id                UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verification_type       TEXT NOT NULL
                          CHECK (verification_type IN (
                            'auto_approved',
                            'auto_flagged',
                            'manual_approved',
                            'manual_rejected',
                            'manual_flagged_for_review'
                          )),
  verification_result     TEXT NOT NULL
                          CHECK (verification_result IN (
                            'passed',
                            'failed',
                            'flagged_for_manual_review'
                          )),
  checklist_items         JSONB,
  rejection_reason        TEXT
                          CHECK (rejection_reason IN (
                            'inappropriate_content',
                            'false_information',
                            'duplicate_listing',
                            'missing_required_info',
                            'invalid_price',
                            'invalid_location',
                            'policy_violation',
                            'other'
                          )),
  admin_notes             TEXT,
  auto_verification_flags JSONB,
  verified_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_logs_listing
  ON public.listing_verification_logs (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_logs_admin
  ON public.listing_verification_logs (admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_logs_type
  ON public.listing_verification_logs (verification_type, created_at DESC);

-- RLS
ALTER TABLE public.listing_verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all verification logs"
  ON public.listing_verification_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Listing owners can read their verification logs"
  ON public.listing_verification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.property_listings l
      WHERE l.id = listing_id AND l.created_by = auth.uid()
    )
  );
