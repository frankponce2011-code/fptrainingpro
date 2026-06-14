-- Create auth user for Frank
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'frankponce2011@gmail.com',
  crypt('t53q28', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
);

-- Create identity for Frank
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  provider_id
)
SELECT
  gen_random_uuid(),
  id,
  json_build_object('sub', id::text, 'email', email),
  'email',
  now(),
  now(),
  now(),
  email
FROM auth.users
WHERE email = 'frankponce2011@gmail.com';

-- Create Frank's profile
INSERT INTO public.perfiles (id, nombre, apellido, sexo, rol)
SELECT id, 'Frank', 'Ponce', 'masculino', 'entrenador_administrador'
FROM auth.users
WHERE email = 'frankponce2011@gmail.com';