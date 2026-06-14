import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Dumbbell, ChevronRight, Check, Timer, Plus, Minus, Trophy, Star } from 'lucide-react';
import { supabase, RutinaAlumno, Ejercicio, TipoSerie, PlantillaEjercicio } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import EjercicioDetail from './EjercicioDetail';
import { ExerciseImg } from '../lib/ExerciseImg';

type Props = {
  rutina: RutinaAlumno;
  onBack: () => void;
  onFirstXp?: () => void;
};

type EjAlumno = {
  id: string;
  dia_id: string;
  ejercicio_id: string;
  orden: number;
  series: number | null;
  repeticiones: string | null;
  descanso_segundos: number | null;
  tipo: TipoSerie;
  grupo_serie: string | null;
  notas: string | null;
  ejercicio_alternativo: string | null;
  created_at: string;
  ejercicio?: Ejercicio;
  ejercicio_alternativo_obj?: Ejercicio | null;
};

type DiaConEj = {
  id: string;
  rutina_id: string;
  numero_dia: number;
  nombre_dia: string;
  created_at: string;
  ejercicios: EjAlumno[];
};

const GROUP_COLORS: Record<string, string> = {
  A: 'border-orange-500 bg-orange-500/10',
  B: 'border-blue-500 bg-blue-500/10',
  C: 'border-green-500 bg-green-500/10',
  D: 'border-purple-500 bg-purple-500/10',
};
const GROUP_BAR: Record<string, string> = {
  A: 'bg-orange-500',
  B: 'bg-blue-500',
  C: 'bg-green-500',
  D: 'bg-purple-500',
};
const TIPO_BADGE: Record<string, string> = {
  serie: 'bg-gray-700 text-gray-300',
  superserie: 'bg-orange-500/20 text-orange-300',
  dropset: 'bg-red-500/20 text-red-300',
  triserie: 'bg-blue-500/20 text-blue-300',
  circuito: 'bg-green-500/20 text-green-300',
};

function lsKey(rutinaId: string) {
  return `rutina_completados_${rutinaId}`;
}

