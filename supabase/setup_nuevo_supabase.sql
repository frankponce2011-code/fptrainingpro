-- ============================================================
-- FPTrainingPro — Setup completo de base de datos
-- Pegar TODO en: https://supabase.com/dashboard/project/twsmiqxywmsskxbejykb/sql/new
-- y hacer clic en "Run"
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. FUNCIONES DE ROL (deben ir primero)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT rol FROM perfiles WHERE id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles WHERE id = auth.uid()
      AND rol IN ('administrador', 'entrenador_administrador')
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_trainer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles WHERE id = auth.uid()
      AND rol IN ('entrenador', 'entrenador_administrador')
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_trainer() FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. TABLA: perfiles
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS perfiles (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre        text        NOT NULL DEFAULT '',
  apellido      text        NOT NULL DEFAULT '',
  edad          integer,
  estatura      numeric,
  sexo          text        DEFAULT '',
  foto_url      text        DEFAULT '',
  rol           text        NOT NULL DEFAULT 'alumno',
  entrenador_id uuid        REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perfiles_entrenador_id ON perfiles(entrenador_id);
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_all"               ON perfiles;
DROP POLICY IF EXISTS "admin_insert_all"               ON perfiles;
DROP POLICY IF EXISTS "admin_update_all"               ON perfiles;
DROP POLICY IF EXISTS "admin_delete_all"               ON perfiles;
DROP POLICY IF EXISTS "trainer_select_own_and_alumnos" ON perfiles;
DROP POLICY IF EXISTS "trainer_insert_alumnos"         ON perfiles;
DROP POLICY IF EXISTS "trainer_update_own_and_alumnos" ON perfiles;
DROP POLICY IF EXISTS "trainer_delete_alumnos"         ON perfiles;
DROP POLICY IF EXISTS "alumno_select_own"              ON perfiles;
DROP POLICY IF EXISTS "alumno_update_own"              ON perfiles;

CREATE POLICY "admin_select_all" ON perfiles FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "admin_insert_all" ON perfiles FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_all" ON perfiles FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_all" ON perfiles FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "trainer_select_own_and_alumnos" ON perfiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR entrenador_id = auth.uid());
CREATE POLICY "trainer_insert_alumnos" ON perfiles FOR INSERT TO authenticated
  WITH CHECK (is_trainer() AND entrenador_id = auth.uid() AND rol = 'alumno');
CREATE POLICY "trainer_update_own_and_alumnos" ON perfiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR (is_trainer() AND entrenador_id = auth.uid()))
  WITH CHECK (id = auth.uid() OR (is_trainer() AND entrenador_id = auth.uid()));
CREATE POLICY "trainer_delete_alumnos" ON perfiles FOR DELETE TO authenticated
  USING (is_trainer() AND entrenador_id = auth.uid() AND rol = 'alumno');

