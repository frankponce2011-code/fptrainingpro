-- Fix FK constraint that was blocking deletes
ALTER TABLE evaluaciones
  DROP CONSTRAINT IF EXISTS evaluaciones_cargado_por_fkey;

ALTER TABLE evaluaciones
  ADD CONSTRAINT evaluaciones_cargado_por_fkey
  FOREIGN KEY (cargado_por) REFERENCES perfiles(id) ON DELETE SET NULL;

-- Improved delete_user: nullifies references before deleting
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_id  uuid := auth.uid();
  v_caller_rol text;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No autenticado');
  END IF;

  SELECT rol INTO v_caller_rol FROM perfiles WHERE id = v_caller_id;
  IF v_caller_rol NOT IN ('entrenador', 'entrenador_administrador') THEN
    RETURN jsonb_build_object('error', 'Sin permisos');
  END IF;

  -- Trainers can only delete their own students
  IF v_caller_rol = 'entrenador' THEN
    IF NOT EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = target_user_id
        AND entrenador_id = v_caller_id
        AND rol = 'alumno'
    ) THEN
      RETURN jsonb_build_object('error', 'Sin permisos para eliminar este usuario');
    END IF;
  END IF;

  -- Nullify soft references before deletion
  UPDATE evaluaciones SET cargado_por = NULL WHERE cargado_por = target_user_id;
  UPDATE plantillas_rutina SET creado_por = NULL WHERE creado_por = target_user_id;
  UPDATE rutinas_alumno SET asignado_por = NULL WHERE asignado_por = target_user_id;
  UPDATE registro_ingresos SET usuario_id = NULL WHERE usuario_id = target_user_id;

  -- Unassign students if deleting a trainer
  UPDATE perfiles SET entrenador_id = NULL WHERE entrenador_id = target_user_id;

  -- Delete profile (cascades to evaluaciones, dietas, rutinas, rutinas_alumno, registros_ejercicio)
  DELETE FROM perfiles WHERE id = target_user_id;

  -- Delete auth user and its related rows (refresh_tokens.user_id is varchar)
  DELETE FROM auth.identities WHERE user_id = target_user_id;
  DELETE FROM auth.sessions WHERE user_id = target_user_id;
  DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id::text;
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Clean up orphan auth.users (exist in auth but have no profile)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT u.id FROM auth.users u
    LEFT JOIN public.perfiles p ON p.id = u.id
    WHERE p.id IS NULL
  LOOP
    DELETE FROM auth.identities WHERE user_id = r.id;
    DELETE FROM auth.sessions WHERE user_id = r.id;
    DELETE FROM auth.refresh_tokens WHERE user_id = r.id::text;
    DELETE FROM auth.users WHERE id = r.id;
  END LOOP;
END;
$$;
