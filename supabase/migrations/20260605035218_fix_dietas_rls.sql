-- Fix dietas RLS policies using security definer functions

DROP POLICY IF EXISTS "Admin can delete dietas" ON dietas;
DROP POLICY IF EXISTS "Admin can insert dietas" ON dietas;
DROP POLICY IF EXISTS "Admin can update dietas" ON dietas;
DROP POLICY IF EXISTS "Students can view own dietas" ON dietas;

-- Students can view their own dietas
CREATE POLICY "Students view own dietas"
  ON dietas FOR SELECT
  TO authenticated
  USING (alumno_id = auth.uid());

-- Admin can view all dietas
CREATE POLICY "Admin view dietas"
  ON dietas FOR SELECT
  TO authenticated
  USING (is_admin());

-- Trainer can view all dietas
CREATE POLICY "Trainer view dietas"
  ON dietas FOR SELECT
  TO authenticated
  USING (is_trainer());

-- Admin can insert dietas
CREATE POLICY "Admin insert dietas"
  ON dietas FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Trainer can insert dietas
CREATE POLICY "Trainer insert dietas"
  ON dietas FOR INSERT
  TO authenticated
  WITH CHECK (is_trainer());

-- Admin can update dietas
CREATE POLICY "Admin update dietas"
  ON dietas FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Trainer can update dietas
CREATE POLICY "Trainer update dietas"
  ON dietas FOR UPDATE
  TO authenticated
  USING (is_trainer())
  WITH CHECK (is_trainer());

-- Admin can delete dietas
CREATE POLICY "Admin delete dietas"
  ON dietas FOR DELETE
  TO authenticated
  USING (is_admin());

-- Trainer can delete dietas
CREATE POLICY "Trainer delete dietas"
  ON dietas FOR DELETE
  TO authenticated
  USING (is_trainer());