CREATE POLICY "alumno_select_own" ON perfiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "alumno_update_own" ON perfiles FOR UPDATE TO authenticated
  USING (id = auth.uid() AND NOT is_admin() AND NOT is_trainer())
  WITH CHECK (id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 3. TABLA: ejercicios
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ejercicios (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre               text        NOT NULL,
  grupo_muscular       text        NOT NULL,
  descripcion          text        NOT NULL DEFAULT '',
  como_ejecutar        text,
  tipo_ejercicio       text,
  musculos_secundarios text,
  consejos             text,
  imagen_url           text,
  youtube_url          text,
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE ejercicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ejercicios_select" ON ejercicios;
DROP POLICY IF EXISTS "ejercicios_insert" ON ejercicios;
DROP POLICY IF EXISTS "ejercicios_update" ON ejercicios;
DROP POLICY IF EXISTS "ejercicios_delete" ON ejercicios;

CREATE POLICY "ejercicios_select" ON ejercicios FOR SELECT TO authenticated USING (true);
CREATE POLICY "ejercicios_insert" ON ejercicios FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_trainer());
CREATE POLICY "ejercicios_update" ON ejercicios FOR UPDATE TO authenticated
  USING (is_admin() OR is_trainer()) WITH CHECK (is_admin() OR is_trainer());
CREATE POLICY "ejercicios_delete" ON ejercicios FOR DELETE TO authenticated
  USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 4. TABLA: evaluaciones
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evaluaciones (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id                uuid        REFERENCES perfiles(id) ON DELETE CASCADE,
  fecha                    date,
  peso                     numeric,
  notas                    text        DEFAULT '',
  cargado_por              uuid        REFERENCES perfiles(id),
  grasa_corporal           numeric,
  hombros                  numeric,
  pecho                    numeric,
  intercostal              numeric,
  cintura                  numeric,
  cadera_alta              numeric,
  gluteos                  numeric,
  muslo_derecho            numeric,
  muslo_izquierdo          numeric,
  pantorrilla_derecha      numeric,
  pantorrilla_izquierda    numeric,
  biceps_derecho_relajado  numeric,
  biceps_derecho_contraido numeric,
  biceps_izquierdo         numeric,
  pliegue_triceps          numeric,
  pliegue_subescapular     numeric,
  pliegue_cresta_iliaca    numeric,
  pliegue_supraespinal     numeric,
  pliegue_abdominal        numeric,
  pliegue_muslo            numeric,
  pliegue_pantorrilla      numeric,
  porcentaje_grasa         numeric,
  foto_url                 text,
  created_at               timestamptz DEFAULT now()
);

ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eval_select" ON evaluaciones;
DROP POLICY IF EXISTS "eval_insert" ON evaluaciones;
DROP POLICY IF EXISTS "eval_update" ON evaluaciones;
DROP POLICY IF EXISTS "eval_delete" ON evaluaciones;

CREATE POLICY "eval_select" ON evaluaciones FOR SELECT TO authenticated
  USING (
    alumno_id = auth.uid() OR is_admin()
    OR (is_trainer() AND EXISTS (
      SELECT 1 FROM perfiles p WHERE p.id = evaluaciones.alumno_id AND p.entrenador_id = auth.uid()
    ))
  );
CREATE POLICY "eval_insert" ON evaluaciones FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR (is_trainer() AND EXISTS (
      SELECT 1 FROM perfiles p WHERE p.id = alumno_id AND p.entrenador_id = auth.uid()
    ))
  );
CREATE POLICY "eval_update" ON evaluaciones FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR (is_trainer() AND EXISTS (
      SELECT 1 FROM perfiles p WHERE p.id = evaluaciones.alumno_id AND p.entrenador_id = auth.uid()
    ))
  )
  WITH CHECK (
    is_admin()
    OR (is_trainer() AND EXISTS (
      SELECT 1 FROM perfiles p WHERE p.id = alumno_id AND p.entrenador_id = auth.uid()
    ))
  );
CREATE POLICY "eval_delete" ON evaluaciones FOR DELETE TO authenticated USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 5. TABLA: dietas
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dietas (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id   uuid        REFERENCES perfiles(id) ON DELETE CASCADE,
  nombre      text,
  descripcion text,
  archivo_url text        DEFAULT '',
  fecha_fin   date,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE dietas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dietas_select" ON dietas;
DROP POLICY IF EXISTS "dietas_insert" ON dietas;
DROP POLICY IF EXISTS "dietas_update" ON dietas;
DROP POLICY IF EXISTS "dietas_delete" ON dietas;

CREATE POLICY "dietas_select" ON dietas FOR SELECT TO authenticated USING (
  alumno_id = auth.uid() OR is_admin()
  OR (is_trainer() AND EXISTS (
    SELECT 1 FROM perfiles p WHERE p.id = dietas.alumno_id AND p.entrenador_id = auth.uid()
  ))
);
CREATE POLICY "dietas_insert" ON dietas FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR (is_trainer() AND EXISTS (
      SELECT 1 FROM perfiles p WHERE p.id = alumno_id AND p.entrenador_id = auth.uid()
    ))
  );
