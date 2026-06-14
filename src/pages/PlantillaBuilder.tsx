import { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, Save, Search, X, Trash2, Edit3, Dumbbell, ChevronRight, Copy,
} from 'lucide-react';
import { supabase, PlantillaRutina, PlantillaDia, PlantillaEjercicio, Ejercicio, TipoSerie } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import EjercicioDetail from './EjercicioDetail';
import { ExerciseImg } from '../lib/ExerciseImg';

type Props = {
  plantilla?: PlantillaRutina | null;
  onBack: () => void;
  onSaved: (p: PlantillaRutina) => void;
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

const TIPO_BADGE: Record<TipoSerie, string> = {
  serie: 'bg-gray-700 text-gray-300',
  superserie: 'bg-orange-500/20 text-orange-300',
  dropset: 'bg-red-500/20 text-red-300',
  triserie: 'bg-blue-500/20 text-blue-300',
  circuito: 'bg-green-500/20 text-green-300',
};

type DiaConEjercicios = PlantillaDia & { ejercicios: PlantillaEjercicio[] };

// ── Step 1: Name/desc form ────────────────────────────────────────────────────
type Step1Props = {
  plantilla?: PlantillaRutina | null;
  onBack: () => void;
  onNext: (nombre: string, descripcion: string) => void;
};

function Step1Form({ plantilla, onBack, onNext }: Step1Props) {
  const [nombre, setNombre] = useState(plantilla?.nombre || '');
  const [descripcion, setDescripcion] = useState(plantilla?.descripcion || '');
  const [error, setError] = useState('');

  function handleContinuar() {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
    onNext(nombre.trim(), descripcion.trim());
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] text-yellow-400 uppercase tracking-wider">Rutinas</p>
            <h2 className="text-sm font-bold text-white">{plantilla ? 'Editar' : 'Nueva'} Plantilla</h2>
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 py-6 pb-28 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
              <span className="text-gray-900 font-bold text-sm">1</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Datos generales</h3>
              <p className="text-xs text-gray-400">Nombre y descripcion de la plantilla</p>
            </div>
          </div>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4">{error}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Nombre de la plantilla <span className="text-red-400">*</span>
            </label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="ej. Rutina Pecho 4 dias"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Descripcion (opcional)</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Descripcion de la rutina..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400 resize-none"
            />
          </div>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-4 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
        <button onClick={handleContinuar}
          className="w-full py-3.5 rounded-2xl font-bold text-base bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-400/30">
          Continuar
        </button>
      </div>
    </div>
  );
}

// ── Exercise picker modal ─────────────────────────────────────────────────────
type EjercicioPikerProps = {
  onSelect: (e: Ejercicio) => void;
  onClose: () => void;
  title?: string;
};

