-- P3: Ferramentas de crescimento — Newsletter, Afiliados, SEO global
-- Idempotente — seguro reexecutar.

-- Newsletter
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT NOT NULL DEFAULT 'footer',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  accepts_marketing BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx ON public.newsletter_subscribers (status);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_email_idx ON public.newsletter_subscribers (lower(email));

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Admins manage newsletter"
  ON public.newsletter_subscribers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Afiliados
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  coupon_code TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS affiliates_slug_idx ON public.affiliates (slug);
CREATE INDEX IF NOT EXISTS affiliates_active_idx ON public.affiliates (active);

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  landing_path TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS affiliate_clicks_affiliate_idx ON public.affiliate_clicks (affiliate_id);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active affiliates" ON public.affiliates;
CREATE POLICY "Public read active affiliates"
  ON public.affiliates FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Admins manage affiliates" ON public.affiliates;
CREATE POLICY "Admins manage affiliates"
  ON public.affiliates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can log affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Anyone can log affiliate clicks"
  ON public.affiliate_clicks FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins read affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Admins read affiliate clicks"
  ON public.affiliate_clicks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Pedidos: atribuição de afiliado
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id),
  ADD COLUMN IF NOT EXISTS affiliate_slug TEXT;

-- SEO global (storefront_sections)
INSERT INTO public.storefront_sections (section_key, type, content, active, order_index)
SELECT
  'seo',
  'seo',
  '{
    "meta_title": "Rio Groove | Premium Streetwear",
    "meta_description": "Streetwear autoral brasileiro com presença editorial. Vista o que você carrega.",
    "og_image_url": "",
    "keywords": "streetwear, rio de janeiro, moda urbana, rio groove",
    "robots": "index,follow"
  }'::jsonb,
  true,
  8
WHERE NOT EXISTS (
  SELECT 1 FROM public.storefront_sections WHERE section_key = 'seo'
);
