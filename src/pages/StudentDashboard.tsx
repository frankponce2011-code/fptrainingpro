import { useState, useEffect } from 'react';
import {
  User, Apple, Dumbbell, LogOut, Edit3, Calculator, BookOpen, Activity, Zap, Trophy, Newspaper,
  Home, MessageSquare, Settings, ChevronLeft, ChevronRight, TrendingUp, HelpCircle
} from 'lucide-react';
import { supabase, Dieta, Profile, RutinaAlumno, Evaluacion } from '../lib/supabase';
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
import AIChatModal from './AIChatModal';

type RutinaConFechaFin = RutinaAlumno & { fecha_fin: string | null; activa: boolean };

function isRutinaVencida(fechaFin: string | null): boolean {
  if (!fechaFin) return false;
  const today = new Date().toISOString().split('T')[0];
  return today > fechaFin;
}

type View = 'home' | 'macros' | 'exercises' | 'evaluaciones' | 'dieta' | 'onerm' | 'xp' | 'fitness' | 'herramientas' | 'ajustes';

const RANKS = [
  { name: 'LEYENDA', label: 'LEYENDA FP', xpRequired: 10000 },
  { name: 'ELITE', label: 'ÉLITE', xpRequired: 7500 },
  { name: 'DIAMANTE', label: 'DIAMANTE', xpRequired: 5000 },
  { name: 'COMPETIDORA', label: 'COMPETIDORA', xpRequired: 3000 },
  { name: 'AVANZADA', label: 'AVANZADA', xpRequired: 1500 },
  { name: 'CONSTANTE', label: 'CONSTANTE', xpRequired: 500 },
  { name: 'INICIADA', label: 'INICIADA', xpRequired: 100 },
  { name: 'NOVATA', label: 'NOVATA', xpRequired: 0 },
];

function getRank(xp: number) {
  for (const r of RANKS) {
    if (xp >= r.xpRequired) return r;
  }
  return RANKS[RANKS.length - 1];
}

function getNextRank(xp: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (RANKS[i].xpRequired > xp) return RANKS[i];
  }
  return null;
}

