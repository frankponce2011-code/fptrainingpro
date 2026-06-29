import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Dumbbell, Clock, Loader2, CheckCircle } from 'lucide-react';
import { PlantillaEjercicio, Ejercicio, TipoSerie } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ExerciseImg } from '../lib/ExerciseImg';

type Props = {
  ejercicioConfig: PlantillaEjercicio;
  onBack: () => void;
  showRegistro?: boolean;
  siblings?: PlantillaEjercicio[];
  onSelectSibling?: (ej: PlantillaEjercicio) => void;
  rutinaId?: string;
};

const tipoColors: Record<TipoSerie, string> = {
  serie: 'bg-gray-700 text-gray-300',
  superserie: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
  dropset: 'bg-red-500/20 text-red-300 border border-red-500/40',
  triserie: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  circuito: 'bg-green-500/20 text-green-300 border border-green-500/40',
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

type SerieRow = { serie: number; peso: string; descanso: string; completada: boolean };

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function lsKey(ejercicioId: string) {
  return `registro_${ejercicioId}_${todayStr()}`;
}

function loadSeries(ejercicioId: string, numSeries: number): SerieRow[] {
  try {
    const raw = localStorage.getItem(lsKey(ejercicioId));
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.series) && data.series.length === numSeries) {
        return data.series.map((s: { serie: number; peso: number | null; descanso: number | null; completada: boolean }) => ({
          serie: s.serie,
          peso: s.peso != null ? String(s.peso) : '',
          descanso: s.descanso != null ? String(s.descanso) : '',
          completada: !!s.completada,
        }));
      }
    }
  } catch { /* ignore */ }
  return Array.from({ length: numSeries }, (_, i) => ({
    serie: i + 1,
    peso: '',
    descanso: '',
    completada: false,
  }));
}

function saveSeries(ejercicioId: string, nombre: string, rows: SerieRow[]) {
  const fecha = todayStr();
  localStorage.setItem(lsKey(ejercicioId), JSON.stringify({
    ejercicio_id: ejercicioId,
    ejercicio_nombre: nombre,
    fecha,
    series: rows.map(s => ({
      serie: s.serie,
      peso: s.peso !== '' ? parseFloat(s.peso) : null,
      descanso: s.descanso !== '' ? parseInt(s.descanso) : null,
      completada: s.completada,
    })),
  }));
}

// ─── Alt detail ───────────────────────────────────────────────────────────────

