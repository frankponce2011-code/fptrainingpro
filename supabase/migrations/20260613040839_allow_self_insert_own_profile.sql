-- Allow a newly registered user to create their own profile row
CREATE POLICY "self_insert_own_profile" ON perfiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
