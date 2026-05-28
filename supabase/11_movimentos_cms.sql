-- P2: Movimentos CMS — vídeo em coleções, editorial (body), artistas, manifesto
-- Idempotente — seguro reexecutar.

-- Coleções: vídeo YouTube
ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Editorial: corpo do artigo
ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS body TEXT;

ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- Artistas
CREATE TABLE IF NOT EXISTS public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  cover_image_url TEXT,
  instagram_url TEXT,
  video_url TEXT,
  portfolio_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS artists_slug_idx ON public.artists (slug);
CREATE INDEX IF NOT EXISTS artists_active_idx ON public.artists (active);

ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active artists" ON public.artists;
CREATE POLICY "Public read active artists"
  ON public.artists FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Admins read all artists" ON public.artists;
CREATE POLICY "Admins read all artists"
  ON public.artists FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins insert artists" ON public.artists;
CREATE POLICY "Admins insert artists"
  ON public.artists FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins update artists" ON public.artists;
CREATE POLICY "Admins update artists"
  ON public.artists FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins delete artists" ON public.artists;
CREATE POLICY "Admins delete artists"
  ON public.artists FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Manifesto (storefront_sections)
INSERT INTO public.storefront_sections (section_key, type, content, active, order_index)
SELECT
  'manifesto',
  'manifesto',
  '{
    "title": "Manifesto",
    "subtitle": "A essência Rio Groove — cultura, identidade e resistência carioca.",
    "body": "",
    "hero_image_url": ""
  }'::jsonb,
  true,
  7
WHERE NOT EXISTS (
  SELECT 1 FROM public.storefront_sections WHERE section_key = 'manifesto'
);
