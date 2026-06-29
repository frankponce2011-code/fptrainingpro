-- Drop the old constraint that lacked rutina_id
ALTER TABLE registro_ejercicios
  DROP CONSTRAINT IF EXISTS registro_ejercicios_alumno_id_ejercicio_id_fecha_key;

-- Add the correct composite unique constraint
ALTER TABLE registro_ejercicios
  ADD CONSTRAINT registro_ejercicios_alumno_rutina_ejercicio_fecha_key
  UNIQUE (alumno_id, rutina_id, ejercicio_id, fecha);
