-- Inscrição pública via RPC (contorna conflitos de RLS no REST direto)
-- Idempotente — rode após 12 e 13.

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
    RAISE EXCEPTION 'E-mail inválido';
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

REVOKE ALL ON FUNCTION public.subscribe_newsletter(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_newsletter(text, text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.log_affiliate_click(
  p_slug text,
  p_landing_path text DEFAULT '/',
  p_session_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  aid uuid;
BEGIN
  SELECT id INTO aid
  FROM public.affiliates
  WHERE slug = lower(trim(p_slug)) AND active = true
  LIMIT 1;

  IF aid IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.affiliate_clicks (affiliate_id, landing_path, session_id)
  VALUES (aid, coalesce(p_landing_path, '/'), p_session_id);
END;
$$;

REVOKE ALL ON FUNCTION public.log_affiliate_click(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_affiliate_click(text, text, text) TO anon, authenticated, service_role;
