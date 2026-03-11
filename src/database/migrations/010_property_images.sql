-- ============================================================
-- Migration 010: Property images table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.property_images (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id     UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
  storage_path   TEXT NOT NULL,
  url            TEXT NOT NULL,
  thumbnail_url  TEXT,
  display_order  INTEGER NOT NULL DEFAULT 0,
  file_size      INTEGER,
  mime_type      TEXT,
  width          INTEGER,
  height         INTEGER,
  uploaded_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ  -- soft delete
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_images_listing_order
  ON public.property_images (listing_id, display_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_images_listing_deleted
  ON public.property_images (listing_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_images_uploaded_by
  ON public.property_images (uploaded_by, created_at DESC);

-- Auto-update trigger
CREATE TRIGGER property_images_updated_at
  BEFORE UPDATE ON public.property_images
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listing owners can manage their images"
  ON public.property_images FOR ALL
  USING (
    auth.uid() = uploaded_by OR
    EXISTS (
      SELECT 1 FROM public.property_listings l
      WHERE l.id = listing_id AND l.created_by = auth.uid()
    )
  );

CREATE POLICY "Anyone can read images of approved listings"
  ON public.property_images FOR SELECT
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM public.property_listings l
      WHERE l.id = listing_id AND l.status = 'approved'
    )
  );

CREATE POLICY "Admins can manage all images"
  ON public.property_images FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