function loadCompleted(rutinaId: string): Set<string> {
  try {
    const raw = localStorage.getItem(lsKey(rutinaId));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveCompleted(rutinaId: string, set: Set<string>) {
  localStorage.setItem(lsKey(rutinaId), JSON.stringify([...set]));
}

function groupEjercicios(ejercicios: EjAlumno[]): Array<EjAlumno | EjAlumno[]> {
  const result: Array<EjAlumno | EjAlumno[]> = [];
  const groupMap: Record<string, EjAlumno[]> = {};
  const seen = new Set<string>();

  for (const ej of ejercicios) {
    const needsGroup = ['superserie', 'triserie', 'circuito'].includes(ej.tipo);
    if (needsGroup && ej.grupo_serie) {
      if (!groupMap[ej.grupo_serie]) groupMap[ej.grupo_serie] = [];
      groupMap[ej.grupo_serie].push(ej);
    } else {
      result.push(ej);
    }
  }

  for (const ej of ejercicios) {
    const needsGroup = ['superserie', 'triserie', 'circuito'].includes(ej.tipo);
    if (needsGroup && ej.grupo_serie && !seen.has(ej.grupo_serie)) {
      seen.add(ej.grupo_serie);
      const idx = ejercicios.indexOf(ej);
      result.splice(idx, 0, groupMap[ej.grupo_serie]);
    }
  }

  return result.filter(item => {
    if (Array.isArray(item)) return true;
    const needsGroup = ['superserie', 'triserie', 'circuito'].includes(item.tipo);
    return !needsGroup || !item.grupo_serie;
  });
}

// ─── Rest Timer Component ─────────────────────────────────────────────────────

function RestTimer({ onClose }: { onClose: () => void }) {
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(true);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setFinished(true);
          if (typeof navigator.vibrate === 'function') {
            navigator.vibrate([200, 100, 200]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [running]);

  function adjust(delta: number) {
    setSeconds(prev => Math.max(0, Math.min(300, prev + delta)));
  }

  function restart() {
    setSeconds(60);
    setFinished(false);
    setRunning(true);
  }

  const pct = Math.min(100, (seconds / 60) * 100);
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference * (1 - pct / 100);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl p-6 pb-10"
        style={{ backgroundColor: '#0f172a', border: '1px solid rgba(250,204,21,0.2)', borderBottom: 'none' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Timer size={18} className="text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400 uppercase tracking-widest">Descanso</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-xs font-semibold uppercase tracking-wide">
            Cerrar
          </button>
        </div>

        {/* Circular timer */}
        <div className="flex justify-center mb-6">
          <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
            <svg width="160" height="160" className="absolute -rotate-90">
              <circle cx="80" cy="80" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="80" cy="80" r="44"
                fill="none"
                stroke={finished ? '#22c55e' : '#facc15'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
              />
            </svg>
            <div className="relative text-center">
              <p
                className="font-bold tabular-nums"
                style={{ fontSize: 40, lineHeight: 1, color: finished ? '#4ade80' : '#facc15', fontVariantNumeric: 'tabular-nums' }}
              >
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </p>
              {finished && <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mt-1">Listo!</p>}
            </div>
          </div>
        </div>

        {/* Adjust buttons */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => adjust(-30)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: '#9ca3af' }}
          >
            <Minus size={14} /> 30s
          </button>
          <button
            onClick={() => adjust(30)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            style={{ backgroundColor: 'rgba(250,204,21,0.1)', color: '#facc15' }}
          >
            <Plus size={14} /> 30s
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {finished ? (
            <button
              onClick={restart}
              className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
              style={{ backgroundColor: '#facc15', color: '#111827' }}
            >
              Reiniciar
            </button>
          ) : (
            <button
              onClick={() => setRunning(r => !r)}
              className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
              style={{ backgroundColor: running ? 'rgba(239,68,68,0.15)' : 'rgba(250,204,21,0.15)', color: running ? '#f87171' : '#facc15', border: `1px solid ${running ? 'rgba(239,68,68,0.3)' : 'rgba(250,204,21,0.3)'}` }}
            >
              {running ? 'Pausar' : 'Reanudar'}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Omitir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Exercise Card ───────────────────────────────────────────────────────────

function EjCard({
  ej, grp, isActive, completed, onToggle, onDetail, onTimerStart, timerActive,
}: {
  ej: EjAlumno;
  grp?: string;
  isActive: boolean;
  completed: boolean;
  onToggle: () => void;
  onDetail: () => void;
  onTimerStart: () => void;
  timerActive: boolean;
}) {
  return (
    <div
      className="flex-1 p-3 transition-colors"
      style={{
        backgroundColor: completed ? 'rgba(5, 46, 22, 0.6)' : 'rgba(17, 24, 39, 0.8)',
        opacity: isActive ? 1 : 0.7,
      }}
    >
      <div className="flex items-center gap-2">
        {/* Checkbox */}
        <button
          onClick={e => { e.stopPropagation(); onToggle(); }}
          style={{
            width: '28px',
            height: '28px',
            minWidth: '28px',
            borderRadius: '50%',
            border: completed ? '2px solid #22c55e' : '2px solid #9ca3af',
            backgroundColor: completed ? '#22c55e' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
        >
          {completed && <Check size={12} color="#fff" strokeWidth={3} />}
        </button>

        {/* Thumbnail + info */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {ej.ejercicio?.imagen_url ? (
            <ExerciseImg
            url={ej.ejercicio.imagen_url}
            alt=""
            className="w-9 h-9 rounded-lg object-cover shrink-0"
            containerClassName="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center shrink-0"
            fallbackSize={12}
          />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
              <Dumbbell size={12} className="text-gray-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-bold truncate transition-colors"
              style={{
                color: completed ? '#6b7280' : '#fff',
                textDecoration: completed ? 'line-through' : 'none',
              }}
            >
              {ej.ejercicio?.nombre}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {(ej.series || ej.repeticiones) && (
                <span className="text-[10px] text-gray-400">
                  {ej.series ? `${ej.series}×` : ''}{ej.repeticiones || ''}
                </span>
              )}
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${TIPO_BADGE[ej.tipo] || 'bg-gray-700 text-gray-300'}`}>
                {grp ? `${grp} · ${ej.tipo}` : ej.tipo}
              </span>
            </div>
          </div>
        </div>

        {/* Timer button */}
        <button
          onClick={e => { e.stopPropagation(); onTimerStart(); }}
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
          style={{
            backgroundColor: timerActive ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${timerActive ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: timerActive ? '#facc15' : '#6b7280',
          }}
          title="Iniciar descanso"
        >
          <Timer size={11} />
          <span style={{ fontSize: '9px', fontWeight: 700 }}>60s</span>
        </button>

        {/* Detail arrow */}
        <button
          onClick={e => { e.stopPropagation(); onDetail(); }}
          className="text-white hover:text-yellow-400 transition-colors p-1 shrink-0"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RutinaAlumnoKanban({ rutina, onBack, onFirstXp }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [dias, setDias] = useState<DiaConEj[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDia, setSelectedDia] = useState<string | null>(null);
  const [detailEj, setDetailEj] = useState<EjAlumno | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(() => loadCompleted(rutina.id));
  const [timerOpen, setTimerOpen] = useState(false);
  const [activeTimerEjId, setActiveTimerEjId] = useState<string | null>(null);
  const [xpModal, setXpModal] = useState<{ type: 'blocked' | 'earned' | 'bonus'; xp?: number } | null>(null);

  useEffect(() => { load(); }, [rutina.id]);

  async function load() {
    setLoading(true);
    const { data: diasData } = await supabase
      .from('rutina_alumno_dias')
      .select('*')
      .eq('rutina_id', rutina.id)
      .order('numero_dia', { ascending: true });

    if (!diasData || diasData.length === 0) { setDias([]); setLoading(false); return; }

    const diaIds = diasData.map(d => d.id);
    const { data: ejData } = await supabase
      .from('rutina_alumno_ejercicios')
      .select('*')
      .in('dia_id', diaIds)
      .order('orden', { ascending: true });

    const ejIds = [...new Set(ejData?.map(e => e.ejercicio_id) || [])];
    const altIds = [...new Set(ejData?.map(e => e.ejercicio_alternativo).filter(Boolean) || [])] as string[];
    const allIds = [...new Set([...ejIds, ...altIds])];

    let ejerciciosMap: Record<string, Ejercicio> = {};
    if (allIds.length > 0) {
      const { data: ejerciciosData } = await supabase.from('ejercicios').select('*').in('id', allIds);
      ejerciciosData?.forEach(e => { ejerciciosMap[e.id] = e; });
    }

    const ejByDia: Record<string, EjAlumno[]> = {};
    ejData?.forEach(e => {
      if (!ejByDia[e.dia_id]) ejByDia[e.dia_id] = [];
      ejByDia[e.dia_id].push({
        ...e,
        tipo: e.tipo as TipoSerie,
        ejercicio: ejerciciosMap[e.ejercicio_id],
        ejercicio_alternativo_obj: e.ejercicio_alternativo ? ejerciciosMap[e.ejercicio_alternativo] : null,
      });
    });

    const diasWithEj = diasData.map(d => ({ ...d, ejercicios: ejByDia[d.id] || [] }));
    setDias(diasWithEj);
    setSelectedDia(diasWithEj[0]?.id || null);
    setLoading(false);
  }

  const toggle = useCallback((ejId: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(ejId)) next.delete(ejId);
      else next.add(ejId);
      saveCompleted(rutina.id, next);
      return next;
    });
  }, [rutina.id]);

  function openTimer(ejId: string) {
    setActiveTimerEjId(ejId);
    setTimerOpen(true);
  }

  function closeTimer() {
    setTimerOpen(false);
    setActiveTimerEjId(null);
  }

  function xpToLevel(xp: number): number {
    if (xp >= 10000) return 8;
    if (xp >= 7500) return 7;
    if (xp >= 5000) return 6;
    if (xp >= 3000) return 5;
    if (xp >= 1500) return 4;
    if (xp >= 500) return 3;
    if (xp >= 100) return 2;
    return 1;
  }

  async function finalizarDia(dia: DiaConEj) {
    if (!user || !profile) return;
    const today = new Date().toISOString().split('T')[0];

    if (profile.last_workout_date === today) {
      setXpModal({ type: 'blocked' });
      return;
    }

    let xpGained = 50;
    const allDiasComplete = dias.every(d => {
      const total = d.ejercicios.length;
      const done = d.ejercicios.filter(e => completed.has(e.id)).length;
      return total > 0 && done === total;
    });
    if (allDiasComplete) xpGained += 100;

    const newXp = (profile.xp_points ?? 0) + xpGained;
    const newLevel = xpToLevel(newXp);

    await supabase.from('perfiles').update({
      xp_points: newXp,
      level: newLevel,
      last_workout_date: today,
    }).eq('id', user.id);

    if (allDiasComplete) {
      localStorage.removeItem(lsKey(rutina.id));
      setCompleted(new Set());
      setXpModal({ type: 'bonus', xp: xpGained });
    } else {
      setXpModal({ type: 'earned', xp: xpGained });
    }

    refreshProfile();
  }

  // Show exercise detail
  if (detailEj && detailEj.ejercicio) {
    const activeDia = dias.find(d => d.id === detailEj.dia_id);
    const siblings: PlantillaEjercicio[] = (activeDia?.ejercicios || []).map(e => ({
      id: e.id,
      dia_id: e.dia_id,
      ejercicio_id: e.ejercicio_id,
      orden: e.orden,
      series: e.series,
      repeticiones: e.repeticiones,
      descanso_segundos: e.descanso_segundos,
      tipo: e.tipo,
      grupo_serie: e.grupo_serie,
      notas: e.notas,
      ejercicio_alternativo_id: e.ejercicio_alternativo,
      created_at: e.created_at,
      ejercicio: e.ejercicio,
      ejercicio_alternativo: e.ejercicio_alternativo_obj,
    }));

    const pej: PlantillaEjercicio = siblings.find(s => s.id === detailEj.id) || {
      id: detailEj.id,
      dia_id: detailEj.dia_id,
      ejercicio_id: detailEj.ejercicio_id,
      orden: detailEj.orden,
      series: detailEj.series,
      repeticiones: detailEj.repeticiones,
      descanso_segundos: detailEj.descanso_segundos,
      tipo: detailEj.tipo,
      grupo_serie: detailEj.grupo_serie,
      notas: detailEj.notas,
      ejercicio_alternativo_id: detailEj.ejercicio_alternativo,
      created_at: detailEj.created_at,
      ejercicio: detailEj.ejercicio,
      ejercicio_alternativo: detailEj.ejercicio_alternativo_obj,
    };

    return (
      <EjercicioDetail
        ejercicioConfig={pej}
        onBack={() => setDetailEj(null)}
        showRegistro={true}
        siblings={siblings}
        onSelectSibling={sib => {
          const src = activeDia?.ejercicios.find(e => e.id === sib.id);
          if (src) setDetailEj(src);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors shrink-0">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] text-yellow-400 uppercase tracking-wider">Mi Rutina</p>
            <h2 className="text-sm font-bold text-white truncate">{rutina.nombre}</h2>
          </div>
        </div>
      </header>

      {/* Day tabs */}
      {dias.length > 0 && (
        <div className="bg-gray-900 border-b border-gray-800 overflow-x-auto shrink-0">
          <div className="flex gap-1 px-3 py-2 min-w-max">
            {dias.map(d => {
              const total = d.ejercicios.length;
              const done = d.ejercicios.filter(e => completed.has(e.id)).length;
              const allDone = total > 0 && done === total;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDia(d.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedDia === d.id
                      ? allDone ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900'
                      : allDone ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {allDone && <Check size={9} className="inline mr-1" strokeWidth={3} />}
                  DIA {d.numero_dia}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : dias.length === 0 ? (
          <div className="text-center py-16 text-gray-400 px-4">
            <Dumbbell size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold mb-1">Sin dias</p>
            <p className="text-xs text-gray-500">Esta rutina aun no tiene dias configurados</p>
          </div>
        ) : (
          <div className="h-full overflow-x-auto">
            <div className="flex gap-3 px-3 py-3 h-full" style={{ minWidth: `${dias.length * 85}vw` }}>
              {dias.map(dia => {
                const isActive = selectedDia === dia.id;
                const grouped = groupEjercicios(dia.ejercicios);
                const total = dia.ejercicios.length;
                const done = dia.ejercicios.filter(e => completed.has(e.id)).length;
                const pct = total > 0 ? (done / total) * 100 : 0;
                const allDone = total > 0 && done === total;

                return (
                  <div
                    key={dia.id}
                    className="shrink-0 flex flex-col"
                    style={{ width: '82vw', maxWidth: '360px' }}
                    onClick={() => setSelectedDia(dia.id)}
                  >
                    {/* Day header */}
                    <div className={`rounded-t-2xl px-4 pt-3 pb-2 ${isActive ? 'bg-yellow-400/10 border border-yellow-400/30 border-b-0' : 'bg-gray-800'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0">
                          <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-yellow-400' : 'text-gray-500'}`}>
                            DIA {dia.numero_dia}
                          </p>
                          <p className="text-sm font-bold text-white truncate">{dia.nombre_dia}</p>
                        </div>
                        {total > 0 && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              flexShrink: 0,
                              marginLeft: '8px',
                              backgroundColor: allDone ? 'rgba(34,197,94,0.15)' : 'rgba(55,65,81,1)',
                              color: allDone ? '#4ade80' : '#9ca3af',
                            }}
                          >
                            {done}/{total} ejercicios
                          </span>
                        )}
                      </div>
                      {/* Progress bar */}
                      {total > 0 && (
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#374151', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '9999px',
                              transition: 'width 0.3s ease',
                              width: `${pct}%`,
                              backgroundColor: allDone ? '#22c55e' : '#facc15',
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Exercises */}
                    <div
                      className={`flex-1 overflow-y-auto rounded-b-2xl p-3 space-y-2 ${isActive ? 'bg-gray-800/60' : 'bg-gray-800/30'}`}
                      style={{ maxHeight: 'calc(100vh - 220px)' }}
                    >
                      {grouped.map((item, idx) => {
                        if (Array.isArray(item)) {
                          const grp = item[0].grupo_serie || 'A';
                          const barClass = GROUP_BAR[grp] || GROUP_BAR.A;
                          const borderClass = GROUP_COLORS[grp] || GROUP_COLORS.A;
                          const allGroupDone = item.every(ej => completed.has(ej.id));
                          return (
                            <div
                              key={idx}
                              className={`rounded-xl border overflow-hidden transition-colors ${
                                allGroupDone ? 'border-green-700 bg-green-950/20' : borderClass
                              }`}
                            >
                              {item.map(ej => (
                                <div key={ej.id} className="flex items-stretch">
                                  <div className={`w-1 shrink-0 ${barClass}`} />
                                  <EjCard
                                    ej={ej}
                                    grp={grp}
                                    isActive={isActive}
                                    completed={completed.has(ej.id)}
                                    onToggle={() => toggle(ej.id)}
                                    onDetail={() => setDetailEj(ej)}
                                    onTimerStart={() => openTimer(ej.id)}
                                    timerActive={activeTimerEjId === ej.id && timerOpen}
                                  />
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <div
                            key={item.id}
                            className={`rounded-xl overflow-hidden border transition-all duration-300 ${
                              completed.has(item.id) ? 'border-green-700' :
                              activeTimerEjId === item.id && timerOpen ? 'border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.3)]' :
                              'border-transparent'
                            }`}
                          >
                            <EjCard
                              ej={item}
                              isActive={isActive}
                              completed={completed.has(item.id)}
                              onToggle={() => toggle(item.id)}
                              onDetail={() => setDetailEj(item)}
                              onTimerStart={() => openTimer(item.id)}
                              timerActive={activeTimerEjId === item.id && timerOpen}
                            />
                          </div>
                        );
                      })}
                      {dia.ejercicios.length === 0 && isActive && (
                        <p className="text-center text-xs text-gray-600 py-4">Sin ejercicios</p>
                      )}

                      {/* ── Finalizar Rutina del Día ── */}
                      {isActive && total > 0 && (
                        <button
                          onClick={e => { e.stopPropagation(); finalizarDia(dia); }}
                          className="w-full mt-3 py-4 rounded-2xl font-black text-base tracking-wide transition-all flex items-center justify-center gap-2.5 shrink-0"
                          style={allDone ? {
                            background: 'linear-gradient(135deg,#facc15 0%,#f59e0b 100%)',
                            color: '#111827',
                            boxShadow: '0 6px 28px rgba(250,204,21,0.45)',
                            border: 'none',
                          } : {
                            background: 'rgba(250,204,21,0.08)',
                            color: '#facc15',
                            border: '1.5px solid rgba(250,204,21,0.35)',
                          }}
                        >
                          <Trophy size={18} />
                          {allDone ? 'Finalizar Rutina del Día  +50 XP' : `Finalizar Rutina del Día  (${done}/${total})`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Rest Timer Modal */}
      {timerOpen && <RestTimer onClose={closeTimer} />}

      {/* XP Modal */}
      {xpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
          onClick={() => setXpModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-8 text-center"
            style={{ background: 'linear-gradient(160deg,#111827,#0f172a)', border: '1px solid rgba(250,204,21,0.3)', boxShadow: '0 0 60px rgba(250,204,21,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            {xpModal.type === 'blocked' ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto mb-4">
                  <Trophy size={32} className="text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">¡Gran esfuerzo!</h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Recuerda que solo se registra una sesion valida por dia para garantizar tu recuperacion. ¡Sigue asi manana!
                </p>
              </>
            ) : xpModal.type === 'bonus' ? (
              <>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg,#facc15,#f59e0b)', boxShadow: '0 0 30px rgba(250,204,21,0.55)' }}
                >
                  <Star size={32} color="#111827" fill="#111827" />
                </div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-1">¡Rutina Completa!</h3>
                <p className="text-5xl font-black text-white my-3">+{xpModal.xp} XP</p>
                <p className="text-xs text-gray-400 leading-relaxed">Incluye bono semanal de +100 XP. Los checks se reiniciaron para la siguiente semana.</p>
              </>
            ) : (
              <>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(250,204,21,0.12)', border: '2px solid rgba(250,204,21,0.4)' }}
                >
                  <Trophy size={32} className="text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">¡Sesion registrada!</h3>
                <p className="text-5xl font-black text-yellow-400 my-3">+{xpModal.xp} XP</p>
                <p className="text-xs text-gray-400">Sigue completando tus dias para ganar el bono semanal</p>
              </>
            )}
            <button
              onClick={() => {
                const isFirstTime = !profile?.xp_tour_completed && xpModal?.type !== 'blocked';
                setXpModal(null);
                if (isFirstTime && onFirstXp) onFirstXp();
              }}
              className="mt-6 w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
              style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15', border: '1px solid rgba(250,204,21,0.3)' }}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