CREATE POLICY "dietas_update" ON dietas FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR (is_trainer() AND EXISTS (
      SELECT 1 FROM perfiles p WHERE p.id = dietas.alumno_id AND p.entrenador_id = auth.uid()
    ))
  )
  WITH CHECK (
    is_admin()
    OR (is_trainer() AND EXISTS (
      SELECT 1 FROM perfiles p WHERE p.id = alumno_id AND p.entrenador_id = auth.uid()
    ))
  );
CREATE POLICY "dietas_delete" ON dietas FOR DELETE TO authenticated
  USING (
    is_admin()
    OR (is_trainer() AND EXISTS (
      SELECT 1 FROM perfiles p WHERE p.id = dietas.alumno_id AND p.entrenador_id = auth.uid()
    ))
  );

-- ─────────────────────────────────────────────────────────────
-- 6. TABLA: plantillas_rutina
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plantillas_rutina (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text        NOT NULL,
  descripcion text,
  creado_por  uuid        REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE plantillas_rutina ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plantillas_select" ON plantillas_rutina;
DROP POLICY IF EXISTS "plantillas_insert" ON plantillas_rutina;
DROP POLICY IF EXISTS "plantillas_update" ON plantillas_rutina;
DROP POLICY IF EXISTS "plantillas_delete" ON plantillas_rutina;

CREATE POLICY "plantillas_select" ON plantillas_rutina FOR SELECT TO authenticated
  USING (is_admin() OR creado_por = auth.uid());
CREATE POLICY "plantillas_insert" ON plantillas_rutina FOR INSERT TO authenticated
  WITH CHECK ((is_admin() OR is_trainer()) AND creado_por = auth.uid());
CREATE POLICY "plantillas_update" ON plantillas_rutina FOR UPDATE TO authenticated
  USING (is_admin() OR creado_por = auth.uid())
  WITH CHECK (is_admin() OR creado_por = auth.uid());
CREATE POLICY "plantillas_delete" ON plantillas_rutina FOR DELETE TO authenticated
  USING (is_admin() OR creado_por = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 7. TABLA: plantilla_dias
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plantilla_dias (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_id uuid        NOT NULL REFERENCES plantillas_rutina(id) ON DELETE CASCADE,
  numero_dia   integer     NOT NULL CHECK (numero_dia BETWEEN 1 AND 7),
  nombre_dia   text        NOT NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE plantilla_dias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dias_select" ON plantilla_dias;
DROP POLICY IF EXISTS "dias_insert" ON plantilla_dias;
DROP POLICY IF EXISTS "dias_update" ON plantilla_dias;
DROP POLICY IF EXISTS "dias_delete" ON plantilla_dias;

CREATE POLICY "dias_select" ON plantilla_dias FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plantillas_rutina p WHERE p.id = plantilla_id
      AND (p.creado_por = auth.uid() OR is_admin())
  ));
CREATE POLICY "dias_insert" ON plantilla_dias FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM plantillas_rutina p WHERE p.id = plantilla_id
      AND (p.creado_por = auth.uid() OR is_admin())
  ));
CREATE POLICY "dias_update" ON plantilla_dias FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plantillas_rutina p WHERE p.id = plantilla_id
      AND (p.creado_por = auth.uid() OR is_admin())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM plantillas_rutina p WHERE p.id = plantilla_id
      AND (p.creado_por = auth.uid() OR is_admin())
  ));
CREATE POLICY "dias_delete" ON plantilla_dias FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plantillas_rutina p WHERE p.id = plantilla_id
      AND (p.creado_por = auth.uid() OR is_admin())
  ));

