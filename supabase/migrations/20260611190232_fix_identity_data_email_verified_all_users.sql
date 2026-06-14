
-- Fix identity_data for ALL users: set email_verified=true, phone_verified=false
-- This is what GoTrue checks during signInWithPassword
UPDATE auth.identities
SET 
  identity_data = identity_data 
    || jsonb_build_object('email_verified', true)
    || CASE 
         WHEN identity_data ? 'phone_verified' THEN '{}'::jsonb
         ELSE jsonb_build_object('phone_verified', false)
       END,
  updated_at = now()
WHERE provider = 'email';

-- Verify the fix
DO $$
DECLARE
  bad_count integer;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM auth.identities
  WHERE provider = 'email'
    AND (identity_data->>'email_verified' IS NULL OR (identity_data->>'email_verified')::boolean != true);
  
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Still % identities without email_verified=true', bad_count;
  END IF;
  
  RAISE LOG 'All email identities now have email_verified=true';
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
