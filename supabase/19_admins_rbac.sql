-- S5: RBAC admin — roles viewer | editor | superadmin
-- Idempotente — seguro reexecutar.
-- (Cópia espelhada de rio-groove-store-v2/supabase/19_admins_rbac.sql)

ALTER TABLE IF EXISTS public.admins
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'editor'
  CHECK (role IN ('viewer', 'editor', 'superadmin'));

COMMENT ON COLUMN public.admins.role IS 'viewer=leitura; editor=operacional; superadmin=configuração e gestão de admins';

UPDATE public.admins
SET role = 'superadmin'
WHERE role = 'editor';

CREATE OR REPLACE FUNCTION public.admin_has_role(min_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE a.id = auth.uid()
      AND CASE a.role
        WHEN 'superadmin' THEN 3
        WHEN 'editor' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
      END >= CASE min_role
        WHEN 'superadmin' THEN 3
        WHEN 'editor' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 99
      END
  );
$$;

GRANT EXECUTE ON FUNCTION public.admin_has_role(text) TO authenticated;
