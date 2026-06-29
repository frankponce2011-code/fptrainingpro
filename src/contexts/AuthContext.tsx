import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; isNew: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
async function logIngreso(userId: string, profile: Profile | null, email: string) {
  try {
    const { error } = await supabase.from('registro_ingresos').insert({
      usuario_id: userId,
      nombre_completo: profile ? `${profile.nombre} ${profile.apellido}`.trim() : '',
      correo: email,
      rol: profile?.rol || '',
      fecha_ingreso: new Date().toISOString(), // opcional si tu tabla ya lo pone por defecto
    });
    if (error) {
      console.warn('[AUTH] logIngreso non-critical error:', error.code, error.message);
    }
  } catch (err) {
    console.warn('[AUTH] logIngreso exception (non-critical):', err);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  async function loadUserWithProfile(s: Session | null): Promise<Profile | null> {
    if (!s?.user) {
      setSession(null);
      setUser(null);
      setProfile(null);
      return null;
    }

    const email = s.user.email;

    // 1. Buscar perfil por ID de Auth
    let { data: p } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', s.user.id)
      .maybeSingle();

    // 2. Si no existe por ID y es Google, buscar por correo para vincular
    if (!p && s.user.app_metadata?.provider === 'google' && email) {
      const { data: existingProfile } = await supabase
        .from('perfiles')
        .select('*')
        .eq('correo', email)
        .maybeSingle();

      if (existingProfile) {
        // Vincular ID de Google al perfil existente
        await supabase
          .from('perfiles')
          .update({ id: s.user.id })
          .eq('id', existingProfile.id);
        p = { ...existingProfile, id: s.user.id };
      } else {
        // Crear nuevo perfil para usuario de Google
        const nameParts = (s.user.user_metadata?.full_name || 'Usuario').split(' ');
        const { data: newP } = await supabase
          .from('perfiles')
          .insert({
            id: s.user.id,
            nombre: nameParts[0],
            apellido: nameParts.slice(1).join(' ') || '',
            correo: email,
            rol: 'alumno',
            estado: 'activo',
          })
          .select()
          .single();
        p = newP;
      }
    }

    setSession(s);
    setUser(s.user);
    setProfile(p as Profile | null);
    return p as Profile | null;
  }

  useEffect(() => {
    let ignoreAuthChange = false;

    // Cargar sesión inicial
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      const p = await loadUserWithProfile(s);
      if (s?.user) {
        await logIngreso(s.user.id, p, s.user.email || '');
      }
      setLoading(false);
      setInitialized(true);
      ignoreAuthChange = false;
    });

    // Escuchar cambios de sesión POSTERIORES
    // Ignorar el INITIAL_SESSION porque ya lo manejamos arriba
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (event === 'INITIAL_SESSION') return;
      if (ignoreAuthChange) return;

      console.log('[AUTH] onAuthStateChange event:', event);

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      await loadUserWithProfile(s);
    });

    return () => {
      ignoreAuthChange = true;
      subscription.unsubscribe();
    };
  }, []);

  async function refreshProfile() {
    if (session) await loadUserWithProfile(session);
  }

  async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error && data.session) {
    const p = await loadUserWithProfile(data.session);
    if (data.user) {
      await logIngreso(data.user.id, p, email); // ← aquí se registra el ingreso
    }
  }
  return { error: error as Error | null };
}

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error: error as Error | null };
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null, isNew: !!data.user };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading, initialized,
      signIn, signInWithGoogle, signUp, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
