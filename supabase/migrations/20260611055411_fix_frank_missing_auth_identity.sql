-- Add missing auth identity for frankponce2011@gmail.com
-- Without this record, Supabase Auth refuses login even with correct password
INSERT INTO auth.identities (
  id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at, provider_id
)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(), now(), now(),
  u.id::text
FROM auth.users u
WHERE u.email = 'frankponce2011@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);
