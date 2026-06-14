
/*
# Fix trainer-scoped RLS for evaluaciones, dietas, and rutinas

## Summary
Trainers should only see and manage evaluaciones/dietas/rutinas for students assigned to them
(where perfiles.entrenador_id = auth.uid()). The previous policies allowed any trainer to
see all data from all students. This migration scopes trainer access to their own students only.

## Changes
- evaluaciones: trainer SELECT, INSERT, UPDATE, DELETE restricted to own students
- dietas: trainer SELECT, INSERT, UPDATE, DELETE restricted to own students
- rutinas: rebuild all policies using is_admin()/is_trainer() helpers, trainer scoped to own students

## Security
- Admin retains full access to everything
- Trainers can only CRUD records where the alumno_id student belongs to them (entrenador_id = auth.uid())
- Students can only SELECT their own rows
*/

-- ==================== EVALUACIONES ====================

DROP POLICY IF EXISTS "Trainer can view all evaluaciones" ON evaluaciones;
CREATE POLICY "Trainer can view all evaluaciones"
ON evaluaciones FOR SELECT
TO authenticated
USING (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = evaluaciones.alumno_id
      AND p.entrenador_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Trainer can insert evaluaciones" ON evaluaciones;
CREATE POLICY "Trainer can insert evaluaciones"
ON evaluaciones FOR INSERT
TO authenticated
WITH CHECK (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = alumno_id
      AND p.entrenador_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Trainer can update evaluaciones" ON evaluaciones;
CREATE POLICY "Trainer can update evaluaciones"
ON evaluaciones FOR UPDATE
TO authenticated
USING (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = evaluaciones.alumno_id
      AND p.entrenador_id = auth.uid()
  )
)
WITH CHECK (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = evaluaciones.alumno_id
      AND p.entrenador_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Trainer can delete evaluaciones" ON evaluaciones;
CREATE POLICY "Trainer can delete evaluaciones"
ON evaluaciones FOR DELETE
TO authenticated
USING (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = evaluaciones.alumno_id
      AND p.entrenador_id = auth.uid()
  )
);

-- ==================== DIETAS ====================

DROP POLICY IF EXISTS "Trainer view dietas" ON dietas;
CREATE POLICY "Trainer view dietas"
ON dietas FOR SELECT
TO authenticated
USING (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = dietas.alumno_id
      AND p.entrenador_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Trainer insert dietas" ON dietas;
CREATE POLICY "Trainer insert dietas"
ON dietas FOR INSERT
TO authenticated
WITH CHECK (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = alumno_id
      AND p.entrenador_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Trainer update dietas" ON dietas;
CREATE POLICY "Trainer update dietas"
ON dietas FOR UPDATE
TO authenticated
USING (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = dietas.alumno_id
      AND p.entrenador_id = auth.uid()
  )
)
WITH CHECK (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = dietas.alumno_id
      AND p.entrenador_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Trainer delete dietas" ON dietas;
CREATE POLICY "Trainer delete dietas"
ON dietas FOR DELETE
TO authenticated
USING (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = dietas.alumno_id
      AND p.entrenador_id = auth.uid()
  )
);

-- ==================== RUTINAS ====================

ALTER TABLE rutinas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view rutinas" ON rutinas;
DROP POLICY IF EXISTS "Admin can insert rutinas" ON rutinas;
DROP POLICY IF EXISTS "Admin can update rutinas" ON rutinas;
DROP POLICY IF EXISTS "Admin can delete rutinas" ON rutinas;
DROP POLICY IF EXISTS "Students can view own rutinas" ON rutinas;
DROP POLICY IF EXISTS "Trainer can view rutinas" ON rutinas;
DROP POLICY IF EXISTS "Trainer can insert rutinas" ON rutinas;
DROP POLICY IF EXISTS "Trainer can update rutinas" ON rutinas;
DROP POLICY IF EXISTS "Trainer can delete rutinas" ON rutinas;

CREATE POLICY "Admin can view rutinas"
ON rutinas FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admin can insert rutinas"
ON rutinas FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin can update rutinas"
ON rutinas FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin can delete rutinas"
ON rutinas FOR DELETE
TO authenticated
USING (is_admin());

CREATE POLICY "Trainer can view rutinas"
ON rutinas FOR SELECT
TO authenticated
USING (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = rutinas.alumno_id
      AND p.entrenador_id = auth.uid()
  )
);

CREATE POLICY "Trainer can insert rutinas"
ON rutinas FOR INSERT
TO authenticated
WITH CHECK (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = alumno_id
      AND p.entrenador_id = auth.uid()
  )
);

CREATE POLICY "Trainer can update rutinas"
ON rutinas FOR UPDATE
TO authenticated
USING (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = rutinas.alumno_id
      AND p.entrenador_id = auth.uid()
  )
)
WITH CHECK (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = rutinas.alumno_id
      AND p.entrenador_id = auth.uid()
  )
);

CREATE POLICY "Trainer can delete rutinas"
ON rutinas FOR DELETE
TO authenticated
USING (
  is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p
    WHERE p.id = rutinas.alumno_id
      AND p.entrenador_id = auth.uid()
  )
);

CREATE POLICY "Students can view own rutinas"
ON rutinas FOR SELECT
TO authenticated
USING (alumno_id = auth.uid());
