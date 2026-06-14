-- Fix ejercicios policies
DROP POLICY IF EXISTS "Admin can insert exercises" ON ejercicios;
DROP POLICY IF EXISTS "Admin can update exercises" ON ejercicios;
DROP POLICY IF EXISTS "Admin can delete exercises" ON ejercicios;

CREATE POLICY "Admin can insert exercises" ON ejercicios FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('entrenador_administrador', 'entrenador'))
  );

CREATE POLICY "Admin can update exercises" ON ejercicios FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('entrenador_administrador', 'entrenador')))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('entrenador_administrador', 'entrenador')));

CREATE POLICY "Admin can delete exercises" ON ejercicios FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('entrenador_administrador', 'entrenador'))
  );

-- Fix plantillas_rutina policies
DROP POLICY IF EXISTS "trainers_admin_insert_plantillas" ON plantillas_rutina;
DROP POLICY IF EXISTS "trainers_admin_update_plantillas" ON plantillas_rutina;
DROP POLICY IF EXISTS "trainers_admin_delete_plantillas" ON plantillas_rutina;
DROP POLICY IF EXISTS "trainers_admin_select_plantillas" ON plantillas_rutina;

CREATE POLICY "trainers_admin_select_plantillas" ON plantillas_rutina FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
    OR creado_por = auth.uid()
  );

CREATE POLICY "trainers_admin_insert_plantillas" ON plantillas_rutina FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('entrenador_administrador', 'entrenador'))
    AND creado_por = auth.uid()
  );

CREATE POLICY "trainers_admin_update_plantillas" ON plantillas_rutina FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
    OR creado_por = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
    OR creado_por = auth.uid()
  );

CREATE POLICY "trainers_admin_delete_plantillas" ON plantillas_rutina FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
    OR creado_por = auth.uid()
  );

-- Fix plantilla_dias policies
DROP POLICY IF EXISTS "dias_select" ON plantilla_dias;
DROP POLICY IF EXISTS "dias_insert" ON plantilla_dias;
DROP POLICY IF EXISTS "dias_update" ON plantilla_dias;
DROP POLICY IF EXISTS "dias_delete" ON plantilla_dias;

CREATE POLICY "dias_select" ON plantilla_dias FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM plantillas_rutina p WHERE p.id = plantilla_dias.plantilla_id AND (
    p.creado_por = auth.uid() OR
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
  ))
);
CREATE POLICY "dias_insert" ON plantilla_dias FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM plantillas_rutina p WHERE p.id = plantilla_dias.plantilla_id AND (
    p.creado_por = auth.uid() OR
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
  ))
);
CREATE POLICY "dias_update" ON plantilla_dias FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM plantillas_rutina p WHERE p.id = plantilla_dias.plantilla_id AND (
    p.creado_por = auth.uid() OR
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
  )))
  WITH CHECK (EXISTS (SELECT 1 FROM plantillas_rutina p WHERE p.id = plantilla_dias.plantilla_id AND (
    p.creado_por = auth.uid() OR
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
  )));
CREATE POLICY "dias_delete" ON plantilla_dias FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM plantillas_rutina p WHERE p.id = plantilla_dias.plantilla_id AND (
    p.creado_por = auth.uid() OR
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
  ))
);

-- Fix plantilla_ejercicios policies
DROP POLICY IF EXISTS "pej_select" ON plantilla_ejercicios;
DROP POLICY IF EXISTS "pej_insert" ON plantilla_ejercicios;
DROP POLICY IF EXISTS "pej_update" ON plantilla_ejercicios;
DROP POLICY IF EXISTS "pej_delete" ON plantilla_ejercicios;

CREATE POLICY "pej_select" ON plantilla_ejercicios FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM plantilla_dias d JOIN plantillas_rutina p ON p.id = d.plantilla_id
    WHERE d.id = plantilla_ejercicios.dia_id AND (
      p.creado_por = auth.uid() OR
      EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
    ))
);
CREATE POLICY "pej_insert" ON plantilla_ejercicios FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM plantilla_dias d JOIN plantillas_rutina p ON p.id = d.plantilla_id
    WHERE d.id = plantilla_ejercicios.dia_id AND (
      p.creado_por = auth.uid() OR
      EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
    ))
);
CREATE POLICY "pej_update" ON plantilla_ejercicios FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM plantilla_dias d JOIN plantillas_rutina p ON p.id = d.plantilla_id
    WHERE d.id = plantilla_ejercicios.dia_id AND (
      p.creado_por = auth.uid() OR
      EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
    )))
  WITH CHECK (EXISTS (SELECT 1 FROM plantilla_dias d JOIN plantillas_rutina p ON p.id = d.plantilla_id
    WHERE d.id = plantilla_ejercicios.dia_id AND (
      p.creado_por = auth.uid() OR
      EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
    )));
CREATE POLICY "pej_delete" ON plantilla_ejercicios FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM plantilla_dias d JOIN plantillas_rutina p ON p.id = d.plantilla_id
    WHERE d.id = plantilla_ejercicios.dia_id AND (
      p.creado_por = auth.uid() OR
      EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'entrenador_administrador')
    ))
);

-- Fix rutina_alumno_dias and rutina_alumno_ejercicios policies
DROP POLICY IF EXISTS "select_rutina_alumno_dias" ON rutina_alumno_dias;
DROP POLICY IF EXISTS "select_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios;

CREATE POLICY "select_rutina_alumno_dias" ON rutina_alumno_dias FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM rutinas_alumno ra WHERE ra.id = rutina_alumno_dias.rutina_id AND (
    ra.alumno_id = auth.uid() OR
    EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('entrenador', 'entrenador_administrador'))
  ))
);

CREATE POLICY "select_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM rutina_alumno_dias rad JOIN rutinas_alumno ra ON ra.id = rad.rutina_id
    WHERE rad.id = rutina_alumno_ejercicios.dia_id AND (
      ra.alumno_id = auth.uid() OR
      EXISTS (SELECT 1 FROM perfiles p WHERE p.id = auth.uid() AND p.rol IN ('entrenador', 'entrenador_administrador'))
    ))
);
