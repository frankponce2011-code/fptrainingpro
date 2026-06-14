-- Add entrenador_id to perfiles table
ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS entrenador_id uuid REFERENCES perfiles(id) ON DELETE SET NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_perfiles_entrenador_id ON perfiles(entrenador_id);

-- Update RLS policies for perfiles
-- Drop all existing policies to rebuild cleanly
DROP POLICY IF EXISTS "Users can view own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can update own profile" ON perfiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON perfiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON perfiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON perfiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON perfiles;
DROP POLICY IF EXISTS "Trainer can view own alumnos" ON perfiles;
DROP POLICY IF EXISTS "Trainer can insert alumnos" ON perfiles;
DROP POLICY IF EXISTS "Trainer can update own alumnos" ON perfiles;
DROP POLICY IF EXISTS "Trainer can delete own alumnos" ON perfiles;
DROP POLICY IF EXISTS "Trainer can view own profile" ON perfiles;
DROP POLICY IF EXISTS "Alumno can view own profile" ON perfiles;
DROP POLICY IF EXISTS "Alumno can update own profile" ON perfiles;

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

-- Trainer: can view own profile + their own alumnos
CREATE POLICY "trainer_select_own_and_alumnos" ON perfiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR entrenador_id = auth.uid()
  );

-- Trainer: can insert alumnos (alumno's entrenador_id must be the trainer)
CREATE POLICY "trainer_insert_alumnos" ON perfiles
  FOR INSERT TO authenticated
  WITH CHECK (
    is_trainer() AND entrenador_id = auth.uid() AND rol = 'alumno'
  );

-- Trainer: can update their own alumnos or own profile
CREATE POLICY "trainer_update_own_and_alumnos" ON perfiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR (is_trainer() AND entrenador_id = auth.uid()))
  WITH CHECK (id = auth.uid() OR (is_trainer() AND entrenador_id = auth.uid()));

-- Trainer: can delete their own alumnos
CREATE POLICY "trainer_delete_alumnos" ON perfiles
  FOR DELETE TO authenticated
  USING (is_trainer() AND entrenador_id = auth.uid() AND rol = 'alumno');

-- Alumno: can only view and update their own profile
CREATE POLICY "alumno_select_own" ON perfiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "alumno_update_own" ON perfiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND NOT is_admin() AND NOT is_trainer())
  WITH CHECK (id = auth.uid());