-- ─────────────────────────────────────────────────────────────
-- 8. TABLA: plantilla_ejercicios
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plantilla_ejercicios (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_id                   uuid        NOT NULL REFERENCES plantilla_dias(id) ON DELETE CASCADE,
  ejercicio_id             uuid        NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  orden                    integer     NOT NULL DEFAULT 0,
  series                   integer,
  repeticiones             text,
  descanso_segundos        integer,
  tipo                     text        NOT NULL DEFAULT 'serie'
                           CHECK (tipo IN ('serie','superserie','dropset','triserie','circuito')),
  grupo_serie              text,
  notas                    text,
  ejercicio_alternativo_id uuid        REFERENCES ejercicios(id) ON DELETE SET NULL,
  created_at               timestamptz DEFAULT now()
);

ALTER TABLE plantilla_ejercicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pej_select" ON plantilla_ejercicios;
DROP POLICY IF EXISTS "pej_insert" ON plantilla_ejercicios;
DROP POLICY IF EXISTS "pej_update" ON plantilla_ejercicios;
DROP POLICY IF EXISTS "pej_delete" ON plantilla_ejercicios;

CREATE POLICY "pej_select" ON plantilla_ejercicios FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plantilla_dias d
    JOIN plantillas_rutina p ON p.id = d.plantilla_id
    WHERE d.id = dia_id AND (p.creado_por = auth.uid() OR is_admin())
  ));
CREATE POLICY "pej_insert" ON plantilla_ejercicios FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM plantilla_dias d
    JOIN plantillas_rutina p ON p.id = d.plantilla_id
    WHERE d.id = dia_id AND (p.creado_por = auth.uid() OR is_admin())
  ));
CREATE POLICY "pej_update" ON plantilla_ejercicios FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plantilla_dias d
    JOIN plantillas_rutina p ON p.id = d.plantilla_id
    WHERE d.id = dia_id AND (p.creado_por = auth.uid() OR is_admin())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM plantilla_dias d
    JOIN plantillas_rutina p ON p.id = d.plantilla_id
    WHERE d.id = dia_id AND (p.creado_por = auth.uid() OR is_admin())
  ));
CREATE POLICY "pej_delete" ON plantilla_ejercicios FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM plantilla_dias d
    JOIN plantillas_rutina p ON p.id = d.plantilla_id
    WHERE d.id = dia_id AND (p.creado_por = auth.uid() OR is_admin())
  ));

-- ─────────────────────────────────────────────────────────────
-- 9. TABLA: rutinas_alumno
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rutinas_alumno (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id    uuid        NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  plantilla_id uuid        REFERENCES plantillas_rutina(id) ON DELETE SET NULL,
  nombre       text        NOT NULL,
  descripcion  text,
  asignado_por uuid        REFERENCES perfiles(id) ON DELETE SET NULL,
  activa       boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rutinas_alumno ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_rutinas_alumno" ON rutinas_alumno;
DROP POLICY IF EXISTS "insert_rutinas_alumno" ON rutinas_alumno;
DROP POLICY IF EXISTS "update_rutinas_alumno" ON rutinas_alumno;
DROP POLICY IF EXISTS "delete_rutinas_alumno" ON rutinas_alumno;

CREATE POLICY "select_rutinas_alumno" ON rutinas_alumno FOR SELECT TO authenticated
  USING (alumno_id = auth.uid() OR is_admin() OR is_trainer());
CREATE POLICY "insert_rutinas_alumno" ON rutinas_alumno FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_trainer());
CREATE POLICY "update_rutinas_alumno" ON rutinas_alumno FOR UPDATE TO authenticated
  USING (is_admin() OR is_trainer()) WITH CHECK (is_admin() OR is_trainer());
CREATE POLICY "delete_rutinas_alumno" ON rutinas_alumno FOR DELETE TO authenticated
  USING (is_admin() OR is_trainer());

