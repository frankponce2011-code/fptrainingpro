/*
  # Create Supabase Storage Buckets

  Creates storage buckets for:
  - profile-photos: Public bucket for user profile images
  - dietas-files: Public bucket for diet Word documents
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('dietas-files', 'dietas-files', true, 10485760, ARRAY['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-photos
CREATE POLICY "Authenticated users can upload profile photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Anyone can view profile photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can update own profile photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own profile photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for dietas-files
CREATE POLICY "Admin can upload dietas files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dietas-files' AND
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  );

CREATE POLICY "Authenticated users can view dietas files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'dietas-files');

CREATE POLICY "Admin can delete dietas files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dietas-files' AND
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid()
      AND p.rol = 'administrador'
    )
  );
