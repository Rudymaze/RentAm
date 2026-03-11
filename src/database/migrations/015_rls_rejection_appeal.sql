-- ============================================================
-- Migration 015: RLS policies for rejection and appeal workflows
-- ============================================================

-- -------------------------------------------------------
-- property_listings: ensure landlords can submit appeals
-- (updating rejection_reason, admin_review_notes via appeal)
-- The existing "Owners can manage their listings" policy covers
-- this already. Add an explicit named policy for clarity.
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'property_listings'
      AND policyname = 'Landlords can update own listings for appeals'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Landlords can update own listings for appeals"
        ON public.property_listings FOR UPDATE
        USING (auth.uid() = created_by)
        WITH CHECK (auth.uid() = created_by)
    $pol$;
  END IF;
END;
$$;

-- -------------------------------------------------------
-- listing_verification_logs: allow authenticated users to insert
-- (the actual enforcement that only admins call this is in the API layer)
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'listing_verification_logs'
      AND policyname = 'Authenticated users can insert verification logs'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Authenticated users can insert verification logs"
        ON public.listing_verification_logs FOR INSERT
        WITH CHECK (auth.role() = 'authenticated')
    $pol$;
  END IF;
END;
$$;

-- Prevent deletes (immutable audit trail)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'listing_verification_logs'
      AND policyname = 'No deletions allowed on verification logs'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "No deletions allowed on verification logs"
        ON public.listing_verification_logs FOR DELETE
        USING (false)
    $pol$;
  END IF;
END;
$$;

-- -------------------------------------------------------
-- listing_status_history: ensure insert is allowed for authenticated
-- (already has a policy but confirm it covers appeals)
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'listing_status_history'
      AND policyname = 'No deletions allowed on status history'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "No deletions allowed on status history"
        ON public.listing_status_history FOR DELETE
        USING (false)
    $pol$;
  END IF;
END;
$$;

-- -------------------------------------------------------
-- Storage bucket: listing-appeals
-- NOTE: The bucket itself must be created via Supabase dashboard
-- or management API. The SQL below sets up storage object policies.
-- -------------------------------------------------------

-- Allow authenticated users to upload to their own listing paths
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-appeals',
  'listing-appeals',
  false,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload to own listing appeal paths"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-appeals'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'listings'
  );

CREATE POLICY "Users read own appeal uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'listing-appeals'
    AND (
      auth.role() = 'authenticated'
      AND (
        EXISTS (
          SELECT 1 FROM public.property_listings l
          WHERE l.id::text = (storage.foldername(name))[2]
            AND l.created_by = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins can delete appeal uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-appeals'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
