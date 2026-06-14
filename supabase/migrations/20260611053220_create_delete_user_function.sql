CREATE OR REPLACE FUNCTION public.delete_user(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_id  uuid := auth.uid();
  v_caller_rol text;
  v_target_rol text;
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

  -- Delete profile first (FK constraints)
  DELETE FROM perfiles WHERE id = target_user_id;

  -- Delete from auth.users (requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;
