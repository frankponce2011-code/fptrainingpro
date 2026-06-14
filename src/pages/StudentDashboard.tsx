import { useState, useEffect } from 'react';
import {
  User, Apple, Dumbbell, LogOut, Edit3, Calculator, BookOpen, Activity, Zap, Trophy, Newspaper,
} from 'lucide-react';
import { supabase, Dieta, Profile, RutinaAlumno } from '../lib/supabase';

type RutinaConFechaFin = RutinaAlumno & { fecha_fin: string | null; activa: boolean };

function isRutinaVencida(fechaFin: string | null): boolean {
  if (!fechaFin) return false;
  const today = new Date().toISOString().split('T')[0];
  return today > fechaFin;
}
import { useAuth } from '../contexts/AuthContext';
import ProfileSetupPage from './ProfileSetupPage';
import MacroCalculator from './MacroCalculator';
import ExerciseLibrary from './ExerciseLibrary';
import EvaluacionList from './EvaluacionList';
import RutinaAlumnoKanban from './RutinaAlumnoKanban';
import NotificationBell from '../lib/NotificationBell';
import OneRMCalculator from './OneRMCalculator';
import XpStatusPage from './XpStatusPage';
import FitnessContent from './FitnessContent';

type View = 'home' | 'macros' | 'exercises' | 'evaluaciones' | 'dieta' | 'onerm' | 'xp' | 'fitness';