-- ─────────────────────────────────────────────────────────────
-- 10. TABLA: rutina_alumno_dias
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rutina_alumno_dias (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rutina_id  uuid        NOT NULL REFERENCES rutinas_alumno(id) ON DELETE CASCADE,
  numero_dia integer     NOT NULL,
  nombre_dia text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rutina_alumno_dias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_rutina_alumno_dias" ON rutina_alumno_dias;
DROP POLICY IF EXISTS "insert_rutina_alumno_dias" ON rutina_alumno_dias;
DROP POLICY IF EXISTS "update_rutina_alumno_dias" ON rutina_alumno_dias;
DROP POLICY IF EXISTS "delete_rutina_alumno_dias" ON rutina_alumno_dias;

CREATE POLICY "select_rutina_alumno_dias" ON rutina_alumno_dias FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM rutinas_alumno ra WHERE ra.id = rutina_id
      AND (ra.alumno_id = auth.uid() OR is_admin() OR is_trainer())
  ));
CREATE POLICY "insert_rutina_alumno_dias" ON rutina_alumno_dias FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_trainer());
CREATE POLICY "update_rutina_alumno_dias" ON rutina_alumno_dias FOR UPDATE TO authenticated
  USING (is_admin() OR is_trainer()) WITH CHECK (is_admin() OR is_trainer());
CREATE POLICY "delete_rutina_alumno_dias" ON rutina_alumno_dias FOR DELETE TO authenticated
  USING (is_admin() OR is_trainer());

-- ─────────────────────────────────────────────────────────────
-- 11. TABLA: rutina_alumno_ejercicios
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rutina_alumno_ejercicios (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_id                uuid        NOT NULL REFERENCES rutina_alumno_dias(id) ON DELETE CASCADE,
  ejercicio_id          uuid        NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
  orden                 integer     NOT NULL DEFAULT 0,
  series                integer,
  repeticiones          text,
  descanso_segundos     integer,
  tipo                  text        NOT NULL DEFAULT 'serie',
  grupo_serie           text,
  notas                 text,
  ejercicio_alternativo uuid        REFERENCES ejercicios(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rutina_alumno_ejercicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios;
DROP POLICY IF EXISTS "insert_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios;
DROP POLICY IF EXISTS "update_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios;
DROP POLICY IF EXISTS "delete_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios;

CREATE POLICY "select_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM rutina_alumno_dias rad
    JOIN rutinas_alumno ra ON ra.id = rad.rutina_id
    WHERE rad.id = dia_id
      AND (ra.alumno_id = auth.uid() OR is_admin() OR is_trainer())
  ));
CREATE POLICY "insert_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_trainer());
CREATE POLICY "update_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios FOR UPDATE TO authenticated
  USING (is_admin() OR is_trainer()) WITH CHECK (is_admin() OR is_trainer());
CREATE POLICY "delete_rutina_alumno_ejercicios" ON rutina_alumno_ejercicios FOR DELETE TO authenticated
  USING (is_admin() OR is_trainer());

