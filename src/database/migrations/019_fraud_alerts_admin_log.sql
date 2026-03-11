-- ============================================================
-- Migration 019: Fraud alerts and admin actions log
-- ============================================================

-- -------------------------------------------------------
-- Fraud alerts
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type          TEXT NOT NULL
                      CHECK (alert_type IN (
                        'suspicious_listing',
                        'duplicate_listing',
                        'fake_photos',
                        'unrealistic_pricing',
                        'landlord_unverified',
                        'rapid_submissions',
                        'payment_fraud'
                      )),
  severity            TEXT NOT NULL
                      CHECK (severity IN ('critical','high','medium','low')),
  listing_id          UUID REFERENCES public.property_listings(id) ON DELETE SET NULL,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  description         TEXT NOT NULL,
  evidence            JSONB,
  status              TEXT NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new','investigating','resolved','dismissed')),
  assigned_to         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  investigation_notes TEXT,
  resolution          TEXT CHECK (resolution IN ('false_positive','action_taken','escalated_to_legal')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status_created
  ON public.fraud_alerts (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_severity_created
  ON public.fraud_alerts (severity DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_listing
  ON public.fraud_alerts (listing_id);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user
  ON public.fraud_alerts (user_id);

ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all fraud alerts"
  ON public.fraud_alerts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE TRIGGER fraud_alerts_updated_at
  BEFORE UPDATE ON public.fraud_alerts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------
-- Admin actions log (immutable audit trail)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_actions_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type   TEXT NOT NULL
                CHECK (action_type IN (
                  'approve_listing',
                  'reject_listing',
                  'appeal_approved',
                  'appeal_denied',
                  'suspend_user',
                  'delete_user',
                  'update_city',
                  'create_promotion_tier',
                  'update_promotion_tier',
                  'dismiss_fraud_alert',
                  'resolve_fraud_alert'
                )),
  resource_type TEXT NOT NULL
                CHECK (resource_type IN ('listing','user','city','promotion_tier','fraud_alert')),
  resource_id   UUID,
  details       JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_log_admin_created
  ON public.admin_actions_log (admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_log_resource
  ON public.admin_actions_log (resource_type, resource_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_log_action
  ON public.admin_actions_log (action_type, created_at DESC);

ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read admin actions log"
  ON public.admin_actions_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "Authenticated users can insert admin log entries"
  ON public.admin_actions_log FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

-- Prevent updates and deletes (immutable audit trail)
CREATE POLICY "No updates on admin actions log"
  ON public.admin_actions_log FOR UPDATE
  USING (false);

CREATE POLICY "No deletions on admin actions log"
  ON public.admin_actions_log FOR DELETE
  USING (false);
