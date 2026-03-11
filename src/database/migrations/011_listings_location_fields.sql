-- ============================================================
-- Migration 011: Extend listings with detailed location fields
--               + cameroon_cities geojson
-- ============================================================

-- Extend cameroon_cities with GeoJSON support
ALTER TABLE public.cameroon_cities
  ADD COLUMN IF NOT EXISTS geojson JSONB;

-- Extend property_listings with precise location fields
ALTER TABLE public.property_listings
  ADD COLUMN IF NOT EXISTS map_zoom_level           INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS location_accuracy        TEXT DEFAULT 'address_only'
    CHECK (location_accuracy IN ('precise', 'approximate', 'address_only')),
  ADD COLUMN IF NOT EXISTS reverse_geocoded_address TEXT;

-- Spatial index for nearby property queries
CREATE INDEX IF NOT EXISTS idx_listings_coordinates
  ON public.property_listings (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_city_coordinates
  ON public.property_listings (city_id, latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
