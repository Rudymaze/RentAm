-- ============================================================
-- Migration 016: User saved searches
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_saved_searches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  search_name    VARCHAR(100) NOT NULL,
  filter_criteria JSONB NOT NULL,
  result_count   INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at   TIMESTAMPTZ,
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_created
  ON public.user_saved_searches (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_last_used
  ON public.user_saved_searches (user_id, last_used_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user
  ON public.user_saved_searches (user_id);

ALTER TABLE public.user_saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own saved searches"
  ON public.user_saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own saved searches"
  ON public.user_saved_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
  ON public.user_saved_searches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
  ON public.user_saved_searches FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER user_saved_searches_updated_at
  BEFORE UPDATE ON public.user_saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
