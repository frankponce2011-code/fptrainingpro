-- Trigger: when a perfil is deleted, automatically delete the auth.users record
CREATE OR REPLACE FUNCTION public.on_profile_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_auth_on_profile_delete ON public.perfiles;

CREATE TRIGGER trg_delete_auth_on_profile_delete
  AFTER DELETE ON public.perfiles
  FOR EACH ROW
  EXECUTE FUNCTION public.on_profile_deleted();
