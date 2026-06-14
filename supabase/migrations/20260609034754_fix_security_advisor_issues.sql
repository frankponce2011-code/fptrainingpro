-- ── 1. Fix function search_path + revoke public execute ─────────────

-- get_my_role: SECURITY DEFINER, fixed search_path, no public execute
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon, authenticated;

-- is_admin: SECURITY DEFINER, fixed search_path, no public execute
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid()
      AND rol IN ('administrador', 'entrenador_administrador')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;

-- is_trainer: SECURITY DEFINER, fixed search_path, no public execute
CREATE OR REPLACE FUNCTION public.is_trainer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles
    WHERE id = auth.uid()
      AND rol IN ('entrenador', 'entrenador_administrador')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_trainer() FROM anon, authenticated;

-- ── 2. Fix registro_ingresos INSERT policy (was always true) ─────────

DROP POLICY IF EXISTS "insert_registro_ingresos" ON registro_ingresos;
DROP POLICY IF EXISTS "registro_ingresos_insert"  ON registro_ingresos;

-- Only allow inserting a row that belongs to the currently authenticated user
CREATE POLICY "insert_registro_ingresos" ON registro_ingresos
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());
