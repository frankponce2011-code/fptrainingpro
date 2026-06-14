
-- 1. Fix NULL tokens (set to empty string, matching what create_user function does)
UPDATE auth.users
SET 
  confirmation_token = '',
  recovery_token     = '',
  updated_at         = now()
WHERE lower(email) = 'frankponce2011@gmail.com';

-- 2. Create the missing perfiles record for frank
INSERT INTO public.perfiles (id, nombre, apellido, sexo, rol)
SELECT id, 'Frank', 'Ponce', 'masculino', 'entrenador_administrador'
FROM auth.users
WHERE lower(email) = 'frankponce2011@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
