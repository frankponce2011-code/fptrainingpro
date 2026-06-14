
-- Fix raw_user_meta_data for all users created via SQL (missing email_verified: true)
UPDATE auth.users
SET 
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{email_verified}',
    'true'::jsonb
  ),
  updated_at = now()
WHERE (raw_user_meta_data IS NULL OR NOT (raw_user_meta_data ? 'email_verified' AND (raw_user_meta_data->>'email_verified')::boolean = true))
  AND email_confirmed_at IS NOT NULL;

-- Update create_user function to always set email_verified: true
DROP FUNCTION IF EXISTS public.create_user(text,text,text,text,text,uuid,integer,numeric,text,text);

CREATE FUNCTION public.create_user(
  email        text,
  password     text,
  nombre       text,
  apellido     text,
  rol          text    DEFAULT 'alumno',
  entrenador_id uuid   DEFAULT NULL,
  edad         integer DEFAULT NULL,
  estatura     numeric DEFAULT NULL,
  sexo         text    DEFAULT 'masculino',
  foto_url     text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
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

  SELECT id INTO v_existing_uid FROM auth.users
  WHERE lower(auth.users.email) = v_email LIMIT 1;

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
    is_sso_user, is_anonymous, deleted_at
  ) VALUES (
    v_new_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    v_email,
    extensions.crypt(password, extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"email_verified": true}',
    now(), now(),
    '', '',
    false, false, null
  );

  -- provider_id MUST be the email for GoTrue to authenticate
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at, provider_id
  ) VALUES (
    gen_random_uuid(), v_new_uid,
    jsonb_build_object('sub', v_new_uid::text, 'email', v_email, 'email_verified', true, 'provider_id', v_email),
    'email',
    now(), now(), now(),
    v_email
  );

  INSERT INTO perfiles (id, nombre, apellido, edad, estatura, sexo, rol, foto_url, entrenador_id)
  VALUES (v_new_uid, v_nombre, v_apellido, edad, estatura, v_sexo, v_rol, foto_url, v_entrenador_id);

  RETURN jsonb_build_object('success', true, 'user_id', v_new_uid);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$func$;

NOTIFY pgrst, 'reload schema';
