-- ============================================================
-- Migration 005: UI translations table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ui_translations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,
  content_en  TEXT NOT NULL,
  content_fr  TEXT NOT NULL,
  category    TEXT NOT NULL,
  context     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_translations_category
  ON public.ui_translations (category);

CREATE INDEX IF NOT EXISTS idx_translations_key
  ON public.ui_translations (key);

CREATE INDEX IF NOT EXISTS idx_translations_category_key
  ON public.ui_translations (category, key);

-- RLS
ALTER TABLE public.ui_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read translations"
  ON public.ui_translations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage translations"
  ON public.ui_translations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Auto-update trigger
CREATE TRIGGER ui_translations_updated_at
  BEFORE UPDATE ON public.ui_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