function AltEjercicioDetail({ ejercicio, onBack }: { ejercicio: Ejercicio; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Ejercicio alternativo</p>
            <h2 className="text-sm font-bold text-white">{ejercicio.nombre}</h2>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-8">
        {ejercicio.imagen_url && (
          <div className="w-full h-48 bg-slate-900">
            <ExerciseImg
              url={ejercicio.imagen_url}
              alt={ejercicio.nombre}
              className="w-full h-full object-contain"
              containerClassName="w-full h-48 bg-slate-900 flex items-center justify-center"
              fallbackSize={48}
            />
          </div>
        )}
        {ejercicio.youtube_url && (
          <div className="mx-4 mt-4">
            <a
              href={ejercicio.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                backgroundColor: '#EAB308', color: '#000000',
                padding: '12px 24px', borderRadius: '8px',
                fontWeight: 'bold', textDecoration: 'none',
                width: '100%', justifyContent: 'center',
              }}
            >
              ▶ Ver video en YouTube
            </a>
          </div>
        )}
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-white mb-1">{ejercicio.nombre}</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{ejercicio.grupo_muscular}</span>
          {ejercicio.descripcion && (
            <p className="text-sm text-gray-300 mt-4 leading-relaxed">{ejercicio.descripcion}</p>
          )}
          {ejercicio.musculos_secundarios && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Musculos secundarios</p>
              <p className="text-sm text-gray-400">{ejercicio.musculos_secundarios}</p>
            </div>
          )}
          {ejercicio.consejos && (
            <div className="mt-3 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
              <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider mb-1">Consejos</p>
              <p className="text-sm text-gray-300">{ejercicio.consejos}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EjercicioDetail({ ejercicioConfig, onBack, showRegistro = false, siblings, onSelectSibling, rutinaId }: Props) {
  const { profile } = useAuth();
  const ejercicio = ejercicioConfig.ejercicio!;
  const alt = ejercicioConfig.ejercicio_alternativo;
  const tipo = ejercicioConfig.tipo as TipoSerie;

  const numSeries = ejercicioConfig.series ?? 3;
  const [series, setSeries] = useState<SerieRow[]>(() => loadSeries(ejercicio.id, numSeries));
  const [showAlt, setShowAlt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
 useEffect(() => {
    async function cargarRegistro() {
      if (!profile?.id || !rutinaId) return;

      // 1. Intentar cargar el registro de HOY
      const { data: hoy } = await supabase
        .from('registro_ejercicios')
        .select('detalle_series, fecha')
        .eq('alumno_id', profile.id)
        .eq('rutina_id', rutinaId)
        .eq('ejercicio_id', ejercicio.id)
        .eq('fecha', todayStr())
        .maybeSingle();

      if (hoy?.detalle_series) {
        setSeries(
          hoy.detalle_series.map((s: { serie: number; peso: number | null; descanso: number | null; completada: boolean }) => ({
            serie: s.serie,
            peso: s.peso != null ? String(s.peso) : '',
            descanso: s.descanso != null ? String(s.descanso) : '',
            completada: !!s.completada,
          }))
        );
        return;
      }

      // 2. Si no hay registro de hoy, cargar el más reciente
      const { data: reciente } = await supabase
        .from('registro_ejercicios')
        .select('detalle_series, fecha')
        .eq('alumno_id', profile.id)
        .eq('rutina_id', rutinaId)
        .eq('ejercicio_id', ejercicio.id)
        .order('fecha', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (reciente?.detalle_series) {
        setSeries(
          reciente.detalle_series.map((s: { serie: number; peso: number | null; descanso: number | null; completada: boolean }) => ({
            serie: s.serie,
            peso: s.peso != null ? String(s.peso) : '',
            descanso: s.descanso != null ? String(s.descanso) : '',
            completada: false, // nuevo día = sin completar
          }))
        );
      }
    }

    cargarRegistro();
  }, [profile?.id, rutinaId, ejercicio.id]);

  if (showAlt && alt) {
    return <AltEjercicioDetail ejercicio={alt} onBack={() => setShowAlt(false)} />;
  }

  function updateSerie(idx: number, field: 'peso' | 'descanso' | 'completada', value: string | boolean) {
    setSeries(prev => {
      const next = prev.map((s, i) => i === idx ? { ...s, [field]: value } : s);
      saveSeries(ejercicio.id, ejercicio.nombre, next);
      return next;
    });
  }

  async function guardarRegistro() {
    if (!profile || !rutinaId || saving) return;
    setSaving(true);
    setSaved(false);
    setSaveError('');

    try {
      const detalle = series.map(s => ({
        serie: s.serie,
        peso: s.peso !== '' ? parseFloat(s.peso) : null,
        descanso: s.descanso !== '' ? parseInt(s.descanso) : null,
        completada: s.completada,
      }));

      const { error } = await supabase
        .from('registro_ejercicios')
        .upsert(
          {
            alumno_id: profile.id,
            rutina_id: rutinaId,
            ejercicio_id: ejercicio.id,
            fecha: todayStr(),
            series_completadas: series.filter(s => s.completada).length,
            detalle_series: detalle,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'alumno_id,rutina_id,ejercicio_id,fecha' },
        );

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar el progreso');
    } finally {
      setSaving(false);
    }
  }

  const completadas = series.filter(s => s.completada).length;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-yellow-400 uppercase tracking-wider">Ejercicio</p>
            <h2 className="text-sm font-bold text-white truncate">{ejercicio.nombre}</h2>
          </div>
        </div>
      </header>

      {/* Sibling carousel */}
      {siblings && siblings.length > 1 && (
        <div className="bg-gray-900 border-b border-gray-800 overflow-x-auto shrink-0">
          <div className="flex gap-3 px-4 py-3 min-w-max">
            {siblings.map(sib => {
              const isActive = sib.id === ejercicioConfig.id;
              return (
                <button
                  key={sib.id}
                  onClick={() => !isActive && onSelectSibling?.(sib)}
                  className="flex flex-col items-center gap-1.5 shrink-0 transition-all"
                  title={sib.ejercicio?.nombre}
                >
                  <div
                    className="w-11 h-11 rounded-full overflow-hidden shrink-0 transition-all"
                    style={{
                      border: isActive ? '2.5px solid #f59e0b' : '2px solid rgba(255,255,255,0.1)',
                      boxShadow: isActive ? '0 0 10px rgba(245,158,11,0.5)' : 'none',
                      opacity: isActive ? 1 : 0.55,
                    }}
                  >
                    {sib.ejercicio?.imagen_url ? (
                      <ExerciseImg
                        url={sib.ejercicio.imagen_url}
                        alt=""
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full bg-gray-700 flex items-center justify-center"
                        fallbackSize={14}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <Dumbbell size={14} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                  <span
                    className="text-[8px] font-bold max-w-[44px] text-center leading-tight truncate"
                    style={{ color: isActive ? '#f59e0b' : '#6b7280' }}
                  >
                    {sib.ejercicio?.nombre?.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-8">
        {ejercicio.imagen_url ? (
          <div className="w-full h-52 bg-slate-900">
            <ExerciseImg
              url={ejercicio.imagen_url}
              alt={ejercicio.nombre}
              className="w-full h-52 object-contain"
              containerClassName="w-full h-52 bg-slate-900 flex items-center justify-center"
              fallbackSize={48}
            />
          </div>
        ) : (
          <div className="w-full h-52 bg-gray-800 flex items-center justify-center">
            <Dumbbell size={48} className="text-gray-600" />
          </div>
        )}

        {ejercicio.youtube_url && (
          <a
            href={ejercicio.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#EAB308', color: '#000000',
              padding: '12px 24px', borderRadius: '8px',
              fontWeight: 'bold', textDecoration: 'none',
              width: '100%', justifyContent: 'center',
            }}
          >
            ▶ Ver video
          </a>
        )}

        <div className="px-4 py-4 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-rajdhani mb-2">{ejercicio.nombre}</h1>
            <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${tipoColors[tipo]}`}>
              {tipo}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {ejercicioConfig.series != null && (
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{ejercicioConfig.series}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Series</p>
              </div>
            )}
            {ejercicioConfig.repeticiones && (
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-white">{ejercicioConfig.repeticiones}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Reps</p>
              </div>
            )}
            {ejercicioConfig.descanso_segundos != null && (
              <div className="bg-gray-800 rounded-xl p-3 text-center flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-blue-400" />
                  <p className="text-xl font-bold text-white">{ejercicioConfig.descanso_segundos}s</p>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Descanso</p>
              </div>
            )}
          </div>

          {ejercicioConfig.notas && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
              <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wider mb-1">Notas del entrenador</p>
              <p className="text-sm text-gray-300">{ejercicioConfig.notas}</p>
            </div>
          )}

          {ejercicio.descripcion && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Descripcion</p>
              <p className="text-sm text-gray-300 leading-relaxed">{ejercicio.descripcion}</p>
            </div>
          )}

          {ejercicio.consejos && (
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Consejos</p>
              <p className="text-sm text-gray-400">{ejercicio.consejos}</p>
            </div>
          )}

          {alt && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Ejercicio alternativo</p>
              <button
                onClick={() => setShowAlt(true)}
                className="w-full bg-gray-800 hover:bg-gray-700 rounded-xl p-3 flex items-center gap-3 transition-colors text-left"
              >
                {alt.imagen_url ? (
                  <ExerciseImg
                  url={alt.imagen_url}
                  alt={alt.nombre}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                  containerClassName="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center shrink-0"
                  fallbackSize={16}
                />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
                    <Dumbbell size={16} className="text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{alt.nombre}</p>
                  <p className="text-xs text-gray-500">{alt.grupo_muscular}</p>
                </div>
                <ArrowLeft size={14} className="text-gray-500 rotate-180 shrink-0" />
              </button>
            </div>
          )}

          {/* ── Registro section ── */}
          {showRegistro && (
            <div className="border-t border-gray-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Registrar mi sesion</p>
                <span className="text-[10px] text-gray-600">{todayStr()}</span>
              </div>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 1fr 36px', gap: '8px', padding: '0 4px', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}></span>
                <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', textAlign: 'center' }}>Peso (kg)</span>
                <span style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', textAlign: 'center' }}>Desc. (s)</span>
                <span></span>
              </div>

              {/* Serie rows */}
              {series.map((s, i) => (
                <div
                  key={s.serie}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '64px 1fr 1fr 36px',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '10px 4px',
                    marginBottom: '6px',
                    borderRadius: '12px',
                    backgroundColor: s.completada ? 'rgba(5,46,22,0.5)' : 'rgba(31,41,55,0.5)',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: s.completada ? '#4ade80' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Serie {s.serie}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    value={s.peso}
                    onChange={e => updateSerie(i, 'peso', e.target.value)}
                    placeholder="0"
                    style={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      padding: '8px 6px',
                      color: '#fff',
                      fontSize: '14px',
                      textAlign: 'center',
                      width: '100%',
                      outline: 'none',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#facc15')}
                    onBlur={e => (e.target.style.borderColor = '#374151')}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.descanso}
                    onChange={e => updateSerie(i, 'descanso', e.target.value)}
                    placeholder="90"
                    style={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      padding: '8px 6px',
                      color: '#fff',
                      fontSize: '14px',
                      textAlign: 'center',
                      width: '100%',
                      outline: 'none',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#facc15')}
                    onBlur={e => (e.target.style.borderColor = '#374151')}
                  />
                  <button
                    onClick={() => updateSerie(i, 'completada', !s.completada)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: s.completada ? '2px solid #22c55e' : '2px solid #6b7280',
                      backgroundColor: s.completada ? '#22c55e' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    {s.completada && <Check size={14} color="#fff" strokeWidth={3} />}
                  </button>
                </div>
              ))}

              {/* Progress summary */}
              <div className="mt-2 bg-gray-800 rounded-xl p-3">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>Progreso de hoy</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: completadas === numSeries ? '#4ade80' : '#facc15' }}>
                    {completadas}/{numSeries} series
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#374151', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: '9999px',
                      transition: 'width 0.3s ease',
                      width: `${numSeries > 0 ? (completadas / numSeries) * 100 : 0}%`,
                      backgroundColor: completadas === numSeries ? '#22c55e' : '#facc15',
                    }}
                  />
                </div>
              </div>

              {/* Guardar progreso */}
              {rutinaId && (
                <div className="mt-4 space-y-2">
                  {saveError && (
                    <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-400">{saveError}</p>
                    </div>
                  )}
                  <button
                    onClick={guardarRegistro}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: saved ? '#22c55e' : '#facc15',
                      color: '#111827',
                    }}
                  >
                    {saving ? (
                      <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                    ) : saved ? (
                      <><CheckCircle size={16} /> Progreso guardado</>
                    ) : (
                      'Guardar progreso'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