export default function StudentDashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [view, setView] = useState<View>('home');
  const [editingProfile, setEditingProfile] = useState(false);
  const [dieta, setDieta] = useState<Dieta | null>(null);
  const [rutina, setRutina] = useState<RutinaConFechaFin | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [showRutina, setShowRutina] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    setDataLoading(true);
    const [dietaRes, rutinaRes] = await Promise.all([
      supabase
        .from('dietas')
        .select('*')
        .eq('alumno_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('rutinas_alumno')
        .select('*')
        .eq('alumno_id', user!.id)
        .eq('activa', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setDieta(dietaRes.data);
    setRutina(rutinaRes.data as RutinaConFechaFin | null);
    setDataLoading(false);
  }

  if (editingProfile) {
    return (
      <ProfileSetupPage
        isEditing
        onDone={() => { setEditingProfile(false); refreshProfile(); }}
      />
    );
  }

  if (view === 'macros') return <MacroCalculator onClose={() => setView('home')} />;
  if (view === 'exercises') return <ExerciseLibrary onClose={() => setView('home')} />;
  if (view === 'onerm') return <OneRMCalculator onClose={() => setView('home')} />;
  if (view === 'fitness') return <FitnessContent onBack={() => setView('home')} />;
  if (view === 'xp' && profile) return <XpStatusPage profile={profile as Profile} onBack={() => setView('home')} />;
  if (view === 'evaluaciones' && profile) {
    return <EvaluacionList alumno={profile as Profile} onBack={() => setView('home')} readOnly />;
  }

  if (showRutina && rutina) {
    if (isRutinaVencida(rutina.fecha_fin)) {
      return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center max-w-lg mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <Dumbbell size={32} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Rutina vencida</h2>
          <p className="text-sm text-gray-400 mb-6">Comuniquese con su entrenador para renovar su rutina.</p>
          <button
            onClick={() => setShowRutina(false)}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 text-sm font-semibold transition-colors"
          >
            Volver
          </button>
        </div>
      );
    }
    return <RutinaAlumnoKanban rutina={rutina} onBack={() => setShowRutina(false)} onFirstXp={() => { setShowRutina(false); setView('xp'); }} />;
  }

  const displayName = `${profile?.nombre || ''} ${profile?.apellido || ''}`.trim();
  const initials = `${profile?.nombre?.[0] || ''}${profile?.apellido?.[0] || ''}`.toUpperCase();
  const fileName = dieta?.archivo_url
    ? decodeURIComponent(dieta.archivo_url.split('/').pop() || 'dieta')
    : null;

  const menuItems = [
    { key: 'evaluaciones', icon: Activity, label: 'Mis Evaluaciones', color: 'from-blue-600 to-blue-700' },
    { key: 'dieta', icon: Apple, label: 'Mi Dieta', color: 'from-green-600 to-green-700' },
    { key: 'macros', icon: Calculator, label: 'Calculadora de Macros', color: 'from-orange-600 to-orange-700' },
    { key: 'exercises', icon: BookOpen, label: 'Biblioteca de Ejercicios', color: 'from-purple-600 to-purple-700' },
    { key: 'onerm', icon: Zap, label: 'Calculadora 1RM', color: 'from-yellow-600 to-amber-700' },
    { key: 'fitness', icon: Newspaper, label: 'Contenido Fitness', color: 'from-teal-600 to-teal-700' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      {/* Brand watermark */}
      <div className="fixed inset-0 max-w-lg mx-auto flex items-center justify-center pointer-events-none z-0">
        <img src="/LogoActual.jpg" alt="" aria-hidden className="w-[45vw] max-w-[220px] select-none" style={{ opacity: 0.04, filter: 'grayscale(100%)' }} />
      </div>
      <header className="bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800 px-4 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 border-2 border-yellow-400 shrink-0">
              {profile?.foto_url ? (
                <img src={profile.foto_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-yellow-400 font-rajdhani">
                  {initials || <User size={18} />}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Bienvenido,</p>
              <h1 className="text-xl font-bold text-white font-rajdhani truncate">{displayName || 'Atleta'}</h1>
              {(profile?.xp_points ?? 0) > 0 && (
                <button onClick={() => setView('xp')} className="inline-flex items-center gap-1 mt-0.5">
                  <Trophy size={10} className="text-yellow-400" />
                  <span className="text-[10px] font-bold text-yellow-400">{(profile?.xp_points ?? 0).toLocaleString()} XP</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={() => setEditingProfile(true)}
              className="text-gray-500 hover:text-yellow-400 transition-colors p-2 rounded-lg hover:bg-gray-800">
              <Edit3 size={18} />
            </button>
            <button onClick={signOut}
              className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-800">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-28 overflow-y-auto page-enter flex flex-col">
        <div className="grid grid-cols-2 gap-3 mb-6">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key as View)}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all duration-200 ${
                  view === item.key
                    ? `bg-gradient-to-br ${item.color} text-white shadow-lg`
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white transition-transform ${view === item.key ? 'scale-110' : ''}`}>
                  <Icon size={24} />
                </div>
                <span className="text-xs font-semibold text-center">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Mi Estatus XP card ─────────────────────────────────── */}
        <button
          onClick={() => setView('xp')}
          className="w-full mb-5 rounded-2xl overflow-hidden transition-all duration-200 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg,rgba(17,24,39,1) 0%,rgba(9,9,11,1) 100%)',
            border: '1px solid rgba(250,204,21,0.35)',
            boxShadow: '0 0 30px rgba(250,204,21,0.1)',
          }}
        >
          <div className="flex items-center gap-4 px-5 py-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,rgba(250,204,21,0.2),rgba(245,158,11,0.1))', border: '1.5px solid rgba(250,204,21,0.45)', boxShadow: '0 0 20px rgba(250,204,21,0.3)' }}
            >
              <Trophy size={26} className="text-yellow-400" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-base font-black text-white tracking-wide">Mi Estatus y Rangos</p>
              <p className="text-xs text-gray-400 mt-0.5">Escalera de XP · Tabla de posiciones</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-black text-yellow-400">{(profile?.xp_points ?? 0).toLocaleString()}</p>
              <p className="text-[9px] text-gray-600 uppercase">XP</p>
            </div>
          </div>
          <div className="h-1 bg-gray-800">
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, ((profile?.xp_points ?? 0) / 10000) * 100)}%`,
                background: 'linear-gradient(90deg,#facc15,#f59e0b)',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </button>

        {view === 'home' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Dumbbell size={48} className="mx-auto text-yellow-400 mb-3" />
              <h2 className="text-xl font-bold text-white mb-2">Bienvenido</h2>
              <p className="text-gray-400 text-sm">Selecciona una opcion del menu</p>
            </div>
          </div>
        )}

        {view === 'dieta' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 font-rajdhani">Mi Dieta</h2>
            {dataLoading ? (
              <div className="text-center py-8"><span className="w-8 h-8 spinner mx-auto" /></div>
            ) : !dieta ? (
              <div className="text-center py-8 text-gray-400">
                <Apple size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold mb-1">Sin dieta asignada</p>
                <p className="text-xs text-gray-500">Tu entrenador aun no te ha enviado una dieta</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dieta.archivo_url ? (
                  <a href={dieta.archivo_url} target="_blank" rel="noopener noreferrer" download
                    className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-2xl p-4 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                      <Apple size={24} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{fileName || 'Mi dieta'}</p>
                      <p className="text-xs text-green-400 mt-0.5">Toca para descargar</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </div>
                  </a>
                ) : (
                  <div className="bg-gray-800 rounded-2xl p-4">
                    <p className="text-sm text-gray-400 text-center">Sin archivo adjunto</p>
                  </div>
                )}
                {(dieta.descripcion || dieta.fecha_fin) && (
                  <div className="bg-gray-800 rounded-2xl overflow-hidden">
                    {dieta.descripcion && (
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-xs text-gray-500 mb-1">Descripcion</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{dieta.descripcion}</p>
                      </div>
                    )}
                    {dieta.fecha_fin && (
                      <div className="px-4 py-3">
                        <p className="text-xs text-gray-500 mb-0.5">Valida hasta</p>
                        <p className="text-sm font-semibold text-white">
                          {new Date(dieta.fecha_fin + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mi Rutina sticky button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-4 bg-gradient-to-t from-gray-950 to-transparent">
        {dataLoading ? (
          <div className="w-full py-4 rounded-2xl bg-yellow-400/30 flex items-center justify-center gap-3">
            <span className="w-5 h-5 spinner" style={{ borderTopColor: '#111827' }} />
          </div>
        ) : rutina ? (
          <button
            onClick={() => setShowRutina(true)}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 flex flex-col items-center justify-center gap-0.5 shadow-lg ${
              isRutinaVencida(rutina.fecha_fin)
                ? 'bg-red-500/20 border border-red-500/40 text-red-300 shadow-red-500/10'
                : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-yellow-400/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Dumbbell size={22} />
              <span>Mi Rutina</span>
            </div>
            <span className="text-xs font-semibold opacity-70">
              {isRutinaVencida(rutina.fecha_fin) ? 'Rutina vencida' : rutina.nombre}
            </span>
          </button>
        ) : (
          <div className="w-full py-4 rounded-2xl bg-gray-800 border border-gray-700 flex flex-col items-center justify-center gap-0.5 cursor-default">
            <div className="flex items-center gap-2 text-gray-500">
              <Dumbbell size={22} />
              <span className="font-bold text-lg">Mi Rutina</span>
            </div>
            <span className="text-xs text-gray-600">Tu entrenador aun no te ha asignado una rutina</span>
          </div>
        )}
      </div>
    </div>
  );
}
