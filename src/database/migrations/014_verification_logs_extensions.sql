-- ============================================================
-- Migration 014: Extend listing_verification_logs
-- ============================================================

-- Add photo_verification and duration columns
ALTER TABLE public.listing_verification_logs
  ADD COLUMN IF NOT EXISTS photo_verification         JSONB,
  ADD COLUMN IF NOT EXISTS verification_duration_seconds INTEGER;

-- Expand verification_type check constraint to include deep verification values
ALTER TABLE public.listing_verification_logs
  DROP CONSTRAINT IF EXISTS listing_verification_logs_verification_type_check;

ALTER TABLE public.listing_verification_logs
  ADD CONSTRAINT listing_verification_logs_verification_type_check
  CHECK (verification_type IN (
    'auto_approved',
    'auto_flagged',
    'manual_approved',
    'manual_rejected',
    'manual_flagged_for_review',
    'deep_verification_passed',
    'deep_verification_failed'
  ));

-- Ensure verified_at is required (not null) for completed verifications
-- (leave nullable so partial/in-progress records can be stored)

-- Additional index for fast dashboard queries on verification_result
CREATE INDEX IF NOT EXISTS idx_verification_logs_result
  ON public.listing_verification_logs (verification_result, created_at DESC);
