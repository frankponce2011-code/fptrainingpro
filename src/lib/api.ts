import { supabase } from './supabase';

export type CreateUserPayload = {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  edad?: string;
  estatura?: string;
  sexo?: string;
  rol?: 'alumno' | 'entrenador';
  foto_url?: string;
  entrenador_id?: string | null;
};

export async function createUser(payload: CreateUserPayload): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: {
      email: payload.email,
      password: payload.password,
      nombre: payload.nombre,
      apellido: payload.apellido,
      rol: payload.rol ?? 'alumno',
      entrenador_id: payload.entrenador_id ?? null,
      edad: payload.edad ? parseInt(payload.edad) : null,
      estatura: payload.estatura ? parseFloat(payload.estatura) : null,
      sexo: payload.sexo ?? 'masculino',
      foto_url: payload.foto_url ?? null,
    },
  });

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { error: null };
}

export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  const { data: authData, error: authError } = await supabase.functions.invoke('auth-admin', {
    body: { action: 'delete_user', user_id: userId },
  });

  if (authError) return { error: authError.message };
  if (authData?.error) return { error: authData.error };

  const { error: profileError } = await supabase.from('perfiles').delete().eq('id', userId);
  if (profileError) return { error: profileError.message };

  return { error: null };
}
