-- S1 fix: admin consegue INSERT na newsletter; loja continua via RPC.
-- Idempotente — rode após 15_newsletter_rls_harden.sql

-- Policy INSERT para admins (não existia — bloqueava "Adicionar" no painel)
DROP POLICY IF EXISTS "Admins insert newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Admins insert newsletter"
  ON public.newsletter_subscribers FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Privilégios: admin autenticado pode CRUD via RLS; anon não
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
REVOKE INSERT, UPDATE ON public.newsletter_subscribers FROM anon;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Reforça RPC da loja (footer / checkout)
CREATE OR REPLACE FUNCTION public.subscribe_newsletter(
  p_email text,
  p_name text DEFAULT NULL,
  p_source text DEFAULT 'footer'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text := lower(trim(p_email));
  row public.newsletter_subscribers;
BEGIN
  IF normalized IS NULL OR normalized = '' OR position('@' in normalized) = 0 THEN
    RAISE EXCEPTION 'E-mail inválido' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.newsletter_subscribers (email, name, source, status, accepts_marketing, subscribed_at, updated_at)
  VALUES (normalized, nullif(trim(p_name), ''), coalesce(nullif(trim(p_source), ''), 'footer'), 'active', true, now(), now())
  ON CONFLICT (email) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.newsletter_subscribers.name),
    source = EXCLUDED.source,
    status = 'active',
    accepts_marketing = true,
    unsubscribed_at = NULL,
    updated_at = now()
  RETURNING * INTO row;

  RETURN to_jsonb(row);
END;
$$;

ALTER FUNCTION public.subscribe_newsletter(text, text, text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.subscribe_newsletter(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_newsletter(text, text, text) TO anon, authenticated, service_role;
