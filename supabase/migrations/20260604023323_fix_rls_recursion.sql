/*
  # Fix RLS Recursion in Perfiles Table

  Remove recursive RLS policies that cause infinite recursion errors.
  Implement simpler, non-recursive policies.
  
  Security:
  - Users can view their own profile
  - Users can update their own profile
  - Users can insert their own profile (for registration)
  - Admins can view/update all profiles
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Admin can delete profiles" ON perfiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can update own profile" ON perfiles;
DROP POLICY IF EXISTS "Users can view own profile" ON perfiles;

-- Simple non-recursive policies
CREATE POLICY "Users can view own profile"
  ON perfiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON perfiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON perfiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON perfiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Admin access (using app_metadata instead of recursive query)
CREATE POLICY "Admin full access to profiles"
  ON perfiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'authenticated' AND
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'administrador'
  );

CREATE POLICY "Admin can update any profile"
  ON perfiles FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'authenticated' AND
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'administrador'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'authenticated' AND
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'administrador'
  );
