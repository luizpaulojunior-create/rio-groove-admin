-- Hotfix: permitir inscrição pública na newsletter (footer + checkout via store)
-- Rode no Supabase SQL Editor se o INSERT retornar erro 42501.

GRANT SELECT, INSERT, UPDATE ON public.newsletter_subscribers TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can subscribe newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins manage newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Public subscribe newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Public resubscribe newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins read newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins write newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins delete newsletter" ON public.newsletter_subscribers;

CREATE POLICY "Public subscribe newsletter"
  ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public resubscribe newsletter"
  ON public.newsletter_subscribers FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins read newsletter"
  ON public.newsletter_subscribers FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins write newsletter"
  ON public.newsletter_subscribers FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins delete newsletter"
  ON public.newsletter_subscribers FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

GRANT INSERT ON public.affiliate_clicks TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can log affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Anyone can log affiliate clicks"
  ON public.affiliate_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
