-- 1. Rename admin role to 'entrenador_administrador'
UPDATE perfiles SET rol = 'entrenador_administrador' WHERE rol = 'administrador';

-- 2. Add 'activa' column to rutinas_alumno
ALTER TABLE rutinas_alumno ADD COLUMN IF NOT EXISTS activa boolean NOT NULL DEFAULT true;

-- 3. Add new fields to ejercicios
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS como_ejecutar text;
ALTER TABLE ejercicios ADD COLUMN IF NOT EXISTS tipo_ejercicio text;

-- 4. Create registro_ingresos table
CREATE TABLE IF NOT EXISTS registro_ingresos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     uuid REFERENCES perfiles(id) ON DELETE SET NULL,
  nombre_completo text,
  correo         text,
  rol            text,
  fecha_ingreso  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE registro_ingresos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_registro_ingresos" ON registro_ingresos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "select_registro_ingresos" ON registro_ingresos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol = 'entrenador_administrador'
    )
  );

CREATE POLICY "delete_registro_ingresos" ON registro_ingresos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
        AND p.rol = 'entrenador_administrador'
    )
  );
