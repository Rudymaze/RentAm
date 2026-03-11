-- ============================================================
-- Migration 017: Inquiries, inquiry responses, inquiry templates
-- ============================================================

-- -------------------------------------------------------
-- Inquiries table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inquiries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id           UUID NOT NULL REFERENCES public.property_listings(id) ON DELETE CASCADE,
  template_type         TEXT NOT NULL
                        CHECK (template_type IN (
                          'availability_check',
                          'viewing_request',
                          'price_negotiation',
                          'general_inquiry',
                          'custom'
                        )),
  message               TEXT NOT NULL CHECK (char_length(message) BETWEEN 20 AND 500),
  contact_preferences   JSONB,
  attachments           JSONB DEFAULT '[]',
  status                TEXT NOT NULL DEFAULT 'awaiting_response'
                        CHECK (status IN ('awaiting_response','responded','no_response','deleted')),
  is_read_by_landlord   BOOLEAN NOT NULL DEFAULT FALSE,
  read_at               TIMESTAMPTZ,
  has_response          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inquiries_tenant
  ON public.inquiries (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiries_landlord
  ON public.inquiries (landlord_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiries_property
  ON public.inquiries (property_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiries_status
  ON public.inquiries (status, created_at DESC);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can create inquiries"
  ON public.inquiries FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can view their own inquiries"
  ON public.inquiries FOR SELECT
  USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view inquiries for their listings"
  ON public.inquiries FOR SELECT
  USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can soft-delete their own inquiries"
  ON public.inquiries FOR UPDATE
  USING (auth.uid() = tenant_id)
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Landlords can update inquiry read status"
  ON public.inquiries FOR UPDATE
  USING (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Admins can manage all inquiries"
  ON public.inquiries FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE TRIGGER inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------
-- Inquiry responses table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inquiry_responses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id          UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  sender_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message             TEXT NOT NULL CHECK (char_length(message) BETWEEN 20 AND 500),
  attachments         JSONB DEFAULT '[]',
  is_read_by_tenant   BOOLEAN NOT NULL DEFAULT FALSE,
  read_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_responses_inquiry
  ON public.inquiry_responses (inquiry_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiry_responses_sender
  ON public.inquiry_responses (sender_id, created_at DESC);

ALTER TABLE public.inquiry_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can create responses"
  ON public.inquiry_responses FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.inquiries i
      WHERE i.id = inquiry_id AND i.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Participants can view responses"
  ON public.inquiry_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      WHERE i.id = inquiry_id
        AND (i.tenant_id = auth.uid() OR i.landlord_id = auth.uid())
    )
  );

CREATE POLICY "Tenants can mark responses as read"
  ON public.inquiry_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries i
      WHERE i.id = inquiry_id AND i.tenant_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all responses"
  ON public.inquiry_responses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE TRIGGER inquiry_responses_updated_at
  BEFORE UPDATE ON public.inquiry_responses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------
-- Inquiry templates table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inquiry_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL
                CHECK (template_type IN (
                  'availability_check',
                  'viewing_request',
                  'price_negotiation',
                  'general_inquiry',
                  'custom'
                )),
  title         TEXT NOT NULL,
  message_body  TEXT NOT NULL,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  language      TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','fr')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_templates_user
  ON public.inquiry_templates (user_id, template_type);

CREATE INDEX IF NOT EXISTS idx_inquiry_templates_default
  ON public.inquiry_templates (is_default, template_type);

ALTER TABLE public.inquiry_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own templates"
  ON public.inquiry_templates FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can read default templates"
  ON public.inquiry_templates FOR SELECT
  USING (is_default = TRUE);

CREATE TRIGGER inquiry_templates_updated_at
  BEFORE UPDATE ON public.inquiry_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
