-- ============================================================
-- Migration 002: Profiles indexes + onboarding columns
-- ============================================================

-- Add onboarding columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tenant_preferences       JSONB,
  ADD COLUMN IF NOT EXISTS landlord_profile         JSONB;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id
  ON public.profiles (id);

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles (role);

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding
  ON public.profiles (id, onboarding_completed);
