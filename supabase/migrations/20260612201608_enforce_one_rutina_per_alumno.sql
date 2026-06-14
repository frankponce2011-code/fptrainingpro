-- Remove all soft-deleted (inactive) orphan rutinas and their children.
-- rutina_alumno_dias and rutina_alumno_ejercicios will cascade automatically.
DELETE FROM rutinas_alumno WHERE activa = FALSE;

-- For any alumno who still has more than one active rutina (edge case),
-- keep only the most recently created one.
DELETE FROM rutinas_alumno
WHERE id NOT IN (
  SELECT DISTINCT ON (alumno_id) id
  FROM rutinas_alumno
  ORDER BY alumno_id, created_at DESC
);

-- Add a unique constraint so the DB enforces one row per alumno going forward.
ALTER TABLE rutinas_alumno
  DROP CONSTRAINT IF EXISTS unique_rutina_per_alumno;

ALTER TABLE rutinas_alumno
  ADD CONSTRAINT unique_rutina_per_alumno UNIQUE (alumno_id);