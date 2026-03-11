-- ============================================================
-- Migration 020: User moderation - profiles extension + complaints
-- ============================================================

-- Extend profiles with moderation fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status           TEXT NOT NULL DEFAULT 'active'
                                            CHECK (status IN ('active','suspended','banned')),
  ADD COLUMN IF NOT EXISTS status_reason    TEXT,
  ADD COLUMN IF NOT EXISTS suspended_until  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_status
  ON public.profiles (status);

-- -------------------------------------------------------
-- User complaints
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_complaints (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_type     TEXT NOT NULL
                    CHECK (resource_type IN ('listing','user','inquiry')),
  resource_id       UUID NOT NULL,
  reason            TEXT NOT NULL
                    CHECK (reason IN (
                      'spam',
                      'scam_or_fraud',
                      'inappropriate_content',
                      'harassment',
                      'other'
                    )),
  details           TEXT,
  status            TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','investigating','resolved','dismissed')),
  admin_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_reporter
  ON public.user_complaints (reporter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_complaints_reported_user
  ON public.user_complaints (reported_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_complaints_status
  ON public.user_complaints (status, created_at DESC);

ALTER TABLE public.user_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create complaints"
  ON public.user_complaints FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own complaints"
  ON public.user_complaints FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all complaints"
  ON public.user_complaints FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE TRIGGER user_complaints_updated_at
  BEFORE UPDATE ON public.user_complaints
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------
-- Extend admin_actions_log with moderation action types
-- (drop and recreate constraint to expand enum)
-- -------------------------------------------------------
ALTER TABLE public.admin_actions_log
  ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.admin_actions_log
  DROP CONSTRAINT IF EXISTS admin_actions_log_action_type_check;

ALTER TABLE public.admin_actions_log
  ADD CONSTRAINT admin_actions_log_action_type_check
  CHECK (action_type IN (
    'approve_listing',
    'reject_listing',
    'appeal_approved',
    'appeal_denied',
    'suspend_user',
    'ban_user',
    'unsuspend_user',
    'warn_user',
    'delete_user',
    'update_city',
    'create_promotion_tier',
    'update_promotion_tier',
    'dismiss_fraud_alert',
    'resolve_fraud_alert',
    'resolve_complaint',
    'dismiss_complaint'
  ));

ALTER TABLE public.admin_actions_log
  DROP CONSTRAINT IF EXISTS admin_actions_log_resource_type_check;

ALTER TABLE public.admin_actions_log
  ADD CONSTRAINT admin_actions_log_resource_type_check
  CHECK (resource_type IN ('listing','user','city','promotion_tier','fraud_alert','complaint'));