export default function StudentDashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [view, setView] = useState<View>('home');
  const [dieta, setDieta] = useState<Dieta | null>(null);
  const [rutina, setRutina] = useState<RutinaConFechaFin | null>(null);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showRutina, setShowRutina] = useState(false);
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y' | 'all'>('6m');

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    setDataLoading(true);
    try {
      const [dietaRes, rutinaRes, evaluacionesRes] = await Promise.all([
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
        supabase
          .from('evaluaciones')
          .select('*')
          .eq('alumno_id', user!.id)
          .order('fecha', { ascending: true })
      ]);

      setDieta(dietaRes.data);
      setRutina(rutinaRes.data as RutinaConFechaFin | null);
      setEvaluaciones(evaluacionesRes.data || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setDataLoading(false);
    }
  }

  // Vista de rutina completa (Tablero Kanban) - Se mantiene en pantalla completa
  if (showRutina && rutina) {
    if (isRutinaVencida(rutina.fecha_fin)) {
      return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center max-w-lg mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <Dumbbell size={32} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Rutina vencida</h2>
          <p className="text-sm text-gray-400 mb-6">Comuníquese con su entrenador para renovar su rutina.</p>
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

  // Cálculos de gamificación (Rango y barra de progreso)
  const currentXp = profile?.xp_points ?? 0;
  const currentRank = getRank(currentXp);
  const nextRank = getNextRank(currentXp);
  const prevXp = currentRank.xpRequired;
  const nextXp = nextRank ? nextRank.xpRequired : 10000;
  const range = nextXp - prevXp;
  const progressInRank = currentXp - prevXp;
  const pct = range > 0 ? Math.max(0, Math.min(100, (progressInRank / range) * 100)) : 100;

  // Filtrado de evaluaciones para el gráfico
  const filteredEvaluaciones = evaluaciones.filter(ev => {
    if (timeRange === 'all') return true;
    const evDate = new Date(ev.fecha);
    const limitDate = new Date();
    if (timeRange === '3m') limitDate.setMonth(limitDate.getMonth() - 3);
    else if (timeRange === '6m') limitDate.setMonth(limitDate.getMonth() - 6);
    else if (timeRange === '1y') limitDate.setFullYear(limitDate.getFullYear() - 1);
    return evDate >= limitDate;
  });

  // Indicadores de cambio desde la primera evaluación
  const firstEval = evaluaciones[0];
  const lastEval = evaluaciones[evaluaciones.length - 1];

  const currentWeight = lastEval?.peso ?? 0;
  const weightChange = (lastEval && firstEval) ? (lastEval.peso ?? 0) - (firstEval.peso ?? 0) : 0;

  const currentGrasa = lastEval?.porcentaje_grasa ?? 0;
  const grasaChange = (lastEval && firstEval) ? (lastEval.porcentaje_grasa ?? 0) - (firstEval.porcentaje_grasa ?? 0) : 0;

  const formatChange = (change: number, unit: string) => {
    const abs = Math.abs(change).toFixed(1);
    if (change < 0) {
      return { text: `↓ ${abs} ${unit}`, color: 'text-green-400', isPositiveResult: true };
    }
    if (change > 0) {
      return { text: `↑ ${abs} ${unit}`, color: 'text-red-400', isPositiveResult: false };
    }
    return { text: `0.0 ${unit}`, color: 'text-gray-400', isPositiveResult: null };
  };

  const weightChangeInfo = formatChange(weightChange, 'kg');
  const grasaChangeInfo = formatChange(grasaChange, '%');

  // Nombres y avatar
  const displayName = `${profile?.nombre || ''} ${profile?.apellido || ''}`.trim();
  const initials = `${profile?.nombre?.[0] || ''}${profile?.apellido?.[0] || ''}`.toUpperCase();
  const fileName = dieta?.archivo_url
    ? decodeURIComponent(dieta.archivo_url.split('/').pop() || 'dieta')
    : null;

  // Estados de navegación para la barra de pestañas
  const isHomeActive = ['home', 'dieta', 'herramientas'].includes(view);
  const isProgresoActive = ['evaluaciones', 'xp'].includes(view);
  const isAjustesActive = view === 'ajustes';

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col max-w-lg mx-auto relative select-none">
      {/* Marca de agua de logo */}
      <div className="fixed inset-0 max-w-lg mx-auto flex items-center justify-center pointer-events-none z-0">
        <img
          src="/LogoActual.jpg"
          alt=""
          aria-hidden
          className="w-[45vw] max-w-[220px] select-none"
          style={{ opacity: 0.03, filter: 'grayscale(100%)' }}
        />
      </div>

      {/* HEADER DE LA APLICACIÓN (Solo para Inicio, Dieta y Herramientas) */}
      {['home', 'dieta', 'herramientas'].includes(view) && (
        <header className="bg-gradient-to-b from-[#0b1322] to-[#070b13] border-b border-gray-900/60 px-4 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-950 border-2 border-yellow-400 shrink-0 shadow-lg shadow-yellow-400/10">
                {profile?.foto_url ? (
                  <img src={profile.foto_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-yellow-400 font-rajdhani">
                    {initials || <User size={18} />}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 tracking-wide">¡Bienvenido,</p>
                <h1 className="text-lg font-black text-white font-rajdhani truncate leading-tight uppercase tracking-wide">
                  {displayName || 'Atleta'}
                </h1>
                <button
                  onClick={() => setView('xp')}
                  className="inline-flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full mt-0.5 transition-all active:scale-95"
                >
                  <Trophy size={10} className="text-yellow-400 fill-yellow-400/20" />
                  <span className="text-[9px] font-black text-yellow-400 tracking-wider">
                    {(profile?.xp_points ?? 0).toLocaleString()} XP
                  </span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <NotificationBell />
              <button
                onClick={() => setView('ajustes')}
                className="text-gray-400 hover:text-yellow-400 transition-colors p-2 rounded-xl hover:bg-gray-900/60"
              >
                <Edit3 size={18} />
              </button>
              <button
                onClick={signOut}
                className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-gray-900/60"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* CONTENIDO DE LA ALIMENTACIÓN Y VISTAS GENERALES (Inicio, Dieta, Herramientas) */}
      {['home', 'dieta', 'herramientas'].includes(view) && (
        <main className="flex-1 px-4 py-5 pb-24 overflow-y-auto z-10 flex flex-col">
          {dataLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <span className="w-10 h-10 spinner mb-4" />
              <p className="text-xs text-gray-500">Cargando tu información...</p>
            </div>
          ) : (
            <>
              {/* VISTA HOME PRINCIPAL */}
              {view === 'home' && (
                <div className="space-y-5 page-enter">
                  {/* ── TARJETA DE ESTATUS Y RANGOS ── */}
                  <button
                    onClick={() => setView('xp')}
                    className="w-full text-left rounded-2xl overflow-hidden transition-all duration-200 active:scale-[0.98] border border-yellow-400/20 animate-fadeIn"
                    style={{
                      background: 'linear-gradient(135deg, #0d1627 0%, #060b14 100%)',
                      boxShadow: '0 4px 20px rgba(250,204,21,0.05)',
                    }}
                  >
                    <div className="flex items-center gap-4 px-4 py-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)] animate-pulse">
                        <Trophy size={22} className="fill-yellow-400/10" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white uppercase tracking-wider font-rajdhani">
                          Mi Estatus y Rangos
                        </p>
                        <p className="text-[10px] text-gray-400 leading-none">
                          Escalera de XP · Tabla de posiciones
                        </p>
                        {/* Barra de progreso */}
                        <div className="mt-3">
                          <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.4)]"
                            />
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-gray-500 mt-1 font-semibold">
                            <span>{currentXp.toLocaleString()} XP</span>
                            <span>{nextXp.toLocaleString()} XP</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right border-l border-gray-900 pl-4 shrink-0 flex flex-col justify-center h-10">
                        <p className="text-[8px] text-gray-500 uppercase tracking-widest leading-none font-bold">Nivel</p>
                        <p className="text-2xl font-black text-white leading-none mt-0.5 font-rajdhani">
                          {profile?.level || 1}
                        </p>
                        <p className="text-[9px] font-black text-yellow-400 uppercase tracking-wider mt-1">
                          {currentRank.label}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* ── ACCESOS RÁPIDOS GRID ── */}
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1 font-rajdhani">
                      <Zap size={12} className="text-yellow-400 fill-yellow-400/20" /> Accesos Rápidos
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Tarjeta: Mis Evaluaciones */}
                      <button
                        onClick={() => setView('evaluaciones')}
                        className="h-28 rounded-2xl relative overflow-hidden text-left border border-gray-900/80 p-3 flex flex-col justify-between transition-all duration-200 active:scale-[0.98] group shadow-md"
                        style={{
                          backgroundImage: `linear-gradient(to bottom, rgba(7, 11, 19, 0.45) 0%, rgba(7, 11, 19, 0.95) 100%), url('https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md group-hover:scale-105 transition-transform">
                          <Activity size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider font-rajdhani">
                            Mis Evaluaciones
                          </h4>
                          <p className="text-[8px] text-gray-400 leading-tight mt-0.5">
                            Revisa tu progreso y evolución corporal
                          </p>
                        </div>
                      </button>

                      {/* Tarjeta: Mi Dieta */}
                      <button
                        onClick={() => setView('dieta')}
                        className="h-28 rounded-2xl relative overflow-hidden text-left border border-gray-900/80 p-3 flex flex-col justify-between transition-all duration-200 active:scale-[0.98] group shadow-md"
                        style={{
                          backgroundImage: `linear-gradient(to bottom, rgba(7, 11, 19, 0.45) 0%, rgba(7, 11, 19, 0.95) 100%), url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 shadow-md group-hover:scale-105 transition-transform">
                          <Apple size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider font-rajdhani">
                            Mi Dieta
                          </h4>
                          <p className="text-[8px] text-gray-400 leading-tight mt-0.5">
                            Tu plan alimenticio y metas calóricas
                          </p>
                        </div>
                      </button>

                      {/* Tarjeta: Biblioteca de Ejercicios */}
                      <button
                        onClick={() => setView('exercises')}
                        className="h-28 rounded-2xl relative overflow-hidden text-left border border-gray-900/80 p-3 flex flex-col justify-between transition-all duration-200 active:scale-[0.98] group shadow-md"
                        style={{
                          backgroundImage: `linear-gradient(to bottom, rgba(7, 11, 19, 0.45) 0%, rgba(7, 11, 19, 0.95) 100%), url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md group-hover:scale-105 transition-transform">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider font-rajdhani">
                            Biblioteca
                          </h4>
                          <p className="text-[8px] text-gray-400 leading-tight mt-0.5">
                            Ejercicios y tutoriales de entrenamiento
                          </p>
                        </div>
                      </button>

                      {/* Tarjeta: Contenido Fitness */}
                      <button
                        onClick={() => setView('fitness')}
                        className="h-28 rounded-2xl relative overflow-hidden text-left border border-gray-900/80 p-3 flex flex-col justify-between transition-all duration-200 active:scale-[0.98] group shadow-md"
                        style={{
                          backgroundImage: `linear-gradient(to bottom, rgba(7, 11, 19, 0.45) 0%, rgba(7, 11, 19, 0.95) 100%), url('https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-md group-hover:scale-105 transition-transform">
                          <Newspaper size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider font-rajdhani">
                            Contenido Fitness
                          </h4>
                          <p className="text-[8px] text-gray-400 leading-tight mt-0.5">
                            Artículos, tips y consejos de vida sana
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* ── TARJETA HERRAMIENTAS ── */}
                  <button
                    onClick={() => setView('herramientas')}
                    className="w-full rounded-2xl p-4 flex items-center justify-between border border-gray-900/80 hover:border-yellow-400/20 transition-all duration-250 bg-gradient-to-r from-[#0b1222] to-[#070b13] shadow-md active:scale-[0.99] group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-yellow-400/5 border border-yellow-400/20 flex items-center justify-center text-yellow-400 shadow-inner group-hover:scale-105 transition-transform">
                        <Calculator size={18} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider font-rajdhani">
                          Herramientas
                        </h4>
                        <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                          Calculadora de Macros, 1RM y utilidades útiles
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-yellow-400 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* ── SECCIÓN MI PROGRESO ── */}
                  <div
                    className="rounded-2xl border border-gray-900/60 p-4"
                    style={{ background: 'linear-gradient(135deg, #0a0f1b 0%, #060b13 100%)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5 font-rajdhani">
                        <TrendingUp size={14} className="text-yellow-400" /> Mi Progreso
                      </h3>
                      <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="bg-[#050912] border border-gray-900 text-gray-400 text-[10px] rounded-xl px-2 py-1.5 focus:border-yellow-400/50 outline-none cursor-pointer font-bold tracking-wide transition-colors"
                      >
                        <option value="3m">Últimos 3 meses</option>
                        <option value="6m">Últimos 6 meses</option>
                        <option value="1y">Último año</option>
                        <option value="all">Todas</option>
                      </select>
                    </div>

                    {/* Estadísticas rápidas superiores */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-[#050912] border border-gray-900/50 rounded-xl p-3 flex flex-col justify-between">
                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Peso Actual</p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-lg font-black text-white font-rajdhani">
                            {currentWeight > 0 ? `${currentWeight.toFixed(1)}` : '--'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold">kg</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <span className={`text-[9px] font-extrabold ${weightChangeInfo.color}`}>
                            {weightChangeInfo.text}
                          </span>
                          <span className="text-[8px] text-gray-600 font-semibold leading-none">
                            desde primera eval.
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#050912] border border-gray-900/50 rounded-xl p-3 flex flex-col justify-between">
                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Grasa Corporal</p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-lg font-black text-white font-rajdhani">
                            {currentGrasa > 0 ? `${currentGrasa.toFixed(1)}` : '--'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold">%</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <span className={`text-[9px] font-extrabold ${grasaChangeInfo.color}`}>
                            {grasaChangeInfo.text}
                          </span>
                          <span className="text-[8px] text-gray-600 font-semibold leading-none">
                            desde primera eval.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Leyenda del gráfico */}
                    <div className="flex items-center gap-4 text-[9px] font-bold tracking-wide text-gray-500 justify-center mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                        <span>Peso (kg)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                        <span>% Grasa</span>
                      </div>
                    </div>

                    {/* GRÁFICO SVG PERSONALIZADO */}
                    <div className="w-full bg-[#050912]/80 border border-gray-900/40 rounded-xl p-2 relative overflow-hidden min-h-[170px] flex items-center justify-center">
                      {filteredEvaluaciones.length === 0 ? (
                        <div className="text-center py-8">
                          <HelpCircle size={26} className="mx-auto text-gray-700 mb-1.5" />
                          <p className="text-[10px] font-bold text-gray-500">Sin datos de evaluación</p>
                          <p className="text-[9px] text-gray-600 max-w-[200px] mx-auto leading-normal mt-0.5">
                            No tienes evaluaciones registradas para el período seleccionado.
                          </p>
                        </div>
                      ) : (
                        (() => {
                          const pesos = filteredEvaluaciones.map(e => e.peso || 0).filter(Boolean);
                          const grasas = filteredEvaluaciones.map(e => e.porcentaje_grasa || 0).filter(Boolean);

                          const minPesoVal = pesos.length > 0 ? Math.min(...pesos) : 50;
                          const maxPesoVal = pesos.length > 0 ? Math.max(...pesos) : 90;
                          const pRange = (maxPesoVal - minPesoVal) || 10;
                          const minPeso = Math.max(0, minPesoVal - pRange * 0.15);
                          const maxPeso = maxPesoVal + pRange * 0.15;

                          const minGrasaVal = grasas.length > 0 ? Math.min(...grasas) : 10;
                          const maxGrasaVal = grasas.length > 0 ? Math.max(...grasas) : 30;
                          const gRange = (maxGrasaVal - minGrasaVal) || 5;
                          const minGrasa = Math.max(0, minGrasaVal - gRange * 0.15);
                          const maxGrasa = maxGrasaVal + gRange * 0.15;

                          const width = 430;
                          const height = 150;
                          const padL = 34;
                          const padR = 34;
                          const padT = 15;
                          const padB = 25;
                          const chartW = width - padL - padR;
                          const chartH = height - padT - padB;
                          const N = filteredEvaluaciones.length;

                          const getX = (i: number) => {
                            if (N <= 1) return padL + chartW / 2;
                            return padL + (i / (N - 1)) * chartW;
                          };

                          const getPesoY = (val: number) => {
                            return padT + (1 - (val - minPeso) / (maxPeso - minPeso || 1)) * chartH;
                          };

                          const getGrasaY = (val: number) => {
                            return padT + (1 - (val - minGrasa) / (maxGrasa - minGrasa || 1)) * chartH;
                          };

                          // Puntos y líneas para peso
                          let pPath = '';
                          filteredEvaluaciones.forEach((ev, i) => {
                            if (ev.peso) {
                              const x = getX(i);
                              const y = getPesoY(ev.peso);
                              pPath += pPath === '' ? `M ${x} ${y}` : ` L ${x} ${y}`;
                            }
                          });

                          let pAreaPath = '';
                          if (pPath !== '' && N > 1) {
                            const fX = getX(0);
                            const lX = getX(N - 1);
                            pAreaPath = `${pPath} L ${lX} ${padT + chartH} L ${fX} ${padT + chartH} Z`;
                          }

                          // Puntos y líneas para grasa
                          let gPath = '';
                          filteredEvaluaciones.forEach((ev, i) => {
                            if (ev.porcentaje_grasa) {
                              const x = getX(i);
                              const y = getGrasaY(ev.porcentaje_grasa);
                              gPath += gPath === '' ? `M ${x} ${y}` : ` L ${x} ${y}`;
                            }
                          });

                          let gAreaPath = '';
                          if (gPath !== '' && N > 1) {
                            const fX = getX(0);
                            const lX = getX(N - 1);
                            gAreaPath = `${gPath} L ${lX} ${padT + chartH} L ${fX} ${padT + chartH} Z`;
                          }

                          // Eje X: fechas
                          const formatDateLabel = (dateStr: string) => {
                            const parts = dateStr.split('-');
                            if (parts.length < 3) return dateStr;
                            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                            const day = parts[2];
                            const monthIdx = parseInt(parts[1], 10) - 1;
                            return `${day} ${months[monthIdx] || ''}`;
                          };

                          return (
                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                              <defs>
                                <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                </linearGradient>
                                <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
                                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                                </linearGradient>
                              </defs>

                              {/* Líneas horizontales de cuadrícula */}
                              {[0.25, 0.5, 0.75].map((ratio, index) => {
                                const y = padT + ratio * chartH;
                                return (
                                  <line
                                    key={index}
                                    x1={padL}
                                    y1={y}
                                    x2={padL + chartW}
                                    y2={y}
                                    stroke="rgba(255, 255, 255, 0.05)"
                                    strokeDasharray="3 3"
                                  />
                                );
                              })}

                              {/* Relleno de área */}
                              {pAreaPath && <path d={pAreaPath} fill="url(#pGrad)" />}
                              {gAreaPath && <path d={gAreaPath} fill="url(#gGrad)" />}

                              {/* Líneas principales */}
                              {pPath && (
                                <path
                                  d={pPath}
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              )}
                              {gPath && (
                                <path
                                  d={gPath}
                                  fill="none"
                                  stroke="#22c55e"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              )}

                              {/* Puntos de datos */}
                              {filteredEvaluaciones.map((ev, i) => {
                                if (!ev.peso) return null;
                                return (
                                  <circle
                                    key={`wp-${i}`}
                                    cx={getX(i)}
                                    cy={getPesoY(ev.peso)}
                                    r="3.5"
                                    fill="#3b82f6"
                                    stroke="#050912"
                                    strokeWidth="1.5"
                                  />
                                );
                              })}

                              {filteredEvaluaciones.map((ev, i) => {
                                if (!ev.porcentaje_grasa) return null;
                                return (
                                  <circle
                                    key={`gp-${i}`}
                                    cx={getX(i)}
                                    cy={getGrasaY(ev.porcentaje_grasa)}
                                    r="3.5"
                                    fill="#22c55e"
                                    stroke="#050912"
                                    strokeWidth="1.5"
                                  />
                                );
                              })}

                              {/* Etiquetas Eje Y Izquierdo (Peso) */}
                              {[minPeso, (minPeso + maxPeso) / 2, maxPeso].map((val, idx) => {
                                const y = getPesoY(val);
                                return (
                                  <text
                                    key={`ly-${idx}`}
                                    x={padL - 6}
                                    y={y + 3}
                                    fill="#4b5563"
                                    fontSize="8"
                                    fontWeight="bold"
                                    textAnchor="end"
                                  >
                                    {val.toFixed(0)}
                                  </text>
                                );
                              })}

                              {/* Etiquetas Eje Y Derecho (Grasa) */}
                              {[minGrasa, (minGrasa + maxGrasa) / 2, maxGrasa].map((val, idx) => {
                                const y = getGrasaY(val);
                                return (
                                  <text
                                    key={`ry-${idx}`}
                                    x={padL + chartW + 6}
                                    y={y + 3}
                                    fill="#4b5563"
                                    fontSize="8"
                                    fontWeight="bold"
                                    textAnchor="start"
                                  >
                                    {val.toFixed(0)}%
                                  </text>
                                );
                              })}

                              {/* Etiquetas Eje X (Fechas) */}
                              {filteredEvaluaciones.map((ev, i) => {
                                if (N > 5 && i % Math.ceil(N / 4) !== 0 && i !== N - 1) return null;
                                return (
                                  <text
                                    key={`x-${i}`}
                                    x={getX(i)}
                                    y={padT + chartH + 16}
                                    fill="#4b5563"
                                    fontSize="8"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                  >
                                    {formatDateLabel(ev.fecha)}
                                  </text>
                                );
                              })}
                            </svg>
                          );
                        })()
                      )}
                    </div>

                    {/* Botón ver todas las evaluaciones */}
                    <button
                      onClick={() => setView('evaluaciones')}
                      className="w-full mt-4 py-2.5 bg-[#050912] hover:bg-gray-900 border border-gray-900 hover:border-yellow-400/20 text-gray-400 hover:text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide font-rajdhani"
                    >
                      <span>Ver todas mis evaluaciones</span>
                      <ChevronRight size={14} className="text-yellow-400" />
                    </button>
                  </div>

                  {/* ── BOTÓN PRINCIPAL: MI RUTINA ── */}
                  <button
                    onClick={() => setShowRutina(true)}
                    disabled={!rutina}
                    className="w-full rounded-2xl relative overflow-hidden border border-gray-900/80 p-5 flex flex-col justify-between transition-all duration-200 active:scale-[0.98] text-left group min-h-[110px]"
                    style={{
                      backgroundImage: `linear-gradient(to right, rgba(7, 11, 19, 0.9) 30%, rgba(7, 11, 19, 0.4) 100%), url('https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="flex-1">
                      <h2 className="text-2xl font-black text-white font-rajdhani tracking-wider leading-none">
                        MI RUTINA
                      </h2>
                      <p className="text-[10px] text-gray-400 mt-1 max-w-[200px] leading-tight">
                        {rutina ? 'Sigue tu plan de entrenamiento y alcanza tus objetivos' : 'Tu entrenador aún no te ha asignado una rutina'}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between w-full">
                      {rutina ? (
                        isRutinaVencida(rutina.fecha_fin) ? (
                          <span className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                            ● Rutina vencida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/30 text-green-400 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                            ✓ Rutina Activa
                        </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-500/10 border border-gray-500/30 text-gray-400 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                          ● Sin rutina asignada
                        </span>
                      )}
                      {rutina && (
                        <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 shadow-md group-hover:translate-x-1 transition-transform shrink-0">
                          <ChevronRight size={18} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              )}

              {/* VISTA DIETA DETALLE */}
              {view === 'dieta' && (
                <div className="space-y-4 page-enter">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setView('home')}
                      className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h2 className="text-xl font-black text-white font-rajdhani uppercase tracking-wider">Mi Dieta</h2>
                  </div>

                  {!dieta ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-900/20 rounded-2xl border border-gray-900/60 p-6">
                      <Apple size={40} className="mx-auto mb-3 opacity-30 text-green-400" />
                      <p className="text-sm font-black text-white uppercase tracking-wider font-rajdhani">Sin dieta asignada</p>
                      <p className="text-xs text-gray-500 max-w-[220px] mx-auto leading-normal mt-1">
                        Tu entrenador aún no ha cargado tu plan nutricional personalizado.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dieta.archivo_url ? (
                        <a
                          href={dieta.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="flex items-center gap-4 bg-gradient-to-r from-gray-900 to-[#0b1322] border border-gray-900 hover:border-green-500/25 rounded-2xl p-4 transition-all duration-200 group active:scale-[0.99] shadow-md"
                        >
                          <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 text-green-400 shadow-md">
                            <Apple size={24} className="fill-green-400/5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white truncate font-rajdhani uppercase tracking-wide">
                              {fileName || 'MI DIETA PDF'}
                            </p>
                            <p className="text-[10px] text-green-400 font-extrabold mt-0.5 tracking-wider uppercase">
                              Toca para descargar / ver
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 text-green-400 group-hover:scale-105 transition-transform">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </div>
                        </a>
                      ) : (
                        <div className="bg-gray-900/30 border border-gray-900 rounded-2xl p-4 text-center">
                          <p className="text-xs text-gray-500 font-semibold">Sin archivo de dieta adjunto</p>
                        </div>
                      )}

                      {(dieta.descripcion || dieta.fecha_fin) && (
                        <div className="bg-[#0a0f1b] border border-gray-900 rounded-2xl overflow-hidden shadow-md">
                          {dieta.descripcion && (
                            <div className="p-4 border-b border-gray-900">
                              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                Descripción del plan
                              </p>
                              <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {dieta.descripcion}
                              </p>
                            </div>
                          )}
                          {dieta.fecha_fin && (
                            <div className="p-4 flex items-center justify-between">
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                Válida hasta
                              </span>
                              <span className="text-xs font-black text-white font-rajdhani tracking-wide bg-gray-900 px-3 py-1 rounded-lg border border-gray-900/60">
                                {new Date(dieta.fecha_fin + 'T12:00:00').toLocaleDateString('es-PE', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA DE HERRAMIENTAS SUB-MENÚ */}
              {view === 'herramientas' && (
                <div className="space-y-4 page-enter">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setView('home')}
                      className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h2 className="text-xl font-black text-white font-rajdhani uppercase tracking-wider">Herramientas</h2>
                  </div>
                  <p className="text-xs text-gray-500 leading-normal">
                    Accede a calculadoras y utilidades especializadas para dar seguimiento a tus entrenamientos y nutrición.
                  </p>

                  <div className="grid grid-cols-1 gap-3 mt-4">
                    <button
                      onClick={() => setView('macros')}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-900 to-[#0b1322] border border-gray-900 hover:border-yellow-400/25 transition-all duration-200 text-left shadow-md group active:scale-[0.99]"
                    >
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <Calculator size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-white text-base font-rajdhani uppercase tracking-wider">
                          Calculadora de Macros
                        </h3>
                        <p className="text-[10px] text-gray-500 leading-snug mt-0.5">
                          Establece tu ingesta de calorías y divide tus macronutrientes.
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-yellow-400 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      onClick={() => setView('onerm')}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-900 to-[#0b1322] border border-gray-900 hover:border-yellow-400/25 transition-all duration-200 text-left shadow-md group active:scale-[0.99]"
                    >
                      <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <Zap size={22} className="fill-yellow-400/5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-white text-base font-rajdhani uppercase tracking-wider">
                          Calculadora 1RM
                        </h3>
                        <p className="text-[10px] text-gray-500 leading-snug mt-0.5">
                          Calcula tu repetición máxima estimada para fuerza.
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-yellow-400 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      onClick={() => setView('exercises')}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-900 to-[#0b1322] border border-gray-900 hover:border-yellow-400/25 transition-all duration-200 text-left shadow-md group active:scale-[0.99]"
                    >
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <BookOpen size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-white text-base font-rajdhani uppercase tracking-wider">
                          Biblioteca de Ejercicios
                        </h3>
                        <p className="text-[10px] text-gray-500 leading-snug mt-0.5">
                          Guía visual de ejercicios con su ejecución correcta.
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-yellow-400 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      )}

      {/* SUPERPOSICIÓN DE PANTALLA COMPLETA PARA SUBVISTAS (Evaluaciones, calculadoras, etc.), dejando libre el tab bar */}
      {!['home', 'dieta', 'herramientas'].includes(view) && (
        <div className="fixed inset-0 z-20 max-w-lg mx-auto bg-[#070b13] overflow-y-auto pb-24 page-enter">
          {view === 'macros' && <MacroCalculator onClose={() => setView('home')} />}
          {view === 'exercises' && <ExerciseLibrary onClose={() => setView('home')} />}
          {view === 'onerm' && <OneRMCalculator onClose={() => setView('home')} />}
          {view === 'fitness' && <FitnessContent onBack={() => setView('home')} />}
          {view === 'xp' && profile && <XpStatusPage profile={profile as Profile} onBack={() => setView('home')} />}
          {view === 'evaluaciones' && profile && <EvaluacionList alumno={profile as Profile} onBack={() => setView('home')} readOnly />}
          {view === 'ajustes' && <ProfileSetupPage isEditing onDone={() => { setView('home'); refreshProfile(); }} />}
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN INFERIOR (TAB BAR STICKY) - Siempre visible */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-gray-950/95 backdrop-blur-md border-t border-gray-900 px-6 py-2 flex items-center justify-between z-30 pb-[max(8px,env(safe-area-inset-bottom,0px))]">
        <button
          onClick={() => { setView('home'); setShowRutina(false); }}
          className={`flex flex-col items-center gap-0.5 transition-all w-16 ${
            isHomeActive ? 'text-yellow-400 scale-105 font-extrabold' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Home size={18} className={isHomeActive ? 'fill-yellow-400/10' : ''} />
          <span className="text-[9px] font-black tracking-wider uppercase font-rajdhani">Inicio</span>
        </button>

        <button
          onClick={() => setView('evaluaciones')}
          className={`flex flex-col items-center gap-0.5 transition-all w-16 ${
            isProgresoActive ? 'text-yellow-400 scale-105 font-extrabold' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <TrendingUp size={18} />
          <span className="text-[9px] font-black tracking-wider uppercase font-rajdhani">Progreso</span>
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-frank-ai'))}
          className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-gray-300 transition-all w-16"
        >
          <MessageSquare size={18} />
          <span className="text-[9px] font-black tracking-wider uppercase font-rajdhani">Mensajes</span>
        </button>

        <button
          onClick={() => setView('ajustes')}
          className={`flex flex-col items-center gap-0.5 transition-all w-16 ${
            isAjustesActive ? 'text-yellow-400 scale-105 font-extrabold' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Settings size={18} />
          <span className="text-[9px] font-black tracking-wider uppercase font-rajdhani">Ajustes</span>
        </button>
      </footer>

      {/* MODAL IA CHAT */}
      <AIChatModal />
    </div>
  );
}