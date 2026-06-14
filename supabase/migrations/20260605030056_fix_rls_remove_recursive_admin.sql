-- Remove the recursive admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admin full access to profiles" ON perfiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON perfiles;

-- The "Users can view own profile" policy already allows users to see their own row.
-- For admin access to OTHER users, we need a non-recursive approach.
-- Using a security definer function to break the recursion:

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'administrador'
  );
$$;

-- Admin SELECT policy using the security-definer function (no recursion)
CREATE POLICY "Admin can view all profiles"
  ON perfiles FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin UPDATE policy using the security-definer function
CREATE POLICY "Admin can update all profiles"
  ON perfiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin DELETE policy for any profile
CREATE POLICY "Admin can delete any profile"
  ON perfiles FOR DELETE
  TO authenticated
  USING (is_admin());
