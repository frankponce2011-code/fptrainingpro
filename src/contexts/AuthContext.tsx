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
    });
    if (error) {
      console.warn('[AUTH] logIngreso non-critical error:', error.code, error.message);
    }
  } catch (err) {
    console.warn('[AUTH] logIngreso exception (non-critical):', err);
  }
}

async function fetchProfileFromDB(userId: string): Promise<Profile | null> {
  console.log('[AUTH] Fetching profile for user:', userId);
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[AUTH] fetchProfile Supabase error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }

  if (!data) {
    console.warn('[AUTH] fetchProfile: no profile found for user', userId);
    return null;
  }

  console.log('[AUTH] Profile loaded:', data.rol);
  return data as Profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  async function fetchProfile(userId: string): Promise<Profile | null> {
    const p = await fetchProfileFromDB(userId);
    setProfile(p);
    return p;
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn('[AUTH] Init timeout reached — forcing ready state');
      setLoading(false);
      setInitialized(true);
    }, 8000);

    supabase.auth.getSession().then(async ({ data: { session: s }, error }) => {
      clearTimeout(timeout);

      if (error) {
        console.error('[AUTH] getSession error:', error.message);
        setLoading(false);
        setInitialized(true);
        return;
      }

      if (s?.user) {
        const p = await fetchProfileFromDB(s.user.id);
        if (!p) {
          console.warn('[AUTH] No profile found on session restore — signing out user', s.user.email);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
        } else {
          setSession(s);
          setUser(s.user);
          setProfile(p);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
      setInitialized(true);
    }).catch((err) => {
      clearTimeout(timeout);
      console.error('[AUTH] getSession exception:', err);
      setLoading(false);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (event === 'INITIAL_SESSION') return;

      console.log('[AUTH] onAuthStateChange event:', event, s?.user?.email ?? 'no user');

      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        const { data, error } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', s.user.id)
          .maybeSingle();

        if (error) {
          console.error('[AUTH] onAuthStateChange profile error:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
        }

        setProfile(data as Profile | null);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string): Promise<{ error: Error | null }> {
    console.log('[AUTH] signIn attempt:', email);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[AUTH] signInWithPassword error:', {
        status: error.status,
        code: (error as { code?: string }).code,
        message: error.message,
        name: error.name,
      });
      return { error: error as Error };
    }

    console.log('[AUTH] signIn success, user id:', data.user?.id);

    if (data.user) {
      const p = await fetchProfile(data.user.id);
      if (!p) {
        console.error('[AUTH] signIn: auth OK but NO PROFILE found in table "perfiles" for user id:', data.user.id, '| email:', email);
        await supabase.auth.signOut();
        return {
          error: new Error(
            `AUTH_OK_NO_PROFILE::La autenticacion fue exitosa pero no se encontro un perfil en la tabla "perfiles" para este usuario (${email}). Contacta al administrador.`
          ),
        };
      }
      await logIngreso(data.user.id, p, email);
    }

    return { error: null };
  }

  async function signUp(email: string, password: string): Promise<{ error: Error | null; isNew: boolean }> {
    console.log('[AUTH] signUp attempt:', email);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error('[AUTH] signUp error:', error.message);
      return { error: error as Error, isNew: false };
    }
    const isNew = (data.user?.identities?.length ?? 0) > 0;
    return { error: null, isNew };
  }

  async function signOut() {
    console.log('[AUTH] signOut');
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, initialized, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
