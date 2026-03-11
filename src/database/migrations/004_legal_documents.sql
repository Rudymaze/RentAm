-- ============================================================
-- Migration 004: Legal documents + acceptance tracking
-- ============================================================

-- Legal documents table
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type   TEXT NOT NULL CHECK (document_type IN ('terms', 'privacy')),
  version         TEXT NOT NULL,
  content_en      TEXT NOT NULL,
  content_fr      TEXT NOT NULL,
  effective_date  TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_type, version)
);

-- RLS: authenticated users can read all documents
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read legal documents"
  ON public.legal_documents FOR SELECT
  USING (auth.role() = 'authenticated');

-- Auto-update trigger
CREATE TRIGGER legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add acceptance tracking to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_accepted_version  TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_version TEXT;
