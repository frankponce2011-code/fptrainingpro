import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Plus, Save, Search, X, Trash2, Edit3, Dumbbell, ChevronRight,
} from 'lucide-react';
import { supabase, Ejercicio, TipoSerie, PlantillaEjercicio } from '../lib/supabase';
import { ExerciseImg } from '../lib/ExerciseImg';
import EjercicioDetail from './EjercicioDetail';

type Props = {
  rutinaId: string;
  rutinaNombre: string;
  alumnoId: string;
  alumnoNombre: string;
  onBack: () => void;
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
const TIPOS: TipoSerie[] = ['serie', 'superserie', 'dropset', 'triserie', 'circuito'];

function groupEjercicios(ejercicios: EjAlumno[]): Array<EjAlumno | EjAlumno[]> {
  const result: Array<EjAlumno | EjAlumno[]> = [];
  const groupMap: Record<string, EjAlumno[]> = {};
  const seen = new Set<string>();
  for (const ej of ejercicios) {
    const needsGroup = ['superserie', 'triserie', 'circuito'].includes(ej.tipo);
    if (needsGroup && ej.grupo_serie) {
      if (!groupMap[ej.grupo_serie]) groupMap[ej.grupo_serie] = [];
      groupMap[ej.grupo_serie].push(ej);
    } else { result.push(ej); }
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

function EjercicioPicker({ onSelect, onClose }: { onSelect: (e: Ejercicio) => void; onClose: () => void }) {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('ejercicios').select('*').order('grupo_muscular').then(({ data }) => {
      setEjercicios(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = ejercicios.filter(e =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    e.grupo_muscular.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col z-50 max-w-lg mx-auto">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        <h3 className="text-sm font-bold text-white">Seleccionar ejercicio</h3>
      </div>
      <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            autoFocus className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8"><span className="w-8 h-8 animate-spin border-2 border-yellow-400 border-t-transparent rounded-full block mx-auto" /></div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map(e => (
              <button key={e.id} onClick={() => onSelect(e)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left">
                <ExerciseImg url={e.imagen_url} alt={e.nombre}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                  containerClassName="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center shrink-0"
                  fallbackSize={14} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{e.nombre}</p>
                  <p className="text-xs text-gray-500">{e.grupo_muscular}</p>
                </div>
                <ChevronRight size={14} className="text-gray-600 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type EjConfig = {
  ejercicio_id: string;
  ejercicio: Ejercicio;
  series: number | null;
  repeticiones: string | null;
  descanso_segundos: number | null;
  tipo: TipoSerie;
  grupo_serie: string | null;
  notas: string | null;
  ejercicio_alternativo: Ejercicio | null;
};

function EjercicioConfigModal({ ejercicio, existing, onSave, onClose }: {
  ejercicio: Ejercicio;
  existing?: EjAlumno | null;
  onSave: (cfg: EjConfig) => void;
  onClose: () => void;
}) {
  const [series, setSeries] = useState(existing?.series?.toString() || '');
  const [repeticiones, setRepeticiones] = useState(existing?.repeticiones || '');
  const [descanso, setDescanso] = useState(existing?.descanso_segundos?.toString() || '');
  const [tipo, setTipo] = useState<TipoSerie>(existing?.tipo || 'serie');
  const [grupo, setGrupo] = useState(existing?.grupo_serie || '');
  const [notas, setNotas] = useState(existing?.notas || '');
  const [altEjercicio, setAltEjercicio] = useState<Ejercicio | null>(existing?.ejercicio_alternativo_obj || null);
  const [showAltPicker, setShowAltPicker] = useState(false);
  const [showMainPicker, setShowMainPicker] = useState(false);
  const [mainEjercicio, setMainEjercicio] = useState<Ejercicio>(ejercicio);
  const needsGroup = tipo !== 'serie' && tipo !== 'dropset';

  if (showMainPicker) return <EjercicioPicker onSelect={e => { setMainEjercicio(e); setShowMainPicker(false); }} onClose={() => setShowMainPicker(false)} />;
  if (showAltPicker) return <EjercicioPicker onSelect={e => { setAltEjercicio(e); setShowAltPicker(false); }} onClose={() => setShowAltPicker(false)} />;

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col z-50 max-w-lg mx-auto">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-500">Configurar ejercicio</p>
          <h3 className="text-sm font-bold text-white truncate">{mainEjercicio.nombre}</h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-2">Ejercicio</label>
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
            <ExerciseImg url={mainEjercicio.imagen_url} alt={mainEjercicio.nombre}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
              containerClassName="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center shrink-0"
              fallbackSize={16} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{mainEjercicio.nombre}</p>
              <p className="text-xs text-gray-500">{mainEjercicio.grupo_muscular}</p>
            </div>
            <button onClick={() => setShowMainPicker(true)}
              className="px-3 py-1.5 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 text-xs font-bold rounded-lg transition-colors shrink-0">
              Cambiar
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">Series</label>
            <input type="number" value={series} onChange={e => setSeries(e.target.value)} placeholder="4"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">Repeticiones</label>
            <input type="text" value={repeticiones} onChange={e => setRepeticiones(e.target.value)} placeholder="12 o 12-10-8"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1.5">Descanso (segundos)</label>
          <input type="number" value={descanso} onChange={e => setDescanso(e.target.value)} placeholder="90"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-2">Tipo</label>
          <div className="flex flex-wrap gap-2">
            {TIPOS.map(t => (
              <button key={t} onClick={() => setTipo(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
                  tipo === t ? `${TIPO_BADGE[t]} ring-1 ring-white/20` : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {needsGroup && (
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">Grupo (A, B, C…)</label>
            <input type="text" value={grupo} onChange={e => setGrupo(e.target.value.toUpperCase())}
              placeholder="A" maxLength={1}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1.5">Notas (opcional)</label>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
            placeholder="Indicaciones especiales..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400 resize-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-2">Ejercicio alternativo (opcional)</label>
          {altEjercicio ? (
            <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
              <ExerciseImg url={altEjercicio.imagen_url} alt={altEjercicio.nombre}
                className="w-9 h-9 rounded-lg object-cover shrink-0"
                containerClassName="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center shrink-0"
                fallbackSize={14} />
              <p className="flex-1 text-sm text-white font-semibold truncate">{altEjercicio.nombre}</p>
              <button onClick={() => setAltEjercicio(null)} className="text-gray-500 hover:text-red-400 p-1"><X size={14} /></button>
            </div>
          ) : (
            <button onClick={() => setShowAltPicker(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 border border-gray-700 border-dashed rounded-xl text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
              <Plus size={14} /> Agregar alternativo
            </button>
          )}
        </div>
      </div>
      <div className="px-4 py-4 bg-gray-900 border-t border-gray-800 shrink-0">
        <button onClick={() => onSave({
          ejercicio_id: mainEjercicio.id, ejercicio: mainEjercicio,
          series: series ? parseInt(series) : null,
          repeticiones: repeticiones || null,
          descanso_segundos: descanso ? parseInt(descanso) : null,
          tipo, grupo_serie: needsGroup && grupo ? grupo : null,
          notas: notas || null, ejercicio_alternativo: altEjercicio,
        })} className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2">
          <Save size={16} /> Guardar ejercicio
        </button>
      </div>
    </div>
  );
}

function EjCard({ ej, grp, isActive, onEdit, onDelete, onDetail }: {
  ej: EjAlumno; grp?: string; isActive: boolean;
  onEdit: () => void; onDelete: () => void; onDetail: () => void;
}) {
  return (
    <div className="flex-1 p-3 bg-gray-900/80">
      <div className="flex items-center gap-2 min-w-0">
        {ej.ejercicio?.imagen_url ? (
          <ExerciseImg url={ej.ejercicio.imagen_url} alt=""
            className="w-9 h-9 rounded-lg object-cover shrink-0"
            containerClassName="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center shrink-0"
            fallbackSize={12} />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
            <Dumbbell size={12} className="text-gray-500" />
          </div>
        )}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={e => { e.stopPropagation(); onDetail(); }}>
          <p className="text-xs font-bold text-white truncate">{ej.ejercicio?.nombre}</p>
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
        {isActive && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={e => { e.stopPropagation(); onEdit(); }}
              className="p-1 text-gray-600 hover:text-yellow-400 rounded transition-colors">
              <Edit3 size={12} />
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              className="p-1 text-gray-600 hover:text-red-400 rounded transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AlumnoRutinaEditor({ rutinaId, rutinaNombre, alumnoId, alumnoNombre, onBack }: Props) {
  const [dias, setDias] = useState<DiaConEj[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDia, setSelectedDia] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [nombreActual, setNombreActual] = useState(rutinaNombre);
  const [editingNombre, setEditingNombre] = useState(false);
  const [tempNombre, setTempNombre] = useState('');

  const [showAddDay, setShowAddDay] = useState(false);
  const [addDayNum, setAddDayNum] = useState('');
  const [addDayNombre, setAddDayNombre] = useState('');
  const [savingDay, setSavingDay] = useState(false);
  const [editingDiaId, setEditingDiaId] = useState<string | null>(null);
  const [tempDiaNombre, setTempDiaNombre] = useState('');
  const [deleteDiaTarget, setDeleteDiaTarget] = useState<DiaConEj | null>(null);

  const [showEjPicker, setShowEjPicker] = useState(false);
  const [pendingEjercicio, setPendingEjercicio] = useState<Ejercicio | null>(null);
  const [editingEj, setEditingEj] = useState<EjAlumno | null>(null);
  const [deleteEjTarget, setDeleteEjTarget] = useState<EjAlumno | null>(null);
  const [detailEj, setDetailEj] = useState<EjAlumno | null>(null);

  function handleSelectDia(diaId: string, index: number) {
    setSelectedDia(diaId);
    requestAnimationFrame(() => {
      const cardEl = cardRefs.current[index];
      const container = containerRef.current;
      if (cardEl && container) {
        const containerWidth = container.offsetWidth;
        const cardWidth = cardEl.offsetWidth;
        const cardLeft = cardEl.offsetLeft;
        container.scrollTo({ left: cardLeft - (containerWidth / 2) + (cardWidth / 2), behavior: 'smooth' });
      }
    });
  }

  useEffect(() => { load(); }, [rutinaId]);

  async function load() {
    setLoading(true);
    const { data: diasData } = await supabase
      .from('rutina_alumno_dias').select('*')
      .eq('rutina_id', rutinaId).order('numero_dia', { ascending: true });

    if (!diasData || diasData.length === 0) { setDias([]); setLoading(false); return; }

    const diaIds = diasData.map(d => d.id);
    const { data: ejData } = await supabase
      .from('rutina_alumno_ejercicios').select('*')
      .in('dia_id', diaIds).order('orden', { ascending: true });

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
    if (!selectedDia) setSelectedDia(diasWithEj[0]?.id || null);
    setLoading(false);
  }

  async function handleSaveNombre() {
    if (!tempNombre.trim()) return;
    await supabase.from('rutinas_alumno').update({ nombre: tempNombre.trim() }).eq('id', rutinaId);
    setNombreActual(tempNombre.trim());
    setEditingNombre(false);
  }

  async function handleAddDay() {
    if (!addDayNum || !addDayNombre.trim()) return;
    setSavingDay(true);
    const { data } = await supabase.from('rutina_alumno_dias').insert({
      rutina_id: rutinaId,
      numero_dia: parseInt(addDayNum),
      nombre_dia: addDayNombre.trim(),
    }).select().single();
    setSavingDay(false);
    if (data) { setShowAddDay(false); setAddDayNum(''); setAddDayNombre(''); load(); }
  }

  async function handleUpdateDiaNombre(diaId: string) {
    if (!tempDiaNombre.trim()) return;
    await supabase.from('rutina_alumno_dias').update({ nombre_dia: tempDiaNombre.trim() }).eq('id', diaId);
    setDias(prev => prev.map(d => d.id === diaId ? { ...d, nombre_dia: tempDiaNombre.trim() } : d));
    setEditingDiaId(null);
  }

  async function handleDeleteDia(dia: DiaConEj) {
    await supabase.from('rutina_alumno_dias').delete().eq('id', dia.id);
    setDeleteDiaTarget(null);
    const remaining = dias.filter(d => d.id !== dia.id);
    setDias(remaining);
    setSelectedDia(remaining[0]?.id || null);
  }

  async function handleSaveEjercicio(cfg: EjConfig) {
    if (!selectedDia) return;
    const diaObj = dias.find(d => d.id === selectedDia)!;
    const payload = {
      dia_id: selectedDia,
      ejercicio_id: cfg.ejercicio_id,
      orden: editingEj?.orden ?? diaObj.ejercicios.length,
      series: cfg.series,
      repeticiones: cfg.repeticiones,
      descanso_segundos: cfg.descanso_segundos,
      tipo: cfg.tipo,
      grupo_serie: cfg.grupo_serie,
      notas: cfg.notas,
      ejercicio_alternativo: cfg.ejercicio_alternativo?.id ?? null,
    };
    if (editingEj) {
      await supabase.from('rutina_alumno_ejercicios').update(payload).eq('id', editingEj.id);
    } else {
      await supabase.from('rutina_alumno_ejercicios').insert(payload);
    }
    setPendingEjercicio(null);
    setEditingEj(null);
    load();
  }

  async function handleDeleteEjercicio(ej: EjAlumno) {
    await supabase.from('rutina_alumno_ejercicios').delete().eq('id', ej.id);
    setDeleteEjTarget(null);
    load();
  }

  if (detailEj && detailEj.ejercicio) {
    const activeDia = dias.find(d => d.id === detailEj.dia_id);
    const siblings: PlantillaEjercicio[] = (activeDia?.ejercicios || []).map(e => ({
      id: e.id, dia_id: e.dia_id, ejercicio_id: e.ejercicio_id, orden: e.orden,
      series: e.series, repeticiones: e.repeticiones, descanso_segundos: e.descanso_segundos,
      tipo: e.tipo, grupo_serie: e.grupo_serie, notas: e.notas,
      ejercicio_alternativo_id: e.ejercicio_alternativo, created_at: e.created_at,
      ejercicio: e.ejercicio, ejercicio_alternativo: e.ejercicio_alternativo_obj,
    }));
    const pej = siblings.find(s => s.id === detailEj.id) || siblings[0];
    return <EjercicioDetail ejercicioConfig={pej} onBack={() => setDetailEj(null)} showRegistro={false} />;
  }

  return (
    <>
      {showAddDay && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 max-w-lg mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-t-2xl w-full p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Agregar día</h3>
              <button onClick={() => setShowAddDay(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Número de día</label>
                <input type="number" min={1} max={7} value={addDayNum} onChange={e => setAddDayNum(e.target.value)}
                  placeholder="ej. 1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Nombre del día</label>
                <input type="text" value={addDayNombre} onChange={e => setAddDayNombre(e.target.value)}
                  placeholder="ej. Pecho y Tríceps"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
              </div>
            </div>
            <button onClick={handleAddDay} disabled={savingDay || !addDayNum || !addDayNombre.trim()}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-xl disabled:opacity-40">
              {savingDay ? 'Guardando...' : 'Agregar día'}
            </button>
          </div>
        </div>
      )}

      {deleteDiaTarget && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 max-w-lg mx-auto px-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full">
            <Trash2 size={36} className="text-red-400 mb-3 mx-auto" />
            <h3 className="text-base font-bold text-white text-center mb-1">Eliminar día</h3>
            <p className="text-sm text-gray-400 text-center mb-1">DIA {deleteDiaTarget.numero_dia} — {deleteDiaTarget.nombre_dia}</p>
            <p className="text-xs text-red-400 text-center mb-5">Se eliminarán todos sus ejercicios</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteDiaTarget(null)} className="flex-1 py-2.5 bg-gray-800 rounded-xl text-sm font-semibold text-gray-300">Cancelar</button>
              <button onClick={() => handleDeleteDia(deleteDiaTarget)} className="flex-1 py-2.5 bg-red-600 rounded-xl text-sm font-semibold text-white">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {deleteEjTarget && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 max-w-lg mx-auto px-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full">
            <Trash2 size={36} className="text-red-400 mb-3 mx-auto" />
            <h3 className="text-base font-bold text-white text-center mb-1">Eliminar ejercicio</h3>
            <p className="text-sm text-gray-400 text-center mb-5">{deleteEjTarget.ejercicio?.nombre}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteEjTarget(null)} className="flex-1 py-2.5 bg-gray-800 rounded-xl text-sm font-semibold text-gray-300">Cancelar</button>
              <button onClick={() => handleDeleteEjercicio(deleteEjTarget)} className="flex-1 py-2.5 bg-red-600 rounded-xl text-sm font-semibold text-white">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showEjPicker && (
        <EjercicioPicker
          onSelect={e => { setPendingEjercicio(e); setShowEjPicker(false); }}
          onClose={() => { setShowEjPicker(false); setEditingEj(null); }}
        />
      )}

      {pendingEjercicio && (
        <EjercicioConfigModal
          ejercicio={pendingEjercicio}
          existing={editingEj}
          onSave={handleSaveEjercicio}
          onClose={() => { setPendingEjercicio(null); setEditingEj(null); }}
        />
      )}

      <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors shrink-0">
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-yellow-400 uppercase tracking-wider">{alumnoNombre}</p>
                {editingNombre ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <input type="text" value={tempNombre} onChange={e => setTempNombre(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveNombre(); if (e.key === 'Escape') setEditingNombre(false); }}
                      autoFocus
                      className="flex-1 bg-gray-800 border border-yellow-400 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none" />
                    <button onClick={handleSaveNombre} className="text-xs font-bold text-yellow-400 shrink-0">OK</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group cursor-pointer"
                    onClick={() => { setTempNombre(nombreActual); setEditingNombre(true); }}>
                    <h2 className="text-sm font-bold text-white truncate">{nombreActual}</h2>
                    <Edit3 size={11} className="text-gray-500 opacity-60 group-hover:opacity-100 shrink-0" />
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setShowAddDay(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0">
              <Plus size={14} /> Día
            </button>
          </div>
        </header>

        {dias.length > 0 && (
          <div className="bg-gray-900 border-b border-gray-800 overflow-x-auto shrink-0">
            <div className="flex gap-1 px-3 py-2 min-w-max">
              {dias.map((d, idx) => (
                <button key={d.id} onClick={() => handleSelectDia(d.id, idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedDia === d.id ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}>
                  DIA {d.numero_dia}
                </button>
              ))}
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
              <p className="font-semibold mb-1">Sin días</p>
              <button onClick={() => setShowAddDay(true)}
                className="mt-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold">
                Agregar primer día
              </button>
            </div>
          ) : (
            <div className="h-full overflow-x-auto" ref={containerRef}>
              <div className="flex gap-3 px-3 py-3 h-full" style={{ minWidth: `${dias.length * 85}vw` }}>
                {dias.map((dia, idx) => {
                  const isActive = selectedDia === dia.id;
                  const grouped = groupEjercicios(dia.ejercicios);
                  return (
                    <div key={dia.id} ref={el => (cardRefs.current[idx] = el)}
                      className="shrink-0 flex flex-col" style={{ width: '95vw', maxWidth: '100%' }}
                      onClick={() => handleSelectDia(dia.id, idx)}>

                      <div className={`rounded-t-2xl px-4 pt-3 pb-2 flex items-center justify-between ${isActive ? 'bg-yellow-400/10 border border-yellow-400/30 border-b-0' : 'bg-gray-800'}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-yellow-400' : 'text-gray-500'}`}>
                            DIA {dia.numero_dia}
                          </p>
                          {editingDiaId === dia.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input type="text" value={tempDiaNombre} onChange={e => setTempDiaNombre(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleUpdateDiaNombre(dia.id); if (e.key === 'Escape') setEditingDiaId(null); }}
                                autoFocus
                                className="flex-1 bg-gray-900 border border-yellow-400 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none" />
                              <button onClick={e => { e.stopPropagation(); handleUpdateDiaNombre(dia.id); }}
                                className="text-xs font-bold text-yellow-400 shrink-0">OK</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 group cursor-pointer mt-0.5"
                              onClick={e => { e.stopPropagation(); setEditingDiaId(dia.id); setTempDiaNombre(dia.nombre_dia); }}>
                              <p className="text-sm font-bold text-white truncate">{dia.nombre_dia}</p>
                              <Edit3 size={11} className="text-gray-500 opacity-60 group-hover:opacity-100 shrink-0" />
                            </div>
                          )}
                        </div>
                        {isActive && editingDiaId !== dia.id && (
                          <button onClick={e => { e.stopPropagation(); setDeleteDiaTarget(dia); }}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors shrink-0">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className={`flex-1 overflow-y-auto rounded-b-2xl p-3 space-y-2 ${isActive ? 'bg-gray-800/60' : 'bg-gray-800/30'}`}
                        style={{ maxHeight: 'calc(100vh - 200px)' }}>
                        {grouped.map((item, gIdx) => {
                          if (Array.isArray(item)) {
                            const grp = item[0].grupo_serie || 'A';
                            const barClass = GROUP_BAR[grp] || GROUP_BAR.A;
                            const borderClass = GROUP_COLORS[grp] || GROUP_COLORS.A;
                            return (
                              <div key={gIdx} className={`rounded-xl border overflow-hidden ${borderClass}`}>
                                {item.map(ej => (
                                  <div key={ej.id} className="flex items-stretch">
                                    <div className={`w-1 shrink-0 ${barClass}`} />
                                    <EjCard ej={ej} grp={grp} isActive={isActive}
                                      onEdit={() => { setEditingEj(ej); setPendingEjercicio(ej.ejercicio!); }}
                                      onDelete={() => setDeleteEjTarget(ej)}
                                      onDetail={() => setDetailEj(ej)} />
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <div key={item.id} className="rounded-xl overflow-hidden border border-transparent">
                              <EjCard ej={item} isActive={isActive}
                                onEdit={() => { setEditingEj(item); setPendingEjercicio(item.ejercicio!); }}
                                onDelete={() => setDeleteEjTarget(item)}
                                onDetail={() => setDetailEj(item)} />
                            </div>
                          );
                        })}
                        {isActive && (
                          <button onClick={e => { e.stopPropagation(); setShowEjPicker(true); }}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-700/50 border border-gray-600 border-dashed rounded-xl text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors mt-1">
                            <Plus size={14} /> Agregar ejercicio
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
      </div>
    </>
  );
}