-- ─────────────────────────────────────────────────────────────
-- 12. TABLA: registro_ingresos
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS registro_ingresos (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      uuid        REFERENCES perfiles(id) ON DELETE SET NULL,
  nombre_completo text,
  correo          text,
  rol             text,
  fecha_ingreso   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE registro_ingresos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_registro_ingresos" ON registro_ingresos;
DROP POLICY IF EXISTS "select_registro_ingresos" ON registro_ingresos;
DROP POLICY IF EXISTS "delete_registro_ingresos" ON registro_ingresos;

CREATE POLICY "insert_registro_ingresos" ON registro_ingresos FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "select_registro_ingresos" ON registro_ingresos FOR SELECT TO authenticated
  USING (is_admin());
CREATE POLICY "delete_registro_ingresos" ON registro_ingresos FOR DELETE TO authenticated
  USING (is_admin());

-- ─────────────────────────────────────────────────────────────
-- 13. STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars',      'avatars',      true),
  ('evaluaciones', 'evaluaciones', true),
  ('dietas',       'dietas',       true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "avatars_select"              ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert"              ON storage.objects;
DROP POLICY IF EXISTS "avatars_update"              ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete"              ON storage.objects;
DROP POLICY IF EXISTS "evaluaciones_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "evaluaciones_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "evaluaciones_storage_delete" ON storage.objects;
DROP POLICY IF EXISTS "dietas_storage_select"       ON storage.objects;
DROP POLICY IF EXISTS "dietas_storage_insert"       ON storage.objects;
DROP POLICY IF EXISTS "dietas_storage_update"       ON storage.objects;
DROP POLICY IF EXISTS "dietas_storage_delete"       ON storage.objects;

CREATE POLICY "avatars_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "evaluaciones_storage_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evaluaciones');
CREATE POLICY "evaluaciones_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evaluaciones' AND is_trainer());
CREATE POLICY "evaluaciones_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'evaluaciones' AND is_trainer());

CREATE POLICY "dietas_storage_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dietas');
CREATE POLICY "dietas_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dietas' AND is_trainer());
CREATE POLICY "dietas_storage_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'dietas' AND is_trainer());
CREATE POLICY "dietas_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('dietas', 'dietas-files') AND is_trainer());

-- ─────────────────────────────────────────────────────────────
-- 14. FUNCIÓN: create_user (crea alumnos/entrenadores desde la app)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_user(
  email       text,
  password    text,
  nombre      text,
  apellido    text,
  rol         text    DEFAULT 'alumno',
  entrenador_id uuid  DEFAULT NULL,
  edad        integer DEFAULT NULL,
  estatura    numeric DEFAULT NULL,
  sexo        text    DEFAULT 'masculino',
  foto_url    text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id     uuid := auth.uid();
  v_caller_rol    text;
  v_new_uid       uuid := gen_random_uuid();
  v_existing_uid  uuid;
  v_email         text := lower(trim(email));
  v_nombre        text := trim(nombre);
  v_apellido      text := trim(apellido);
  v_rol           text := COALESCE(rol, 'alumno');
  v_sexo          text := COALESCE(sexo, 'masculino');
  v_entrenador_id uuid := entrenador_id;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No autenticado');
  END IF;

  SELECT p.rol INTO v_caller_rol FROM perfiles p WHERE p.id = v_caller_id;

  IF v_caller_rol NOT IN ('entrenador', 'entrenador_administrador') THEN
    RETURN jsonb_build_object('error', 'Sin permisos para crear usuarios');
  END IF;

  IF v_caller_rol = 'entrenador' THEN
    v_entrenador_id := v_caller_id;
  END IF;

  SELECT u.id INTO v_existing_uid FROM auth.users u WHERE lower(u.email) = v_email LIMIT 1;
  IF v_existing_uid IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM perfiles WHERE id = v_existing_uid) THEN
      INSERT INTO perfiles (id, nombre, apellido, edad, estatura, sexo, rol, foto_url, entrenador_id)
      VALUES (v_existing_uid, v_nombre, v_apellido, edad, estatura, v_sexo, v_rol, foto_url, v_entrenador_id);
      RETURN jsonb_build_object('success', true, 'user_id', v_existing_uid);
    END IF;
    RETURN jsonb_build_object('error', 'Ya existe un usuario con ese correo electronico');
  END IF;

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    is_super_admin, is_sso_user, deleted_at
  ) VALUES (
    v_new_uid, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', v_email,
    extensions.crypt(password, extensions.gen_salt('bf', 10)),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), NULL, NULL,
    false, false, null
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at, provider_id
  ) VALUES (
    gen_random_uuid(), v_new_uid,
    jsonb_build_object('sub', v_new_uid::text, 'email', v_email),
    'email', now(), now(), now(), v_email
  );

  INSERT INTO perfiles (id, nombre, apellido, edad, estatura, sexo, rol, foto_url, entrenador_id)
  VALUES (v_new_uid, v_nombre, v_apellido, edad, estatura, v_sexo, v_rol, foto_url, v_entrenador_id);

  RETURN jsonb_build_object('success', true, 'user_id', v_new_uid);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 15. FUNCIÓN: delete_user (elimina alumno y su auth)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.delete_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_deleted ON perfiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION public.delete_auth_user();

