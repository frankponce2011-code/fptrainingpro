/*
  # FPTrainingPro - Core Tables

  ## Summary
  Creates the main application tables for FPTrainingPro fitness training management system.

  ## New Tables

  ### perfiles
  - Stores user profile data for all app users (alumnos, entrenadores, administradores)
  - `id` - UUID, primary key, references auth.users
  - `nombre` - First name
  - `apellido` - Last name
  - `edad` - Age in years
  - `estatura` - Height in cm
  - `sexo` - Gender (Masculino / Femenino)
  - `foto_url` - URL to profile photo in Supabase Storage
  - `rol` - User role: 'alumno', 'entrenador', 'administrador' (default: 'alumno')
  - `created_at` - Row creation timestamp

  ### evaluaciones
  - Physical assessment records linked to a student profile
  - `id` - UUID primary key
  - `alumno_id` - FK to perfiles
  - `fecha` - Assessment date
  - `peso` - Weight in kg
  - `altura` - Height in cm
  - `imc` - BMI
  - `grasa_corporal` - Body fat percentage
  - `masa_muscular` - Muscle mass in kg
  - `notas` - Trainer notes
  - `cargado_por` - FK to perfiles of the person who uploaded
  - `created_at` - Row creation timestamp

  ### dietas
  - Diet files assigned to students
  - `id` - UUID primary key
  - `alumno_id` - FK to perfiles
  - `nombre` - Diet plan name
  - `archivo_url` - URL to Word file in Supabase Storage
  - `created_at` - Row creation timestamp

  ### rutinas
  - Training routines assigned to students
  - `id` - UUID primary key
  - `alumno_id` - FK to perfiles
  - `nombre` - Routine name
  - `descripcion` - Routine description
  - `created_at` - Row creation timestamp

  ## Security
  - RLS enabled on all tables
  - Students can only read/update their own profile
  - Students can only read their own evaluaciones, dietas, rutinas
  - Admins have full read/write access to all tables
  - Entrenadores can read all profiles and insert/read evaluaciones
*/

-- PERFILES TABLE
CREATE TABLE IF NOT EXISTS perfiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  apellido text NOT NULL DEFAULT '',
  edad integer,
  estatura numeric,
  sexo text DEFAULT '',
  foto_url text DEFAULT '',
  rol text NOT NULL DEFAULT 'alumno',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON perfiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol IN ('administrador', 'entrenador')
    )
  );

CREATE POLICY "Users can insert own profile"
  ON perfiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON perfiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol IN ('administrador')
    )
  )
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol IN ('administrador')
    )
  );

CREATE POLICY "Admin can delete profiles"
  ON perfiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  );

-- EVALUACIONES TABLE
CREATE TABLE IF NOT EXISTS evaluaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id uuid REFERENCES perfiles(id) ON DELETE CASCADE,
  fecha date,
  peso numeric,
  altura numeric,
  imc numeric,
  grasa_corporal numeric,
  masa_muscular numeric,
  notas text DEFAULT '',
  cargado_por uuid REFERENCES perfiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own evaluaciones"
  ON evaluaciones FOR SELECT
  TO authenticated
  USING (
    alumno_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol IN ('administrador', 'entrenador')
    )
  );

CREATE POLICY "Admin and entrenador can insert evaluaciones"
  ON evaluaciones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol IN ('administrador', 'entrenador')
    )
  );

CREATE POLICY "Admin and entrenador can update evaluaciones"
  ON evaluaciones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol IN ('administrador', 'entrenador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol IN ('administrador', 'entrenador')
    )
  );

CREATE POLICY "Admin can delete evaluaciones"
  ON evaluaciones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  );

-- DIETAS TABLE
CREATE TABLE IF NOT EXISTS dietas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id uuid REFERENCES perfiles(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  archivo_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dietas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own dietas"
  ON dietas FOR SELECT
  TO authenticated
  USING (
    alumno_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol IN ('administrador', 'entrenador')
    )
  );

CREATE POLICY "Admin can insert dietas"
  ON dietas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  );

CREATE POLICY "Admin can update dietas"
  ON dietas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  );

CREATE POLICY "Admin can delete dietas"
  ON dietas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  );

-- RUTINAS TABLE
CREATE TABLE IF NOT EXISTS rutinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id uuid REFERENCES perfiles(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  descripcion text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rutinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own rutinas"
  ON rutinas FOR SELECT
  TO authenticated
  USING (
    alumno_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol IN ('administrador', 'entrenador')
    )
  );

CREATE POLICY "Admin can insert rutinas"
  ON rutinas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  );

CREATE POLICY "Admin can update rutinas"
  ON rutinas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  );

CREATE POLICY "Admin can delete rutinas"
  ON rutinas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  );
