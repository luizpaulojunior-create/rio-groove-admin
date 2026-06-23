-- Popup promocional na home (campanhas sazonais)
-- Rode no SQL Editor do Supabase se o checkbox "Popup na home" não persistir.

ALTER TABLE IF EXISTS public.campaigns
  ADD COLUMN IF NOT EXISTS show_as_popup BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.campaigns.show_as_popup IS
  'Quando true, campanha ativa exibe modal popup na home (além do card, se visível).';
