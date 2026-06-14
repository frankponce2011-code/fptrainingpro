
-- Add youtube_url to ejercicios
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS youtube_url text;

-- ─── plantillas_rutina ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plantillas_rutina (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  creado_por uuid REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE plantillas_rutina ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainers_admin_select_plantillas" ON plantillas_rutina FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
    OR creado_por = auth.uid()
  );

CREATE POLICY "trainers_admin_insert_plantillas" ON plantillas_rutina FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol IN ('administrador','entrenador'))
    AND creado_por = auth.uid()
  );

CREATE POLICY "trainers_admin_update_plantillas" ON plantillas_rutina FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
    OR creado_por = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
    OR creado_por = auth.uid()
  );

CREATE POLICY "trainers_admin_delete_plantillas" ON plantillas_rutina FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
    OR creado_por = auth.uid()
  );

-- ─── plantilla_dias ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plantilla_dias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_id uuid NOT NULL REFERENCES plantillas_rutina(id) ON DELETE CASCADE,
  numero_dia integer NOT NULL CHECK (numero_dia BETWEEN 1 AND 7),
  nombre_dia text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE plantilla_dias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dias_select" ON plantilla_dias FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plantillas_rutina p
      WHERE p.id = plantilla_id
        AND (
          p.creado_por = auth.uid()
          OR EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
        )
    )
  );

CREATE POLICY "dias_insert" ON plantilla_dias FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM plantillas_rutina p
      WHERE p.id = plantilla_id
        AND (
          p.creado_por = auth.uid()
          OR EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
        )
    )
  );

CREATE POLICY "dias_update" ON plantilla_dias FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plantillas_rutina p
      WHERE p.id = plantilla_id
        AND (
          p.creado_por = auth.uid()
          OR EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM plantillas_rutina p
      WHERE p.id = plantilla_id
        AND (
          p.creado_por = auth.uid()
          OR EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
        )
    )
  );

CREATE POLICY "dias_delete" ON plantilla_dias FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plantillas_rutina p
      WHERE p.id = plantilla_id
        AND (
          p.creado_por = auth.uid()
          OR EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
        )
    )
  );

-- ─── plantilla_ejercicios ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plantilla_ejercicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_id uuid NOT NULL REFERENCES plantilla_dias(id) ON DELETE CASCADE,
  ejercicio_id uuid NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  orden integer NOT NULL DEFAULT 0,
  series integer,
  repeticiones text,
  descanso_segundos integer,
  tipo text NOT NULL DEFAULT 'serie' CHECK (tipo IN ('serie','superserie','dropset','triserie','circuito')),
  grupo_serie text,
  notas text,
  ejercicio_alternativo_id uuid REFERENCES ejercicios(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE plantilla_ejercicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pej_select" ON plantilla_ejercicios FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plantilla_dias d
      JOIN plantillas_rutina p ON p.id = d.plantilla_id
      WHERE d.id = dia_id
        AND (
          p.creado_por = auth.uid()
          OR EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
        )
    )
  );

CREATE POLICY "pej_insert" ON plantilla_ejercicios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM plantilla_dias d
      JOIN plantillas_rutina p ON p.id = d.plantilla_id
      WHERE d.id = dia_id
        AND (
          p.creado_por = auth.uid()
          OR EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
        )
    )
  );

CREATE POLICY "pej_update" ON plantilla_ejercicios FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plantilla_dias d
      JOIN plantillas_rutina p ON p.id = d.plantilla_id
      WHERE d.id = dia_id
        AND (
          p.creado_por = auth.uid()
          OR EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM plantilla_dias d
      JOIN plantillas_rutina p ON p.id = d.plantilla_id
      WHERE d.id = dia_id
        AND (
          p.creado_por = auth.uid()
          OR EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
        )
    )
  );

CREATE POLICY "pej_delete" ON plantilla_ejercicios FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plantilla_dias d
      JOIN plantillas_rutina p ON p.id = d.plantilla_id
      WHERE d.id = dia_id
        AND (
          p.creado_por = auth.uid()
          OR EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador')
        )
    )
  );

-- ─── registros_ejercicio ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registros_ejercicio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_ejercicio_id uuid NOT NULL REFERENCES plantilla_ejercicios(id) ON DELETE CASCADE,
  alumno_id uuid NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  peso_kg numeric,
  descanso_segundos integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE registros_ejercicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reg_select_own" ON registros_ejercicio FOR SELECT
  TO authenticated
  USING (alumno_id = auth.uid());

CREATE POLICY "reg_insert_own" ON registros_ejercicio FOR INSERT
  TO authenticated
  WITH CHECK (alumno_id = auth.uid());

CREATE POLICY "reg_update_own" ON registros_ejercicio FOR UPDATE
  TO authenticated
  USING (alumno_id = auth.uid())
  WITH CHECK (alumno_id = auth.uid());

CREATE POLICY "reg_delete_own" ON registros_ejercicio FOR DELETE
  TO authenticated
  USING (alumno_id = auth.uid());
