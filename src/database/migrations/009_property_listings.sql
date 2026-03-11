-- ============================================================
-- Migration 009: Property listings, drafts, favorites
-- ============================================================

-- Main listings table
CREATE TABLE IF NOT EXISTS public.property_listings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  property_type    TEXT NOT NULL CHECK (property_type IN ('apartment','house','villa','commercial','land')),
  bedrooms         INTEGER,
  bathrooms        INTEGER,
  city_id          UUID REFERENCES public.cameroon_cities(id),
  address          TEXT,
  latitude         NUMERIC(10, 7),
  longitude        NUMERIC(10, 7),
  amenities        JSONB DEFAULT '[]',
  listing_type     TEXT NOT NULL CHECK (listing_type IN ('rent','sale')),
  rental_price     NUMERIC(15, 0),
  sale_price       NUMERIC(15, 0),
  images           JSONB DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','pending_review','approved','rejected','archived')),
  rejection_reason TEXT,
  view_count       INTEGER NOT NULL DEFAULT 0,
  published_at     TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_created_by      ON public.property_listings (created_by);
CREATE INDEX IF NOT EXISTS idx_listings_status          ON public.property_listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_city_id         ON public.property_listings (city_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_by_status ON public.property_listings (created_by, status);
CREATE INDEX IF NOT EXISTS idx_listings_type_status     ON public.property_listings (listing_type, status);

ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their listings"
  ON public.property_listings FOR ALL
  USING (auth.uid() = created_by);

CREATE POLICY "Anyone can read approved listings"
  ON public.property_listings FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Admins can manage all listings"
  ON public.property_listings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.property_listings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Drafts table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_listing_drafts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id   UUID REFERENCES public.property_listings(id) ON DELETE SET NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  draft_data   JSONB NOT NULL DEFAULT '{}',
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON public.property_listing_drafts (user_id);

ALTER TABLE public.property_listing_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own drafts"
  ON public.property_listing_drafts FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER drafts_updated_at
  BEFORE UPDATE ON public.property_listing_drafts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Favorites table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_listing_favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id    ON public.property_listing_favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON public.property_listing_favorites (listing_id);

ALTER TABLE public.property_listing_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites"
  ON public.property_listing_favorites FOR ALL
  USING (auth.uid() = user_id);
