-- Create dietas storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('dietas', 'dietas', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload dietas files
CREATE POLICY "Authenticated users can upload dietas"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'dietas');

-- Allow authenticated users to read dietas files
CREATE POLICY "Authenticated users can read dietas"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'dietas');

-- Allow public to read dietas files (since bucket is public)
CREATE POLICY "Public can read dietas"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'dietas');
