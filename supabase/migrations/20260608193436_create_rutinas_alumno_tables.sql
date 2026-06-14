-- Table: rutinas_alumno
CREATE TABLE IF NOT EXISTS rutinas_alumno (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id   uuid NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  plantilla_id uuid REFERENCES plantillas_rutina(id) ON DELETE SET NULL,
  nombre      text NOT NULL,
  descripcion text,
  asignado_por uuid REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rutinas_alumno ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_rutinas_alumno" ON rutinas_alumno FOR SELECT
  TO authenticated
  USING (
    alumno_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'administrador')
    )
  );

CREATE POLICY "insert_rutinas_alumno" ON rutinas_alumno FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'administrador')
    )
  );

CREATE POLICY "update_rutinas_alumno" ON rutinas_alumno FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'administrador')
    )
  );

CREATE POLICY "delete_rutinas_alumno" ON rutinas_alumno FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'administrador')
    )
  );

-- Table: rutina_alumno_dias (days copied from template)
CREATE TABLE IF NOT EXISTS rutina_alumno_dias (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rutina_id     uuid NOT NULL REFERENCES rutinas_alumno(id) ON DELETE CASCADE,
  numero_dia    int NOT NULL,
  nombre_dia    text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rutina_alumno_dias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_rutina_alumno_dias" ON rutina_alumno_dias FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rutinas_alumno ra
      WHERE ra.id = rutina_alumno_dias.rutina_id
        AND (
          ra.alumno_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM perfiles p
            WHERE p.id = auth.uid()
              AND p.rol IN ('entrenador', 'administrador')
          )
        )
    )
  );

CREATE POLICY "insert_rutina_alumno_dias" ON rutina_alumno_dias FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'administrador')
    )
  );

CREATE POLICY "update_rutina_alumno_dias" ON rutina_alumno_dias FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'administrador')
    )
  );

CREATE POLICY "delete_rutina_alumno_dias" ON rutina_alumno_dias FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'administrador')
    )
  );

-- Table: rutina_alumno_ejercicios (exercises per day)
CREATE TABLE IF NOT EXISTS rutina_alumno_ejercicios (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_id                uuid NOT NULL REFERENCES rutina_alumno_dias(id) ON DELETE CASCADE,
  ejercicio_id          uuid NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  orden                 int NOT NULL DEFAULT 0,
  series                int,
  repeticiones          text,
  descanso_segundos     int,
  tipo                  text NOT NULL DEFAULT 'serie',
  grupo_serie           text,
  notas                 text,
  ejercicio_alternativo uuid REFERENCES ejercicios(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rutina_alumno_ejercicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rutina_alumno_dias rad
      JOIN rutinas_alumno ra ON ra.id = rad.rutina_id
      WHERE rad.id = rutina_alumno_ejercicios.dia_id
        AND (
          ra.alumno_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM perfiles p
            WHERE p.id = auth.uid()
              AND p.rol IN ('entrenador', 'administrador')
          )
        )
    )
  );

CREATE POLICY "insert_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'administrador')
    )
  );

CREATE POLICY "update_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'administrador')
    )
  );

CREATE POLICY "delete_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol IN ('entrenador', 'administrador')
    )
  );