-- ─────────────────────────────────────────────────────────────
-- 16. USUARIO ADMINISTRADOR
--     frankponce2011@gmail.com / t53q28
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'frankponce2011@gmail.com';
  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      is_super_admin, is_sso_user, deleted_at
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', 'frankponce2011@gmail.com',
      extensions.crypt('t53q28', extensions.gen_salt('bf', 10)),
      now(), '{"provider":"email","providers":["email"]}', '{}',
      now(), now(), NULL, NULL, false, false, null
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at, provider_id
    ) VALUES (
      gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', 'frankponce2011@gmail.com'),
      'email', now(), now(), now(), 'frankponce2011@gmail.com'
    );
  ELSE
    -- Corregir provider_id si fue creado con UUID en vez de email
    UPDATE auth.identities
    SET provider_id = 'frankponce2011@gmail.com',
        confirmation_token = NULL,
        recovery_token     = NULL
    WHERE user_id = v_uid AND provider = 'email';
    UPDATE auth.users
    SET confirmation_token = NULL,
        recovery_token     = NULL,
        is_super_admin     = false
    WHERE id = v_uid;
  END IF;
  INSERT INTO perfiles (id, nombre, apellido, rol)
  VALUES (v_uid, 'Frank', 'Ponce', 'entrenador_administrador')
  ON CONFLICT (id) DO UPDATE SET rol = 'entrenador_administrador';
END $$;

-- ─────────────────────────────────────────────────────────────
-- 17. EJERCICIOS PRECARGADOS
-- ─────────────────────────────────────────────────────────────

