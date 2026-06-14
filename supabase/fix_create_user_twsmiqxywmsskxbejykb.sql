-- ================================================================
-- APLICAR EN: https://supabase.com/dashboard/project/twsmiqxywmsskxbejykb/sql/new
-- Pegar TODO y hacer clic en RUN
-- ================================================================

-- NOTA: en este proyecto, auth.identities.email es columna GENERADA automáticamente
-- desde identity_data->>'email'. No se puede ni debe escribir directamente.

-- 1. Crear/reemplazar create_user
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
  v_hash          text;
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

  -- Verificar si el correo ya existe
  SELECT u.id INTO v_existing_uid FROM auth.users u WHERE lower(u.email) = v_email LIMIT 1;
  IF v_existing_uid IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM perfiles WHERE id = v_existing_uid) THEN
      INSERT INTO perfiles (id, nombre, apellido, edad, estatura, sexo, rol, foto_url, entrenador_id)
      VALUES (v_existing_uid, v_nombre, v_apellido, edad, estatura, v_sexo, v_rol, foto_url, v_entrenador_id);
      RETURN jsonb_build_object('success', true, 'user_id', v_existing_uid);
    END IF;
    RETURN jsonb_build_object('error', 'Ya existe un usuario con ese correo electronico');
  END IF;

  -- Generar hash bcrypt
  v_hash := extensions.crypt(password, extensions.gen_salt('bf', 10));

  -- Insertar en auth.users
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    is_super_admin, is_sso_user, deleted_at
  ) VALUES (
    v_new_uid, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', v_email, v_hash,
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), NULL, NULL, false, false, null
  );

  -- Insertar identidad de email
  -- IMPORTANTE: NO incluir la columna "email" ya que es generada automáticamente
  -- desde identity_data->>'email'
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at, provider_id
  ) VALUES (
    gen_random_uuid(), v_new_uid,
    jsonb_build_object('sub', v_new_uid::text, 'email', v_email),
    'email', now(), now(), now(), v_email
  );

  -- Crear perfil
  INSERT INTO perfiles (id, nombre, apellido, edad, estatura, sexo, rol, foto_url, entrenador_id)
  VALUES (v_new_uid, v_nombre, v_apellido, edad, estatura, v_sexo, v_rol, foto_url, v_entrenador_id);

  RETURN jsonb_build_object('success', true, 'user_id', v_new_uid);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user TO authenticated;

-- 2. Trigger para borrar auth.users cuando se borra un perfil
CREATE OR REPLACE FUNCTION public.delete_auth_user_on_profile_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_deleted ON perfiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION public.delete_auth_user_on_profile_delete();

-- 3. Corregir provider_id = UUID -> email en usuarios existentes
UPDATE auth.identities i
SET provider_id = u.email
FROM auth.users u
WHERE i.user_id = u.id
  AND i.provider = 'email'
  AND i.provider_id != u.email;

-- 4. Corregir identity_data para usuarios existentes que tengan sub=UUID pero email correcto
--    (Esto regenera la columna generada "email" automáticamente)
UPDATE auth.identities i
SET identity_data = jsonb_build_object('sub', i.user_id::text, 'email', u.email)
FROM auth.users u
WHERE i.user_id = u.id
  AND i.provider = 'email'
  AND (i.identity_data->>'email' IS NULL OR i.identity_data->>'email' != u.email);

-- 5. Corregir tokens vacíos -> NULL (string vacío puede bloquear el login)
UPDATE auth.users SET confirmation_token    = NULL WHERE confirmation_token    = '';
UPDATE auth.users SET recovery_token        = NULL WHERE recovery_token        = '';
UPDATE auth.users SET email_change_token_new = NULL WHERE email_change_token_new = '';
UPDATE auth.users SET reauthentication_token = NULL WHERE reauthentication_token = '';

-- 6. Estado final para verificar
SELECT
  u.email,
  LEFT(u.encrypted_password, 7)      AS hash_tipo,
  u.email_confirmed_at IS NOT NULL   AS email_confirmado,
  u.confirmation_token IS NULL       AS token_null,
  i.provider_id = u.email            AS provider_id_ok,
  i.identity_data->>'email' = u.email AS identity_email_ok,
  i.provider_id
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id AND i.provider = 'email'
ORDER BY u.created_at;

-- 7. Recargar schema cache
NOTIFY pgrst, 'reload schema';