function EjercicioPicker({ onSelect, onClose, title = 'Seleccionar ejercicio' }: EjercicioPikerProps) {
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
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar ejercicio..."
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8"><span className="w-8 h-8 animate-spin border-2 border-yellow-400 border-t-transparent rounded-full block mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">Sin resultados</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map(e => (
              <button key={e.id} onClick={() => onSelect(e)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left">
                <ExerciseImg
                  url={e.imagen_url}
                  alt={e.nombre}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                  containerClassName="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center shrink-0"
                  fallbackSize={16}
                />
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

// ── Exercise config modal ─────────────────────────────────────────────────────
type EjercicioConfigProps = {
  ejercicio: Ejercicio;
  existing?: PlantillaEjercicio | null;
  onSave: (cfg: Partial<PlantillaEjercicio> & { ejercicio_alternativo?: Ejercicio | null }) => void;
  onClose: () => void;
};

const TIPOS: TipoSerie[] = ['serie', 'superserie', 'dropset', 'triserie', 'circuito'];

function EjercicioConfigModal({ ejercicio, existing, onSave, onClose }: EjercicioConfigProps) {
  const [series, setSeries] = useState(existing?.series?.toString() || '');
  const [repeticiones, setRepeticiones] = useState(existing?.repeticiones || '');
  const [descanso, setDescanso] = useState(existing?.descanso_segundos?.toString() || '');
  const [tipo, setTipo] = useState<TipoSerie>(existing?.tipo || 'serie');
  const [grupo, setGrupo] = useState(existing?.grupo_serie || '');
  const [notas, setNotas] = useState(existing?.notas || '');
  const [altEjercicio, setAltEjercicio] = useState<Ejercicio | null>(existing?.ejercicio_alternativo || null);
  const [showAltPicker, setShowAltPicker] = useState(false);

  const needsGroup = tipo !== 'serie' && tipo !== 'dropset';

  if (showAltPicker) {
    return (
      <EjercicioPicker
        title="Ejercicio alternativo"
        onSelect={e => { setAltEjercicio(e); setShowAltPicker(false); }}
        onClose={() => setShowAltPicker(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col z-50 max-w-lg mx-auto">
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-500">Configurar ejercicio</p>
          <h3 className="text-sm font-bold text-white truncate">{ejercicio.nombre}</h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">Series</label>
            <input type="number" value={series} onChange={e => setSeries(e.target.value)}
              placeholder="4"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">Repeticiones</label>
            <input type="text" value={repeticiones} onChange={e => setRepeticiones(e.target.value)}
              placeholder="12 o 12-10-8"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1.5">Descanso (segundos)</label>
          <input type="number" value={descanso} onChange={e => setDescanso(e.target.value)}
            placeholder="90"
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
              placeholder="A"
              maxLength={1}
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
              {altEjercicio.imagen_url ? (
                <img src={altEjercicio.imagen_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
                  <Dumbbell size={14} className="text-gray-500" />
                </div>
              )}
              <p className="flex-1 text-sm text-white font-semibold truncate">{altEjercicio.nombre}</p>
              <button onClick={() => setAltEjercicio(null)} className="text-gray-500 hover:text-red-400 p-1">
                <X size={14} />
              </button>
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
        <button
          onClick={() => onSave({
            series: series ? parseInt(series) : null,
            repeticiones: repeticiones || null,
            descanso_segundos: descanso ? parseInt(descanso) : null,
            tipo,
            grupo_serie: needsGroup && grupo ? grupo : null,
            notas: notas || null,
            ejercicio_alternativo: altEjercicio,
          })}
          className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2">
          <Save size={16} /> Guardar ejercicio
        </button>
      </div>
    </div>
  );
}

// ── Kanban step 2 ─────────────────────────────────────────────────────────────
type KanbanProps = {
  plantilla: PlantillaRutina;
  onBack: () => void;
  readOnly?: boolean;
  onEditMode?: () => void;
  onDuplicate?: () => void;
};

function KanbanBuilder({ plantilla, onBack, readOnly = false, onEditMode, onDuplicate }: KanbanProps) {
  const [dias, setDias] = useState<DiaConEjercicios[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDia, setSelectedDia] = useState<string | null>(null);

  // Estados de edición inline para el nombre del día
  const [editingDiaId, setEditingDiaId] = useState<string | null>(null);
  const [tempDiaNombre, setTempDiaNombre] = useState('');
  const [updatingDay, setUpdatingDay] = useState(false);

  // Modal states
  const [showAddDay, setShowAddDay] = useState(false);
  const [addDayNum, setAddDayNum] = useState('');
  const [addDayNombre, setAddDayNombre] = useState('');
  const [savingDay, setSavingDay] = useState(false);

  const [showEjPicker, setShowEjPicker] = useState(false);
  const [pendingEjercicio, setPendingEjercicio] = useState<Ejercicio | null>(null);
  const [editingPej, setEditingPej] = useState<PlantillaEjercicio | null>(null);

  const [detailEj, setDetailEj] = useState<PlantillaEjercicio | null>(null);
  const [deleteEjTarget, setDeleteEjTarget] = useState<PlantillaEjercicio | null>(null);
  const [deleteDiaTarget, setDeleteDiaTarget] = useState<DiaConEjercicios | null>(null);

  async function loadDias() {
    const { data: diasData } = await supabase
      .from('plantilla_dias')
      .select('*')
      .eq('plantilla_id', plantilla.id)
      .order('numero_dia');

    if (!diasData) { setLoading(false); return; }

    const { data: ejData } = await supabase
      .from('plantilla_ejercicios')
      .select('*, ejercicio:ejercicio_id(*), ejercicio_alternativo:ejercicio_alternativo_id(*)')
      .in('dia_id', diasData.map(d => d.id))
      .order('orden');

    const map: Record<string, PlantillaEjercicio[]> = {};
    (ejData || []).forEach(e => {
      if (!map[e.dia_id]) map[e.dia_id] = [];
      map[e.dia_id].push(e as PlantillaEjercicio);
    });

    setDias(diasData.map(d => ({ ...d, ejercicios: map[d.id] || [] })));
    if (!selectedDia && diasData.length > 0) setSelectedDia(diasData[0].id);
    setLoading(false);
  }

  useEffect(() => { loadDias(); }, [plantilla.id]);

  async function handleAddDay() {
    if (!addDayNum || !addDayNombre.trim()) return;
    setSavingDay(true);
    const { data, error } = await supabase.from('plantilla_dias').insert({
      plantilla_id: plantilla.id,
      numero_dia: parseInt(addDayNum),
      nombre_dia: addDayNombre.trim(),
    }).select().single();
    setSavingDay(false);
    if (error) { console.error(error); return; }
    if (data) {
      setShowAddDay(false);
      setAddDayNum(''); setAddDayNombre('');
      loadDias();
    }
  }

  async function handleUpdateDiaNombre(diaId: string) {
    if (!tempDiaNombre.trim()) return;
    setUpdatingDay(true);
    const { error } = await supabase
      .from('plantilla_dias')
      .update({ nombre_dia: tempDiaNombre.trim() })
      .eq('id', diaId);

    if (!error) {
      setDias(prev => prev.map(d => d.id === diaId ? { ...d, nombre_dia: tempDiaNombre.trim() } : d));
      setEditingDiaId(null);
    }
    setUpdatingDay(false);
  }

  async function handleDeleteDia(dia: DiaConEjercicios) {
    await supabase.from('plantilla_dias').delete().eq('id', dia.id);
    setDeleteDiaTarget(null);
    const remaining = dias.filter(d => d.id !== dia.id);
    setDias(remaining);
    setSelectedDia(remaining[0]?.id || null);
  }

  async function handleSaveEjercicio(cfg: Partial<PlantillaEjercicio> & { ejercicio_alternativo?: Ejercicio | null }) {
    if (!selectedDia) return;
    const diaObj = dias.find(d => d.id === selectedDia)!;

    const payload = {
      dia_id: selectedDia,
      ejercicio_id: pendingEjercicio!.id,
      orden: editingPej?.orden ?? diaObj.ejercicios.length,
      series: cfg.series ?? null,
      repeticiones: cfg.repeticiones ?? null,
      descanso_segundos: cfg.descanso_segundos ?? null,
      tipo: cfg.tipo || 'serie',
      grupo_serie: cfg.grupo_serie ?? null,
      notas: cfg.notas ?? null,
      ejercicio_alternativo_id: cfg.ejercicio_alternativo?.id ?? null,
    };

    if (editingPej) {
      await supabase.from('plantilla_ejercicios').update(payload).eq('id', editingPej.id);
    } else {
      await supabase.from('plantilla_ejercicios').insert(payload);
    }

    setPendingEjercicio(null);
    setEditingPej(null);
    loadDias();
  }

  async function handleDeleteEjercicio(pej: PlantillaEjercicio) {
    await supabase.from('plantilla_ejercicios').delete().eq('id', pej.id);
    setDeleteEjTarget(null);
    loadDias();
  }

  if (detailEj) {
    return <EjercicioDetail ejercicioConfig={detailEj} onBack={() => setDetailEj(null)} />;
  }

  function groupExercicios(ejercicios: PlantillaEjercicio[]) {
    const result: Array<PlantillaEjercicio | PlantillaEjercicio[]> = [];
    let i = 0;
    while (i < ejercicios.length) {
      const e = ejercicios[i];
      const needsGroup = e.tipo !== 'serie' && e.tipo !== 'dropset';
      if (needsGroup && e.grupo_serie) {
        const group = ejercicios.filter(x => x.tipo === e.tipo && x.grupo_serie === e.grupo_serie);
        result.push(group);
        i += group.length;
      } else {
        result.push(e);
        i++;
      }
    }
    return result;
  }

  return (
    <>
      {showAddDay && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 max-w-lg mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-t-2xl w-full p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Agregar dia</h3>
              <button onClick={() => setShowAddDay(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Numero de dia (1-7)</label>
                <input type="number" min={1} max={7} value={addDayNum} onChange={e => setAddDayNum(e.target.value)}
                  placeholder="ej. 1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Nombre del dia</label>
                <input type="text" value={addDayNombre} onChange={e => setAddDayNombre(e.target.value)}
                  placeholder="ej. Pecho y Triceps"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400" />
              </div>
            </div>
            <button onClick={handleAddDay} disabled={savingDay || !addDayNum || !addDayNombre.trim()}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-xl disabled:opacity-40 transition-colors">
              {savingDay ? 'Guardando...' : 'Agregar dia'}
            </button>
          </div>
        </div>
      )}

      {deleteDiaTarget && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 max-w-lg mx-auto px-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full">
            <Trash2 size={36} className="text-red-400 mb-3 mx-auto" />
            <h3 className="text-base font-bold text-white text-center mb-1">Eliminar dia</h3>
            <p className="text-sm text-gray-400 text-center mb-1">DIA {deleteDiaTarget.numero_dia} — {deleteDiaTarget.nombre_dia}</p>
            <p className="text-xs text-red-400 text-center mb-5">Se eliminaran todos sus ejercicios</p>
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
          onClose={() => { setShowEjPicker(false); setEditingPej(null); }}
        />
      )}

      {pendingEjercicio && (
        <EjercicioConfigModal
          ejercicio={pendingEjercicio}
          existing={editingPej}
          onSave={handleSaveEjercicio}
          onClose={() => { setPendingEjercicio(null); setEditingPej(null); }}
        />
      )}

      <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors shrink-0">
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] text-yellow-400 uppercase tracking-wider">Plantilla</p>
                <h2 className="text-sm font-bold text-white truncate">{plantilla.nombre}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {readOnly ? (
                <>
                  {onDuplicate && (
                    <button onClick={onDuplicate}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-semibold text-gray-300 transition-colors">
                      <Copy size={13} /> Duplicar
                    </button>
                  )}
                  {onEditMode && (
                    <button onClick={onEditMode}
                      className="flex items-center gap-1 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 rounded-lg text-xs font-semibold text-gray-900 transition-colors">
                      <Edit3 size={13} /> Editar
                    </button>
                  )}
                </>
              ) : (
                <button onClick={() => setShowAddDay(true)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0">
                  <Plus size={14} /> Dia
                </button>
              )}
            </div>
          </div>
        </header>

        {dias.length > 0 && (
          <div className="bg-gray-900 border-b border-gray-800 overflow-x-auto shrink-0">
            <div className="flex gap-1 px-3 py-2 min-w-max">
              {dias.map(d => (
                <button key={d.id} onClick={() => setSelectedDia(d.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedDia === d.id
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}>
                  DIA {d.numero_dia}
                </button>
              ))}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-hidden">
          {loading ? (
            <div className="text-center py-12"><span className="w-8 h-8 animate-spin border-2 border-yellow-400 border-t-transparent rounded-full block mx-auto" /></div>
          ) : dias.length === 0 ? (
            <div className="text-center py-16 text-gray-400 px-4">
              <Dumbbell size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold mb-1">Sin dias</p>
              <p className="text-xs text-gray-500 mb-5">Agrega dias a tu plantilla</p>
              {!readOnly && (
                <button onClick={() => setShowAddDay(true)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  Agregar primer dia
                </button>
              )}
            </div>
          ) : (
            <div className="h-full overflow-x-auto">
              <div className="flex gap-3 px-3 py-3 h-full" style={{ minWidth: `${dias.length * 85}vw` }}>
                {dias.map(dia => {
                  const isActive = selectedDia === dia.id;
                  const grouped = groupExercicios(dia.ejercicios);
                  return (
                    <div
                      key={dia.id}
                      className="shrink-0 flex flex-col"
                      style={{ width: '82vw', maxWidth: '360px' }}
                      onClick={() => setSelectedDia(dia.id)}
                    >
                      <div className={`rounded-t-2xl px-4 py-3 flex items-center justify-between ${isActive ? 'bg-yellow-400/10 border border-yellow-400/30' : 'bg-gray-800'}`}>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-yellow-400' : 'text-gray-500'}`}>
                            DIA {dia.numero_dia}
                          </p>
                          
                          {editingDiaId === dia.id ? (
                            <div className="flex items-center gap-2 mt-1 pr-2">
                              <input
                                type="text"
                                value={tempDiaNombre}
                                onChange={e => setTempDiaNombre(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleUpdateDiaNombre(dia.id);
                                  if (e.key === 'Escape') setEditingDiaId(null);
                                }}
                                autoFocus
                                disabled={updatingDay}
                                className="w-full bg-gray-900 border border-yellow-400 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none"
                              />
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleUpdateDiaNombre(dia.id); }}
                                className="text-xs font-bold text-yellow-400 hover:text-yellow-500 shrink-0"
                              >
                                {updatingDay ? '...' : 'OK'}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 group cursor-pointer mt-0.5" onClick={(e) => {
                              if(readOnly) return;
                              e.stopPropagation();
                              setEditingDiaId(dia.id);
                              setTempDiaNombre(dia.nombre_dia);
                            }}>
                              <p className="text-sm font-bold text-white truncate">{dia.nombre_dia}</p>
                              {!readOnly && (
                                <Edit3 size={11} className="text-gray-500 hover:text-yellow-400 transition-colors opacity-60 group-hover:opacity-100 shrink-0" />
                              )}
                            </div>
                          )}
                        </div>

                        {isActive && !readOnly && editingDiaId !== dia.id && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); setDeleteDiaTarget(dia); }}
                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className={`flex-1 overflow-y-auto rounded-b-2xl p-3 space-y-2 ${isActive ? 'bg-gray-800/60' : 'bg-gray-800/30'}`}
                        style={{ maxHeight: 'calc(100vh - 200px)' }}>
                        {grouped.map((item, idx) => {
                          if (Array.isArray(item)) {
                            const grp = item[0].grupo_serie || 'A';
                            const barClass = GROUP_BAR[grp] || GROUP_BAR.A;
                            const borderClass = GROUP_COLORS[grp] || GROUP_COLORS.A;
                            return (
                              <div key={idx} className={`rounded-xl border ${borderClass} overflow-hidden`}>
                                {item.map(pej => (
                                  <div key={pej.id} className="flex items-stretch">
                                    <div className={`w-1 shrink-0 ${barClass}`} />
                                    <ExerciseCard
                                      pej={pej}
                                      grp={grp}
                                      isActive={isActive}
                                      readOnly={readOnly}
                                      onDetail={() => setDetailEj(pej)}
                                      onEdit={() => { setEditingPej(pej); setPendingEjercicio(pej.ejercicio!); }}
                                      onDelete={() => setDeleteEjTarget(pej)}
                                    />
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            return (
                              <ExerciseCard
                                key={item.id}
                                pej={item}
                                isActive={isActive}
                                readOnly={readOnly}
                                onDetail={() => setDetailEj(item)}
                                onEdit={() => { setEditingPej(item); setPendingEjercicio(item.ejercicio!); }}
                                onDelete={() => setDeleteEjTarget(item)}
                              />
                            );
                          }
                        })}

                        {isActive && !readOnly && (
                          <button
                            onClick={e => { e.stopPropagation(); setShowEjPicker(true); }}
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

type EjCardProps = {
  pej: PlantillaEjercicio;
  grp?: string;
  isActive: boolean;
  readOnly?: boolean;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function ExerciseCard({ pej, grp, isActive, readOnly = false, onDetail, onEdit, onDelete }: EjCardProps) {
  const tipo = pej.tipo as TipoSerie;
  return (
    <div className="flex-1 bg-gray-900/80 p-3">
      <div className="flex items-center gap-2">
        <ExerciseImg
          url={pej.ejercicio?.imagen_url}
          alt=""
          className="w-9 h-9 rounded-lg object-cover shrink-0"
          containerClassName="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center shrink-0"
          fallbackSize={12}
        />
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onDetail}>
          <p className="text-xs font-bold text-white truncate">{pej.ejercicio?.nombre}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {(pej.series || pej.repeticiones) && (
              <span className="text-[10px] text-gray-400">
                {pej.series ? `${pej.series}×` : ''}{pej.repeticiones || ''}
              </span>
            )}
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${TIPO_BADGE[tipo]}`}>
              {grp ? `${grp} · ${tipo}` : tipo}
            </span>
          </div>
        </div>
        {isActive && !readOnly && (
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

// ── Main export ───────────────────────────────────────────────────────────────
export default function PlantillaBuilder({ plantilla, onBack, onSaved }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'kanban'>('form');
  const [currentPlantilla, setCurrentPlantilla] = useState<PlantillaRutina | null>(plantilla || null);
  const [readOnly, setReadOnly] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    if (plantilla) {
      setCurrentPlantilla(plantilla);
      setStep('kanban');
      setReadOnly(false);
    }
  }, [plantilla]);

  async function handleStep1(nombre: string, descripcion: string) {
    if (currentPlantilla) {
      const { data } = await supabase
        .from('plantillas_rutina')
        .update({ nombre, descripcion })
        .eq('id', currentPlantilla.id)
        .select()
        .single();
      if (data) {
        setCurrentPlantilla(data);
        onSaved(data);
      }
    } else {
      const { data } = await supabase
        .from('plantillas_rutina')
        .insert({ nombre, descripcion, creado_por: user?.id })
        .select()
        .single();
      if (data) {
        setCurrentPlantilla(data);
        onSaved(data);
      }
    }
    setStep('kanban');
  }

  async function handleDuplicate() {
    if (!currentPlantilla || !user) return;
    setDuplicating(true);

    const { data: newPlantilla } = await supabase
      .from('plantillas_rutina')
      .insert({
        nombre: `${currentPlantilla.nombre} (copia)`,
        descripcion: currentPlantilla.descripcion,
        creado_por: user.id,
      })
      .select()
      .single();

    if (!newPlantilla) { setDuplicating(false); return; }

    const { data: diasData } = await supabase
      .from('plantilla_dias')
      .select('*, plantilla_ejercicios(*)')
      .eq('plantilla_id', currentPlantilla.id)
      .order('numero_dia', { ascending: true });

    if (diasData) {
      for (const dia of diasData) {
        const { data: newDia } = await supabase
          .from('plantilla_dias')
          .insert({ plantilla_id: newPlantilla.id, numero_dia: dia.numero_dia, nombre_dia: dia.nombre_dia })
          .select()
          .single();
        if (newDia && dia.plantilla_ejercicios?.length > 0) {
          const ejsToInsert = dia.plantilla_ejercicios.map((e: Omit<PlantillaEjercicio, 'ejercicio' | 'ejercicio_alternativo'>) => ({
            dia_id: newDia.id,
            ejercicio_id: e.ejercicio_id,
            orden: e.orden,
            series: e.series,
            repeticiones: e.repeticiones,
            descanso_segundos: e.descanso_segundos,
            tipo: e.tipo,
            grupo_serie: e.grupo_serie,
            notas: e.notas,
            ejercicio_alternativo_id: e.ejercicio_alternativo_id,
          }));
          await supabase.from('plantilla_ejercicios').insert(ejsToInsert);
        }
      }
    }

    setDuplicating(false);
    setCurrentPlantilla(newPlantilla);
    setReadOnly(false);
    onSaved(newPlantilla);
  }

  if (step === 'form' || !currentPlantilla) {
    return <Step1Form plantilla={currentPlantilla} onBack={onBack} onNext={handleStep1} />;
  }

  if (duplicating) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <span className="w-10 h-10 animate-spin border-2 border-yellow-400 border-t-transparent rounded-full block mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Duplicando plantilla...</p>
      </div>
    );
  }

  return (
    <KanbanBuilder
      plantilla={currentPlantilla}
      onBack={onBack}
      readOnly={readOnly}
      onEditMode={() => setReadOnly(false)}
      onDuplicate={handleDuplicate}
    />
  );
}