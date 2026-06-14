-- Update all RLS policies that check for 'administrador' to use 'entrenador_administrador'
-- First drop old policies that reference 'administrador', then recreate with new role name

-- perfiles: drop and recreate policies that check rol
DO $$ 
BEGIN
  -- Update plantillas_rutina policies
  DROP POLICY IF EXISTS "trainer_select_plantillas" ON plantillas_rutina;
  DROP POLICY IF EXISTS "trainer_insert_plantillas" ON plantillas_rutina;
  DROP POLICY IF EXISTS "trainer_update_plantillas" ON plantillas_rutina;
  DROP POLICY IF EXISTS "trainer_delete_plantillas" ON plantillas_rutina;
  DROP POLICY IF EXISTS "select_plantillas_rutina" ON plantillas_rutina;
  DROP POLICY IF EXISTS "insert_plantillas_rutina" ON plantillas_rutina;
  DROP POLICY IF EXISTS "update_plantillas_rutina" ON plantillas_rutina;
  DROP POLICY IF EXISTS "delete_plantillas_rutina" ON plantillas_rutina;
END $$;

CREATE POLICY "select_plantillas_rutina" ON plantillas_rutina FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "insert_plantillas_rutina" ON plantillas_rutina FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "update_plantillas_rutina" ON plantillas_rutina FOR UPDATE
  TO authenticated
  USING (
    creado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol = 'entrenador_administrador'
    )
  )
  WITH CHECK (
    creado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol = 'entrenador_administrador'
    )
  );

CREATE POLICY "delete_plantillas_rutina" ON plantillas_rutina FOR DELETE
  TO authenticated
  USING (
    creado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol = 'entrenador_administrador'
    )
  );

-- plantilla_dias
DO $$
BEGIN
  DROP POLICY IF EXISTS "select_plantilla_dias" ON plantilla_dias;
  DROP POLICY IF EXISTS "insert_plantilla_dias" ON plantilla_dias;
  DROP POLICY IF EXISTS "update_plantilla_dias" ON plantilla_dias;
  DROP POLICY IF EXISTS "delete_plantilla_dias" ON plantilla_dias;
END $$;

CREATE POLICY "select_plantilla_dias" ON plantilla_dias FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "insert_plantilla_dias" ON plantilla_dias FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "update_plantilla_dias" ON plantilla_dias FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "delete_plantilla_dias" ON plantilla_dias FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

-- plantilla_ejercicios
DO $$
BEGIN
  DROP POLICY IF EXISTS "select_plantilla_ejercicios" ON plantilla_ejercicios;
  DROP POLICY IF EXISTS "insert_plantilla_ejercicios" ON plantilla_ejercicios;
  DROP POLICY IF EXISTS "update_plantilla_ejercicios" ON plantilla_ejercicios;
  DROP POLICY IF EXISTS "delete_plantilla_ejercicios" ON plantilla_ejercicios;
END $$;

CREATE POLICY "select_plantilla_ejercicios" ON plantilla_ejercicios FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "insert_plantilla_ejercicios" ON plantilla_ejercicios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "update_plantilla_ejercicios" ON plantilla_ejercicios FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "delete_plantilla_ejercicios" ON plantilla_ejercicios FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

-- rutinas_alumno: update policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "insert_rutinas_alumno" ON rutinas_alumno;
  DROP POLICY IF EXISTS "update_rutinas_alumno" ON rutinas_alumno;
  DROP POLICY IF EXISTS "delete_rutinas_alumno" ON rutinas_alumno;
  DROP POLICY IF EXISTS "select_rutinas_alumno" ON rutinas_alumno;
END $$;

CREATE POLICY "select_rutinas_alumno" ON rutinas_alumno FOR SELECT
  TO authenticated
  USING (
    alumno_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "insert_rutinas_alumno" ON rutinas_alumno FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "update_rutinas_alumno" ON rutinas_alumno FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "delete_rutinas_alumno" ON rutinas_alumno FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

-- rutina_alumno_dias
DO $$
BEGIN
  DROP POLICY IF EXISTS "insert_rutina_alumno_dias" ON rutina_alumno_dias;
  DROP POLICY IF EXISTS "update_rutina_alumno_dias" ON rutina_alumno_dias;
  DROP POLICY IF EXISTS "delete_rutina_alumno_dias" ON rutina_alumno_dias;
END $$;

CREATE POLICY "insert_rutina_alumno_dias" ON rutina_alumno_dias FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "update_rutina_alumno_dias" ON rutina_alumno_dias FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "delete_rutina_alumno_dias" ON rutina_alumno_dias FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

-- rutina_alumno_ejercicios
DO $$
BEGIN
  DROP POLICY IF EXISTS "insert_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios;
  DROP POLICY IF EXISTS "update_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios;
  DROP POLICY IF EXISTS "delete_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios;
END $$;

CREATE POLICY "insert_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "update_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );

CREATE POLICY "delete_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'entrenador_administrador')
    )
  );
