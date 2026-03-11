-- ============================================================
-- Migration 008: Profiles - add email + phone_number columns
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Sync email from auth.users on profile creation (update trigger)
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync email from auth.users when profile is created
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET email = (SELECT email FROM auth.users WHERE id = NEW.id)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: email sync happens at profile creation in handle_new_user()
-- This migration just adds the columns.
