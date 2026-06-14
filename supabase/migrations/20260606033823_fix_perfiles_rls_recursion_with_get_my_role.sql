
/*
# Fix infinite recursion in perfiles RLS policies

## Problem
The is_admin() and is_trainer() SECURITY DEFINER functions query the perfiles table.
When perfiles policies (admin_select_all, admin_update_all, etc.) call these functions,
and the functions then SELECT from perfiles, the policies trigger again causing infinite recursion.

## Fix
Replace all is_admin() / is_trainer() calls in perfiles policies with direct inline
subqueries that use a security-definer wrapper to bypass RLS when checking the caller's role.
We create a new function get_my_role() that reads from perfiles with SECURITY DEFINER
so the self-referential loop is broken.

The key insight: policies on perfiles cannot call functions that SELECT from perfiles.
Instead, we use a single SECURITY DEFINER function that returns the caller's role,
and it will bypass the RLS check on perfiles because it runs as the function owner.
*/

-- Drop the existing perfiles policies that cause recursion
DROP POLICY IF EXISTS "admin_select_all" ON perfiles;
DROP POLICY IF EXISTS "admin_insert_all" ON perfiles;
DROP POLICY IF EXISTS "admin_update_all" ON perfiles;
DROP POLICY IF EXISTS "admin_delete_all" ON perfiles;
DROP POLICY IF EXISTS "trainer_select" ON perfiles;
DROP POLICY IF EXISTS "trainer_update" ON perfiles;
DROP POLICY IF EXISTS "trainer_delete_alumnos" ON perfiles;
DROP POLICY IF EXISTS "alumno_select_own" ON perfiles;
DROP POLICY IF EXISTS "alumno_update_own" ON perfiles;

-- Create a SECURITY DEFINER function that returns the caller's role
-- This bypasses RLS on perfiles since it runs as the function owner (postgres)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid();
$$;

-- Re-create all perfiles policies using get_my_role() instead of is_admin()/is_trainer()
-- Admin policies
CREATE POLICY "admin_select_all"
ON perfiles FOR SELECT
TO authenticated
USING (get_my_role() = 'administrador');

CREATE POLICY "admin_insert_all"
ON perfiles FOR INSERT
TO authenticated
WITH CHECK (get_my_role() = 'administrador');

CREATE POLICY "admin_update_all"
ON perfiles FOR UPDATE
TO authenticated
USING (get_my_role() = 'administrador')
WITH CHECK (get_my_role() = 'administrador');

CREATE POLICY "admin_delete_all"
ON perfiles FOR DELETE
TO authenticated
USING (get_my_role() = 'administrador');

-- Trainer policies: see own profile + their students
CREATE POLICY "trainer_select"
ON perfiles FOR SELECT
TO authenticated
USING (
  (id = auth.uid())
  OR (entrenador_id = auth.uid() AND get_my_role() = 'entrenador')
);

CREATE POLICY "trainer_update"
ON perfiles FOR UPDATE
TO authenticated
USING (
  (id = auth.uid() AND get_my_role() = 'entrenador')
  OR (entrenador_id = auth.uid() AND get_my_role() = 'entrenador')
)
WITH CHECK (
  (id = auth.uid() AND get_my_role() = 'entrenador')
  OR (entrenador_id = auth.uid() AND get_my_role() = 'entrenador')
);

CREATE POLICY "trainer_delete_alumnos"
ON perfiles FOR DELETE
TO authenticated
USING (
  get_my_role() = 'entrenador'
  AND entrenador_id = auth.uid()
  AND rol = 'alumno'
);

-- Student policies: see own profile only
CREATE POLICY "alumno_select_own"
ON perfiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "alumno_update_own"
ON perfiles FOR UPDATE
TO authenticated
USING (id = auth.uid() AND get_my_role() = 'alumno')
WITH CHECK (id = auth.uid());

-- Also update is_admin() and is_trainer() to use SECURITY DEFINER properly
-- These are used by evaluaciones/dietas/rutinas policies, not perfiles,
-- so they remain unchanged but let's ensure they have search_path set
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador');
$$;

CREATE OR REPLACE FUNCTION is_trainer()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador');
$$;
