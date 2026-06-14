import { useState } from 'react';
import {
  User, LogOut, Edit3, Calculator, BookOpen, Zap, Newspaper, Lock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ProfileSetupPage from './ProfileSetupPage';
import MacroCalculator from './MacroCalculator';
import ExerciseLibrary from './ExerciseLibrary';
import OneRMCalculator from './OneRMCalculator';
import FitnessContent from './FitnessContent';

type View = 'home' | 'macros' | 'exercises' | 'onerm' | 'fitness';

export default function GuestDashboard() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [view, setView] = useState<View>('home');
  const [editingProfile, setEditingProfile] = useState(false);

  if (editingProfile) {
    return <ProfileSetupPage isEditing onDone={() => { setEditingProfile(false); refreshProfile(); }} />;
  }
  if (view === 'macros') return <MacroCalculator onClose={() => setView('home')} />;
  if (view === 'exercises') return <ExerciseLibrary onClose={() => setView('home')} />;
  if (view === 'onerm') return <OneRMCalculator onClose={() => setView('home')} />;
  if (view === 'fitness') return <FitnessContent onBack={() => setView('home')} />;

  const displayName = `${profile?.nombre || ''} ${profile?.apellido || ''}`.trim();
  const initials = `${profile?.nombre?.[0] || ''}${profile?.apellido?.[0] || ''}`.toUpperCase();

  const menuItems = [
    { key: 'macros', icon: Calculator, label: 'Calculadora de Macros', color: 'from-orange-600 to-orange-700' },
    { key: 'exercises', icon: BookOpen, label: 'Biblioteca de Ejercicios', color: 'from-purple-600 to-purple-700' },
    { key: 'onerm', icon: Zap, label: 'Calculadora 1RM', color: 'from-yellow-600 to-amber-700' },
    { key: 'fitness', icon: Newspaper, label: 'Contenido Fitness', color: 'from-teal-600 to-teal-700' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      {/* Watermark */}
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
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-yellow-400">
                  {initials || <User size={18} />}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Bienvenido,</p>
              <h1 className="text-xl font-bold text-white truncate">{displayName || 'Invitado'}</h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 mt-0.5">
                Invitado · Sin entrenador
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditingProfile(true)}
              className="text-gray-500 hover:text-yellow-400 transition-colors p-2 rounded-lg hover:bg-gray-800"
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={signOut}
              className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-800"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-28 overflow-y-auto relative z-[1]">
        {/* Info banner */}
        <div
          className="mb-5 rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{
            background: 'linear-gradient(135deg,rgba(250,204,21,0.08),rgba(245,158,11,0.04))',
            border: '1px solid rgba(250,204,21,0.2)',
          }}
        >
          <div className="w-8 h-8 rounded-xl bg-yellow-400/10 flex items-center justify-center shrink-0 mt-0.5">
            <User size={16} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-yellow-400 mb-0.5">Cuenta de Invitado</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Tienes acceso a herramientas y contenido gratuito. Para acceder a rutinas, dietas y evaluaciones personalizadas, contacta a un entrenador.
            </p>
          </div>
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key as View)}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all duration-200 bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700`}
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white`}>
                  <Icon size={24} />
                </div>
                <span className="text-xs font-semibold text-center leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Premium upsell cards */}
        <div className="space-y-3">
          {/* Dieta Online — disabled */}
          <div
            className="rounded-2xl p-4 flex items-center gap-4 opacity-60"
            style={{
              background: 'linear-gradient(135deg,rgba(250,204,21,0.06),rgba(245,158,11,0.03))',
              border: '1.5px solid rgba(250,204,21,0.2)',
            }}
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
              <Lock size={22} className="text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-white">Crea tu dieta Online</p>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 shrink-0">
                  Proximamente
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Herramienta de planificacion nutricional</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
