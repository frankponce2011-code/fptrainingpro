-- Fix is_admin() to use new role name
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador'
  );
$$;

-- Fix is_trainer() to also include entrenador_administrador so admin can manage dietas/evaluaciones
CREATE OR REPLACE FUNCTION is_trainer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('entrenador', 'entrenador_administrador')
  );
$$;

-- Fix perfiles policies that hardcode 'administrador'
DROP POLICY IF EXISTS "admin_select_all" ON perfiles;
DROP POLICY IF EXISTS "admin_insert_all" ON perfiles;
DROP POLICY IF EXISTS "admin_update_all" ON perfiles;
DROP POLICY IF EXISTS "admin_delete_all" ON perfiles;
DROP POLICY IF EXISTS "trainer_select" ON perfiles;
DROP POLICY IF EXISTS "trainer_update" ON perfiles;
DROP POLICY IF EXISTS "trainer_delete_alumnos" ON perfiles;

CREATE POLICY "admin_select_all" ON perfiles FOR SELECT
  TO authenticated USING (get_my_role() = 'entrenador_administrador');

CREATE POLICY "admin_insert_all" ON perfiles FOR INSERT
  TO authenticated WITH CHECK (get_my_role() = 'entrenador_administrador');

CREATE POLICY "admin_update_all" ON perfiles FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'entrenador_administrador')
  WITH CHECK (get_my_role() = 'entrenador_administrador');

CREATE POLICY "admin_delete_all" ON perfiles FOR DELETE
  TO authenticated USING (get_my_role() = 'entrenador_administrador');

-- Trainer can see own profile + their alumnos
CREATE POLICY "trainer_select" ON perfiles FOR SELECT
  TO authenticated USING (
    id = auth.uid()
    OR (entrenador_id = auth.uid() AND get_my_role() = 'entrenador')
  );

-- Trainer can update own profile + their alumnos
CREATE POLICY "trainer_update" ON perfiles FOR UPDATE
  TO authenticated
  USING (
    (id = auth.uid() AND get_my_role() = 'entrenador')
    OR (entrenador_id = auth.uid() AND get_my_role() = 'entrenador')
  )
  WITH CHECK (
    (id = auth.uid() AND get_my_role() = 'entrenador')
    OR (entrenador_id = auth.uid() AND get_my_role() = 'entrenador')
  );

-- Trainer can delete their alumnos
CREATE POLICY "trainer_delete_alumnos" ON perfiles FOR DELETE
  TO authenticated USING (
    get_my_role() = 'entrenador'
    AND entrenador_id = auth.uid()
    AND rol = 'alumno'
  );

-- Fix storage dietas-files policies
DROP POLICY IF EXISTS "Admin can delete dietas files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload dietas files" ON storage.objects;

CREATE POLICY "Admin can upload dietas files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'dietas-files'
    AND EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'entrenador_administrador'
    )
  );

CREATE POLICY "Admin can delete dietas files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'dietas-files'
    AND EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'entrenador_administrador'
    )
  );
