-- Add missing fields to dietas table
ALTER TABLE dietas
  DROP CONSTRAINT IF EXISTS dietas_nombre_not_null,
  ALTER COLUMN nombre DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS fecha_fin date;
