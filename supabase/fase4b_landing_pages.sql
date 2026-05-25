-- Fase 4B — landing_pages (executar no SQL Editor do Supabase)
-- Compatível com StorefrontLandingPages.jsx + storefrontCms.js

CREATE TABLE IF NOT EXISTS public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'collection',
  hero_banner_url TEXT,
  editorial_phrase TEXT,
  cta_text TEXT,
  cta_link TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  sections_order JSONB NOT NULL DEFAULT '["hero","products","editorial"]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS landing_pages_slug_idx ON public.landing_pages (slug);
CREATE INDEX IF NOT EXISTS landing_pages_active_idx ON public.landing_pages (active);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Leitura pública: páginas ativas (storefront v2)
DROP POLICY IF EXISTS "Public read active landing pages" ON public.landing_pages;
CREATE POLICY "Public read active landing pages"
  ON public.landing_pages FOR SELECT
  USING (active = true);

-- Admin autenticado na tabela admins
DROP POLICY IF EXISTS "Admins read all landing pages" ON public.landing_pages;
CREATE POLICY "Admins read all landing pages"
  ON public.landing_pages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins insert landing pages" ON public.landing_pages;
CREATE POLICY "Admins insert landing pages"
  ON public.landing_pages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins update landing pages" ON public.landing_pages;
CREATE POLICY "Admins update landing pages"
  ON public.landing_pages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins delete landing pages" ON public.landing_pages;
CREATE POLICY "Admins delete landing pages"
  ON public.landing_pages FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
