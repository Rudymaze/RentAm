-- ============================================================
-- Migration 003: OAuth provider columns + indexes
-- ============================================================

-- Add OAuth provider tracking to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS oauth_provider        TEXT,
  ADD COLUMN IF NOT EXISTS oauth_provider_id     TEXT,
  ADD COLUMN IF NOT EXISTS oauth_metadata        JSONB;

-- Index for fast OAuth provider lookups
CREATE INDEX IF NOT EXISTS idx_profiles_oauth_provider
  ON public.profiles (id, oauth_provider);

-- Index for provider ID lookups (e.g. finding user by Google sub)
CREATE INDEX IF NOT EXISTS idx_profiles_oauth_provider_id
  ON public.profiles (oauth_provider, oauth_provider_id)
  WHERE oauth_provider IS NOT NULL;
