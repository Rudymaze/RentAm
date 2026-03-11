-- ============================================================
-- Migration 007: Cameroon cities database
-- ============================================================

-- Main cities table
CREATE TABLE IF NOT EXISTS public.cameroon_cities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en        TEXT NOT NULL,
  name_fr        TEXT NOT NULL,
  region         TEXT NOT NULL,
  latitude       NUMERIC(10, 7) NOT NULL,
  longitude      NUMERIC(10, 7) NOT NULL,
  population     INTEGER,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  search_vector  TSVECTOR,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cities_region_active
  ON public.cameroon_cities (region, is_active);

CREATE INDEX IF NOT EXISTS idx_cities_created_at
  ON public.cameroon_cities (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cities_search_vector
  ON public.cameroon_cities USING GIN (search_vector);

-- Auto-populate search_vector from name fields
CREATE OR REPLACE FUNCTION public.update_city_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    COALESCE(NEW.name_en, '') || ' ' || COALESCE(NEW.name_fr, '') || ' ' || COALESCE(NEW.region, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cities_search_vector_update
  BEFORE INSERT OR UPDATE ON public.cameroon_cities
  FOR EACH ROW EXECUTE FUNCTION public.update_city_search_vector();

CREATE TRIGGER cities_updated_at
  BEFORE UPDATE ON public.cameroon_cities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.cameroon_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active cities"
  ON public.cameroon_cities FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "Admins can manage cities"
  ON public.cameroon_cities FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- User city favorites
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_city_favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  city_id    UUID NOT NULL REFERENCES public.cameroon_cities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, city_id)
);

CREATE INDEX IF NOT EXISTS idx_city_favorites_user
  ON public.user_city_favorites (user_id);

ALTER TABLE public.user_city_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own city favorites"
  ON public.user_city_favorites FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- User city search history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_city_searches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  city_id     UUID NOT NULL REFERENCES public.cameroon_cities(id) ON DELETE CASCADE,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_city_searches_user_time
  ON public.user_city_searches (user_id, searched_at DESC);

ALTER TABLE public.user_city_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own city search history"
  ON public.user_city_searches FOR ALL
  USING (auth.uid() = user_id);
