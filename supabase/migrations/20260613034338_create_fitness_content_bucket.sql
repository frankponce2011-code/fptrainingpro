
-- Storage bucket for fitness content files (PDFs + images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fitness-content',
  'fitness-content',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "public_read_fitness_content" ON storage.objects
  FOR SELECT USING (bucket_id = 'fitness-content');

-- Admin can upload
CREATE POLICY "admin_upload_fitness_content" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'fitness-content' AND
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'entrenador_administrador'
  );

-- Admin can delete
CREATE POLICY "admin_delete_fitness_content_files" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'fitness-content' AND
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'entrenador_administrador'
  );