INSERT INTO ejercicios (nombre, grupo_muscular, descripcion, musculos_secundarios, consejos, imagen_url) VALUES
('Press de banca con barra',      'Pecho',    'Acuéstate en banco horizontal. Empuja la barra desde el pecho hasta extender los brazos.',            'Tríceps, Hombros',        'Pies apoyados. No bounces la barra.',          'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Press inclinado con mancuernas','Pecho',    'Banco a 45°. Empuja las mancuernas desde el pecho hacia arriba y adelante.',                           'Pecho superior, Hombros', 'Control en ambas fases.',                      'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Aperturas con mancuernas',      'Pecho',    'Brazos extendidos. Abre en arco controlado. Siente el estiramiento.',                                  'Hombros',                 'Ligero ángulo en los codos.',                  'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Fondos en paralelas',           'Pecho',    'Suspendido entre barras con torso inclinado. Baja y empuja hasta extender.',                           'Pecho inferior, Tríceps', 'Core contraído. Sin rebotes.',                 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Dominadas',                     'Espalda',  'Tira el cuerpo hacia arriba hasta que la barbilla supere la barra.',                                   'Bíceps',                  'Sin impulso con las piernas.',                 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Remo con barra',                'Espalda',  'Torso inclinado, tira la barra hacia el abdomen.',                                                     'Bíceps',                  'Espalda recta. Sin impulso.',                  'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Remo con mancuerna',            'Espalda',  'Apoya rodilla en banco. Tira la mancuerna hacia la cadera. Alterna lados.',                            'Dorsal',                  'Sin rotaciones. Rango completo.',              'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Jalón al pecho',                'Espalda',  'Máquina de jalón. Tira la barra ancha hacia el pecho llevando codos abajo.',                           'Bíceps',                  'Sin impulso. Torso recto.',                    'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Peso muerto',                   'Espalda',  'Levanta la barra desde el piso con espalda recta. Extiende completamente.',                            'Glúteos, Piernas',        'Barra cerca del cuerpo.',                      'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Sentadilla con barra',          'Piernas',  'Baja con la barra en los hombros hasta muslos paralelos al piso.',                                     'Glúteos',                 'Rodillas alineadas con pies. Pecho arriba.',   'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Prensa de piernas',             'Piernas',  'Pies en plataforma. Baja doblando rodillas. Empuja hasta extender.',                                   'Glúteos',                 'No bloquees rodillas. Rango completo.',        'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Curl de piernas',               'Piernas',  'Máquina tumbado. Curva rodillas llevando talones hacia glúteos.',                                      'Isquiotibiales',          'Movimiento controlado.',                       'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Peso muerto rumano',            'Piernas',  'Inclínate desde las caderas con espalda recta. Siente el estiramiento.',                               'Isquiotibiales, Glúteos', 'Espalda recta en todo el rango.',              'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Press militar con barra',       'Hombros',  'Barra a la altura de hombros. Empuja hacia arriba hasta extender.',                                    'Deltoides',               'Core contraído. Sin arquear la espalda.',      'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Elevaciones laterales',         'Hombros',  'Levanta mancuernas lateralmente hasta altura de hombros.',                                             'Deltoides lateral',       'Ligera flexión en codos. Movimiento lento.',   'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Elevaciones frontales',         'Hombros',  'Levanta mancuernas hacia adelante hasta la altura de los ojos.',                                       'Deltoides frontal',       'Sin impulso. Control total.',                  'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Pájaros inversos',              'Hombros',  'Inclinado hacia adelante. Abre los brazos lateralmente hasta hombros.',                                'Deltoides posterior',     'Movimiento lento. Sin impulso.',               'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Curl con barra',                'Bíceps',   'Curva los codos trayendo la barra hacia los hombros. Baja sin bloquear.',                              'Bíceps',                  'Sin balanceo. Movimiento lento.',              'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Curl con mancuernas',           'Bíceps',   'Curva cada brazo alternado o simultáneo hacia los hombros.',                                           'Bíceps',                  'Codos fijos. Sin impulso.',                    'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Curl martillo',                 'Bíceps',   'Agarre neutro. Curva hacia los hombros. Baja controladamente.',                                        'Bíceps, Braquial',        'Excelente para el braquial.',                  'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Extensión en polea',            'Tríceps',  'Frente a la polea. Extiende los brazos hacia abajo contra la resistencia.',                            'Tríceps',                 'Codos fijos al costado.',                      'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Press francés',                 'Tríceps',  'Tumbado boca arriba. Baja la barra hacia la frente doblando codos. Extiende.',                        'Tríceps',                 'Codos fijos. Movimiento controlado.',          'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Crunch abdominal',              'Abdomen',  'Tumbado con rodillas flexionadas. Levanta el torso usando abdominales.',                               'Abdomen',                 'Sin tirar del cuello. Movimiento corto.',      'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Plancha',                       'Abdomen',  'Apoyado en antebrazos y pies. Mantén el cuerpo recto con core contraído.',                             'Core completo',           'Sin caer las caderas.',                        'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Elevación de piernas',          'Abdomen',  'Tumbado boca arriba. Levanta las piernas extendidas. Baja sin tocar el piso.',                         'Abdomen inferior',        'Movimiento lento. Solo abdominales.',          'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Hip thrust',                    'Glúteos',  'Espalda en banco, pies en el suelo. Levanta caderas contrayendo glúteos.',                             'Glúteos',                 'Contrae completamente en la cima.',            'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Sentadilla sumo',               'Glúteos',  'Pies más abiertos que los hombros, puntas hacia afuera. Baja profundo.',                               'Glúteos, Aductores',      'Peso en los talones. Tronco vertical.',        'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Caminata en cinta',             'Cardio',   'Camina o corre en cinta a velocidad moderada. Mantén frecuencia cardíaca aeróbica.',                   'Cardio general',          'Hidratación constante.',                       'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('Salto de cuerda',               'Cardio',   'Salta la cuerda a ritmo constante. Excelente para resistencia y coordinación.',                        'Cardio, Coordinación',    'Aumenta la intensidad gradualmente.',          'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'),
('HIIT en bicicleta',             'Cardio',   'Alterna intervalos de máxima intensidad (30s) y recuperación (30s). 20-30 minutos.',                   'Cardio, Quema de grasa',  'Calentamiento previo. Recuperación activa.',   'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg')
ON CONFLICT DO NOTHING;
