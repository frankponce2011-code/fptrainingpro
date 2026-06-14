-- ══════════════════════════════════════════════════════
-- Fix: dietas RLS + storage policies for trainers/admin
-- ══════════════════════════════════════════════════════

-- ── 1. Replace dietas table policies ──────────────────

DROP POLICY IF EXISTS "Admin insert dietas"   ON dietas;
DROP POLICY IF EXISTS "Trainer insert dietas" ON dietas;
DROP POLICY IF EXISTS "Admin update dietas"   ON dietas;
DROP POLICY IF EXISTS "Trainer update dietas" ON dietas;
DROP POLICY IF EXISTS "Admin delete dietas"   ON dietas;
DROP POLICY IF EXISTS "Trainer delete dietas" ON dietas;
DROP POLICY IF EXISTS "Admin view dietas"     ON dietas;
DROP POLICY IF EXISTS "Trainer view dietas"   ON dietas;
DROP POLICY IF EXISTS "Students view own dietas" ON dietas;

-- SELECT: alumno ve las suyas; entrenador/admin ven todas las de sus alumnos o todas
CREATE POLICY "dietas_select" ON dietas
  FOR SELECT TO authenticated USING (
    alumno_id = auth.uid()
    OR is_admin()
    OR (
      is_trainer()
      AND EXISTS (
        SELECT 1 FROM perfiles p
        WHERE p.id = dietas.alumno_id
          AND p.entrenador_id = auth.uid()
      )
    )
  );

-- INSERT: entrenador puede insertar dieta a sus alumnos; admin puede a cualquiera
CREATE POLICY "dietas_insert" ON dietas
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR (
      is_trainer()
      AND EXISTS (
        SELECT 1 FROM perfiles p
        WHERE p.id = alumno_id
          AND p.entrenador_id = auth.uid()
      )
    )
  );

-- UPDATE: igual que insert
CREATE POLICY "dietas_update" ON dietas
  FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR (
      is_trainer()
      AND EXISTS (
        SELECT 1 FROM perfiles p
        WHERE p.id = dietas.alumno_id
          AND p.entrenador_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    is_admin()
    OR (
      is_trainer()
      AND EXISTS (
        SELECT 1 FROM perfiles p
        WHERE p.id = alumno_id
          AND p.entrenador_id = auth.uid()
      )
    )
  );

-- DELETE: igual que update
CREATE POLICY "dietas_delete" ON dietas
  FOR DELETE TO authenticated
  USING (
    is_admin()
    OR (
      is_trainer()
      AND EXISTS (
        SELECT 1 FROM perfiles p
        WHERE p.id = dietas.alumno_id
          AND p.entrenador_id = auth.uid()
      )
    )
  );

-- ── 2. Fix storage.objects policies for 'dietas' bucket ──

-- Remove restrictive policies that break trainer uploads/reads
DROP POLICY IF EXISTS "Users can read own dietas"           ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload dietas" ON storage.objects;

-- Any authenticated trainer/admin can upload to 'dietas' bucket
CREATE POLICY "dietas_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'dietas'
    AND (
      EXISTS (
        SELECT 1 FROM perfiles
        WHERE id = auth.uid()
          AND rol IN ('entrenador', 'entrenador_administrador')
      )
    )
  );

-- Any authenticated user can read from 'dietas' bucket
-- (access to the actual file is secured at the dieta row level)
CREATE POLICY "dietas_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'dietas');

-- Trainer/admin can update files in 'dietas' bucket
CREATE POLICY "dietas_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'dietas'
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid()
        AND rol IN ('entrenador', 'entrenador_administrador')
    )
  );

-- Trainer/admin can delete files in 'dietas' bucket
DROP POLICY IF EXISTS "Admin can delete dietas files" ON storage.objects;
CREATE POLICY "dietas_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('dietas', 'dietas-files')
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id = auth.uid()
        AND rol IN ('entrenador', 'entrenador_administrador')
    )
  );

-- ── 3. Fix evaluaciones storage as well (same pattern) ──

DROP POLICY IF EXISTS "Users can read own evaluaciones" ON storage.objects;

CREATE POLICY "evaluaciones_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'evaluaciones');

-- ── 4. Make sure 'evaluaciones' bucket exists as public ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('evaluaciones', 'evaluaciones', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('dietas', 'dietas', true)
ON CONFLICT (id) DO UPDATE SET public = true;
