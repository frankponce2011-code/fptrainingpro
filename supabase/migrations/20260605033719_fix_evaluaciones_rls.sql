-- Fix evaluaciones RLS policies to use security definer function (no recursion)

-- Drop existing policies
DROP POLICY IF EXISTS "Admin and entrenador can insert evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "Admin and entrenador can update evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "Admin can delete evaluaciones" ON evaluaciones;
DROP POLICY IF EXISTS "Students can view own evaluaciones" ON evaluaciones;

-- Create a helper function for trainer check
CREATE OR REPLACE FUNCTION is_trainer()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador'
  );
$$;

-- Students can view their own evaluaciones
CREATE POLICY "Students can view own evaluaciones"
  ON evaluaciones FOR SELECT
  TO authenticated
  USING (alumno_id = auth.uid());

-- Admin/trainers can view all evaluaciones
CREATE POLICY "Admin can view all evaluaciones"
  ON evaluaciones FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Trainer can view all evaluaciones"
  ON evaluaciones FOR SELECT
  TO authenticated
  USING (is_trainer());

-- Admin/trainers can insert evaluaciones
CREATE POLICY "Admin can insert evaluaciones"
  ON evaluaciones FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Trainer can insert evaluaciones"
  ON evaluaciones FOR INSERT
  TO authenticated
  WITH CHECK (is_trainer());

-- Admin/trainers can update evaluaciones
CREATE POLICY "Admin can update evaluaciones"
  ON evaluaciones FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Trainer can update evaluaciones"
  ON evaluaciones FOR UPDATE
  TO authenticated
  USING (is_trainer())
  WITH CHECK (is_trainer());

-- Admin can delete evaluaciones
CREATE POLICY "Admin can delete evaluaciones"
  ON evaluaciones FOR DELETE
  TO authenticated
  USING (is_admin());
