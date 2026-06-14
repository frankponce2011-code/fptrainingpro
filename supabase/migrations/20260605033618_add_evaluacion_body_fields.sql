-- Add all body measurement fields to evaluaciones table
ALTER TABLE evaluaciones
  ADD COLUMN IF NOT EXISTS hombros numeric,
  ADD COLUMN IF NOT EXISTS pecho numeric,
  ADD COLUMN IF NOT EXISTS intercostal numeric,
  ADD COLUMN IF NOT EXISTS cintura numeric,
  ADD COLUMN IF NOT EXISTS cadera_alta numeric,
  ADD COLUMN IF NOT EXISTS gluteos numeric,
  ADD COLUMN IF NOT EXISTS muslo_derecho numeric,
  ADD COLUMN IF NOT EXISTS muslo_izquierdo numeric,
  ADD COLUMN IF NOT EXISTS pantorrilla_derecha numeric,
  ADD COLUMN IF NOT EXISTS pantorrilla_izquierda numeric,
  ADD COLUMN IF NOT EXISTS biceps_derecho_relajado numeric,
  ADD COLUMN IF NOT EXISTS biceps_derecho_contraido numeric,
  ADD COLUMN IF NOT EXISTS biceps_izquierdo numeric,
  ADD COLUMN IF NOT EXISTS pliegue_triceps numeric,
  ADD COLUMN IF NOT EXISTS pliegue_subescapular numeric,
  ADD COLUMN IF NOT EXISTS pliegue_cresta_iliaca numeric,
  ADD COLUMN IF NOT EXISTS pliegue_supraespinal numeric,
  ADD COLUMN IF NOT EXISTS pliegue_abdominal numeric,
  ADD COLUMN IF NOT EXISTS pliegue_muslo numeric,
  ADD COLUMN IF NOT EXISTS pliegue_pantorrilla numeric,
  ADD COLUMN IF NOT EXISTS porcentaje_grasa numeric,
  ADD COLUMN IF NOT EXISTS foto_url text;

-- Remove columns no longer needed
ALTER TABLE evaluaciones DROP COLUMN IF EXISTS altura;
ALTER TABLE evaluaciones DROP COLUMN IF EXISTS imc;
ALTER TABLE evaluaciones DROP COLUMN IF EXISTS masa_muscular;
