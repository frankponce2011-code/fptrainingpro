
-- fitness_content table
CREATE TABLE IF NOT EXISTS fitness_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text,
  imagen_url text,
  archivo_url text,
  creado_por uuid REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fitness_content ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "read_fitness_content" ON fitness_content FOR SELECT
  TO authenticated USING (true);

-- Only entrenador_administrador can insert
CREATE POLICY "admin_insert_fitness_content" ON fitness_content FOR INSERT
  TO authenticated WITH CHECK (
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'entrenador_administrador'
  );

CREATE POLICY "admin_update_fitness_content" ON fitness_content FOR UPDATE
  TO authenticated USING (
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'entrenador_administrador'
  ) WITH CHECK (
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'entrenador_administrador'
  );

CREATE POLICY "admin_delete_fitness_content" ON fitness_content FOR DELETE
  TO authenticated USING (
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'entrenador_administrador'
  );
