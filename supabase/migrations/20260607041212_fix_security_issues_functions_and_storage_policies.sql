
-- Revoke EXECUTE on SECURITY DEFINER functions from anon and authenticated.
-- These are internal RLS helpers only; clients should not call them via PostgREST.
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_trainer() FROM anon, authenticated;

-- Drop overly broad storage SELECT policies that allow listing all files.
DROP POLICY IF EXISTS "Authenticated users can read dietas" ON storage.objects;
DROP POLICY IF EXISTS "Public can read dietas" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view dietas files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;

-- Re-add tightly scoped SELECT policies scoped to the owner's folder.
-- profile-photos: owner can read their own folder only
CREATE POLICY "Users can read own profile photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- dietas / dietas-files: owner can read their own folder only
CREATE POLICY "Users can read own dietas"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('dietas', 'dietas-files')
  AND (storage.foldername(name))[1] = auth.uid()::text
);
