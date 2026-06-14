/*
# Fix perfiles RLS — allow service role unrestricted access

The create-user Edge Function uses the service_role key, which bypasses RLS
automatically. However, the trainer INSERT policy was too restrictive for
the admin use case. This migration simplifies policies so they are correct
and non-recursive.
*/

-- Drop ALL existing perfiles policies to rebuild cleanly
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'perfiles' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON perfiles';
  END LOOP;
END $$;

-- Admin: full access
CREATE POLICY "admin_select_all" ON perfiles
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "admin_insert_all" ON perfiles
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "admin_update_all" ON perfiles
  FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin_delete_all" ON perfiles
  FOR DELETE TO authenticated USING (is_admin());

-- Trainer: can view own profile AND their alumnos
CREATE POLICY "trainer_select" ON perfiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR entrenador_id = auth.uid());

-- Trainer: can update their own alumnos or own profile
CREATE POLICY "trainer_update" ON perfiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR (is_trainer() AND entrenador_id = auth.uid()))
  WITH CHECK (id = auth.uid() OR (is_trainer() AND entrenador_id = auth.uid()));

-- Trainer: can delete their own alumnos
CREATE POLICY "trainer_delete_alumnos" ON perfiles
  FOR DELETE TO authenticated
  USING (is_trainer() AND entrenador_id = auth.uid() AND rol = 'alumno');

-- Alumno: can view own profile + own entrenador's profile (to show trainer name)
CREATE POLICY "alumno_select_own" ON perfiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR (
    EXISTS (
      SELECT 1 FROM perfiles p2
      WHERE p2.id = auth.uid() AND p2.entrenador_id = perfiles.id
    )
  ));

CREATE POLICY "alumno_update_own" ON perfiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND NOT is_admin() AND NOT is_trainer())
  WITH CHECK (id = auth.uid());
