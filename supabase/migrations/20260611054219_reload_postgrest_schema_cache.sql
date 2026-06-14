-- Force PostgREST to reload schema cache so delete_user RPC becomes visible
NOTIFY pgrst, 'reload schema';
