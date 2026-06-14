import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Search, Dumbbell, X, Plus, Save, Trash2, Edit3, Youtube, Image, Upload,
} from 'lucide-react';
import { supabase, Ejercicio } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ExerciseImg } from '../lib/ExerciseImg';
type Props = {
  onClose: () => void;
};

const muscleGroups = [
  'Espalda', 'Pectorales', 'Hombros', 'Biceps', 'Triceps', 'Cuadriceps',
  'Gluteos', 'Femorales', 'Trapecios', 'Pantorrillas', 'Abdominales', 'Cardio',
  'Manguito rotador', 'Estiramiento', 'Lumbares', 'Aductor', 'Abductor',
];

const tiposEjercicio = ['Fuerza', 'Cardio', 'Fortalecimiento', 'TRX', 'Movilidad'];

const muscleColorMap: Record<string, string> = {
  'Espalda': 'bg-purple-500/20 border-purple-500/30 text-purple-300',
  'Pectorales': 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  'Hombros': 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
  'Biceps': 'bg-red-500/20 border-red-500/30 text-red-300',
  'Triceps': 'bg-pink-500/20 border-pink-500/30 text-pink-300',
  'Cuadriceps': 'bg-green-500/20 border-green-500/30 text-green-300',
  'Gluteos': 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
  'Femorales': 'bg-teal-500/20 border-teal-500/30 text-teal-300',
  'Trapecios': 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
  'Pantorrillas': 'bg-lime-500/20 border-lime-500/30 text-lime-300',
  'Abdominales': 'bg-orange-500/20 border-orange-500/30 text-orange-300',
  'Cardio': 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
  'Manguito rotador': 'bg-violet-500/20 border-violet-500/30 text-violet-300',
  'Estiramiento': 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
  'Lumbares': 'bg-amber-500/20 border-amber-500/30 text-amber-300',
  'Aductor': 'bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-300',
  'Abductor': 'bg-rose-500/20 border-rose-500/30 text-rose-300',
};

// ── Exercise Form ──────────────────────────────────────────────────────────────
function EjercicioForm({
  ejercicio,
  onSaved,
  onCancel,
}: {
  ejercicio?: Ejercicio | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState(ejercicio?.nombre || '');
  const [descripcion, setDescripcion] = useState(ejercicio?.descripcion || '');
  const [comoEjecutar, setComoEjecutar] = useState(ejercicio?.como_ejecutar || '');
  const [grupoMuscular, setGrupoMuscular] = useState(ejercicio?.grupo_muscular || '');
  const [tipoEjercicio, setTipoEjercicio] = useState(ejercicio?.tipo_ejercicio || '');
  const [musculosSecundarios, setMusculosSecundarios] = useState(ejercicio?.musculos_secundarios || '');
  const [consejos, setConsejos] = useState(ejercicio?.consejos || '');
  const [youtubeUrl, setYoutubeUrl] = useState(ejercicio?.youtube_url || '');
  const [imagenUrl, setImagenUrl] = useState(ejercicio?.imagen_url || '');
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!nombre.trim() || !grupoMuscular) {
      setError('Nombre y grupo muscular son obligatorios');
      return;
    }
    setSaving(true);
    setError('');

    let finalImagenUrl = imagenUrl;
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `ejercicios/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('profile-photos')
        .upload(path, imageFile, { upsert: true });
      if (!uploadErr) {
        finalImagenUrl = supabase.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
      }
    }

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      como_ejecutar: comoEjecutar.trim() || null,
      grupo_muscular: grupoMuscular,
      tipo_ejercicio: tipoEjercicio || null,
      musculos_secundarios: musculosSecundarios.trim() || null,
      consejos: consejos.trim() || null,
      youtube_url: youtubeUrl.trim() || null,
      imagen_url: finalImagenUrl || null,
    };

    if (ejercicio) {
      const { error: e } = await supabase.from('ejercicios').update(payload).eq('id', ejercicio.id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase.from('ejercicios').insert(payload);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-400';
  const labelClass = 'block text-xs font-semibold text-gray-400 mb-1.5';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-[10px] text-yellow-400 font-semibold uppercase tracking-wider">Ejercicios</p>
          <h2 className="text-sm font-bold text-white">{ejercicio ? 'Editar ejercicio' : 'Nuevo ejercicio'}</h2>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto pb-28 space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl p-3">{error}</div>
        )}

        <div>
          <label className={labelClass}>Nombre *</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} className={inputClass} placeholder="ej. Press banca" />
        </div>

        <div>
          <label className={labelClass}>Descripcion general</label>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3}
            className={`${inputClass} resize-none`} placeholder="Descripcion breve del ejercicio..." />
        </div>

        <div>
          <label className={labelClass}>Como se ejecuta (paso a paso)</label>
          <textarea value={comoEjecutar} onChange={e => setComoEjecutar(e.target.value)} rows={4}
            className={`${inputClass} resize-none`} placeholder="1. Posicion inicial...\n2. Movimiento..." />
        </div>

        <div>
          <label className={labelClass}>Grupo muscular *</label>
          <div className="grid grid-cols-3 gap-2">
            {muscleGroups.map(g => (
              <button key={g} type="button" onClick={() => setGrupoMuscular(g)}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors ${
                  grupoMuscular === g ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Tipo de ejercicio</label>
          <div className="flex flex-wrap gap-2">
            {tiposEjercicio.map(t => (
              <button key={t} type="button" onClick={() => setTipoEjercicio(tipoEjercicio === t ? '' : t)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  tipoEjercicio === t ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Imagen</label>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setImageMode('url')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${imageMode === 'url' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-400'}`}>
              <Image size={12} /> URL externa
            </button>
            <button type="button" onClick={() => setImageMode('upload')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${imageMode === 'upload' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-400'}`}>
              <Upload size={12} /> Subir imagen
            </button>
          </div>
          {imageMode === 'url' ? (
            <input value={imagenUrl} onChange={e => setImagenUrl(e.target.value)}
              className={inputClass} placeholder="https://..." />
          ) : (
            <div>
              <label className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 border border-dashed border-gray-600 rounded-xl text-sm text-gray-400 hover:text-white hover:border-gray-500 cursor-pointer transition-colors">
                <Upload size={16} /> {imageFile ? imageFile.name : 'Seleccionar imagen'}
                <input ref={fileRef} type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
            </div>
          )}
          {(imagenUrl || imageFile) && (
            <div className="mt-2 w-full h-32 rounded-xl overflow-hidden bg-gray-800">
              {imageFile
                ? <img src={URL.createObjectURL(imageFile)} alt="" className="w-full h-full object-cover" />
                : imagenUrl
                  ? <img src={imagenUrl} alt="" className="w-full h-full object-cover" />
                  : null}
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-1"><Youtube size={12} className="text-red-400" /> Enlace YouTube</span>
          </label>
          <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
            className={inputClass} placeholder="https://youtube.com/watch?v=..." />
        </div>

        <div>
          <label className={labelClass}>Musculos secundarios</label>
          <input value={musculosSecundarios} onChange={e => setMusculosSecundarios(e.target.value)}
            className={inputClass} placeholder="ej. Core, Estabilizadores" />
        </div>

        <div>
          <label className={labelClass}>Consejos y errores comunes</label>
          <textarea value={consejos} onChange={e => setConsejos(e.target.value)} rows={3}
            className={`${inputClass} resize-none`} placeholder="Consejos para ejecutar correctamente..." />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-4 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 disabled:opacity-50 transition-all">
          <Save size={18} />
          {saving ? 'Guardando...' : ejercicio ? 'Guardar cambios' : 'Crear ejercicio'}
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ExerciseLibrary({ onClose }: Props) {
  const { profile } = useAuth();
  const canEdit = profile?.rol === 'entrenador' || profile?.rol === 'entrenador_administrador';

  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Ejercicio | null>(null);
  const [editingExercise, setEditingExercise] = useState<Ejercicio | null | 'new'>('');
  const [deleteTarget, setDeleteTarget] = useState<Ejercicio | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadExercises(); }, []);

  async function loadExercises() {
    setLoading(true);
    const { data } = await supabase.from('ejercicios').select('*').order('grupo_muscular', { ascending: true });
    setEjercicios(data || []);
    setLoading(false);
  }

  if (editingExercise !== '') {
    return (
      <EjercicioForm
        ejercicio={editingExercise === 'new' ? null : editingExercise}
        onSaved={() => { setEditingExercise(''); loadExercises(); setSelectedExercise(null); }}
        onCancel={() => setEditingExercise('')}
      />
    );
  }

  if (deleteTarget) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center max-w-lg mx-auto px-6">
        <Trash2 size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-white mb-1">Eliminar ejercicio</h2>
        <p className="text-sm text-gray-400 text-center mb-6">{deleteTarget.nombre}</p>
        <div className="flex gap-3 w-full">
          <button onClick={() => setDeleteTarget(null)}
            className="flex-1 py-3 bg-gray-800 rounded-xl text-gray-300 text-sm font-semibold">Cancelar</button>
          <button onClick={async () => {
            setDeleting(true);
            await supabase.from('ejercicios').delete().eq('id', deleteTarget.id);
            setDeleting(false); setDeleteTarget(null); setSelectedExercise(null); loadExercises();
          }} disabled={deleting}
            className="flex-1 py-3 bg-red-600 rounded-xl text-white text-sm font-semibold disabled:opacity-50">
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    );
  }

  if (selectedExercise) {
    return (
      <ExerciseDetail
        exercise={selectedExercise}
        canEdit={canEdit}
        onBack={() => setSelectedExercise(null)}
        onEdit={() => setEditingExercise(selectedExercise)}
        onDelete={() => setDeleteTarget(selectedExercise)}
      />
    );
  }

  const filtered = ejercicios.filter(e =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) &&
    (!selectedGroup || e.grupo_muscular === selectedGroup)
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto page-enter">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] text-yellow-400 font-semibold uppercase tracking-wider">Biblioteca</p>
            <h2 className="text-lg font-bold text-white font-rajdhani">Ejercicios</h2>
          </div>
        </div>
        {canEdit && (
          <button onClick={() => setEditingExercise('new')}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
            <Plus size={14} /> Nuevo
          </button>
        )}
      </header>

      <main className="flex-1 px-4 py-5 overflow-y-auto pb-8">
        <div className="space-y-4">
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar ejercicio..." className="input-field pl-10" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <button onClick={() => setSelectedGroup(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold text-sm transition-all shrink-0 ${
                selectedGroup === null ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}>
              Todos
            </button>
            {muscleGroups.map(group => (
              <button key={group} onClick={() => setSelectedGroup(group)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold text-sm transition-all shrink-0 ${
                  selectedGroup === group ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}>
                {group}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><span className="w-8 h-8 spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-500">
              <Dumbbell size={40} className="mb-3 opacity-40" />
              <p className="text-sm">No hay ejercicios</p>
              {canEdit && (
                <button onClick={() => setEditingExercise('new')}
                  className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-xl text-sm font-semibold">
                  Crear primer ejercicio
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(e => (
                <button key={e.id} onClick={() => setSelectedExercise(e)}
                  className="card overflow-hidden hover:border-yellow-400/50 transition-all duration-200 group flex flex-col">
                  {e.imagen_url ? (
                    <div className="w-full h-32 overflow-hidden bg-slate-900">
                      <ExerciseImg
                        url={e.imagen_url}
                        alt={e.nombre}
                        className="w-full h-full object-contain"
                        containerClassName="w-full h-full bg-slate-900 flex items-center justify-center"
                        fallbackSize={36}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <Dumbbell size={40} className="text-gray-600" />
                    </div>
                  )}
                  <div className="p-3 flex flex-col flex-1">
                    <p className="text-sm font-semibold text-white font-rajdhani line-clamp-2 mb-2">{e.nombre}</p>
                    <div className={`inline-flex w-fit text-[10px] font-bold px-2.5 py-1 rounded-full border ${muscleColorMap[e.grupo_muscular] || 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                      {e.grupo_muscular}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Exercise Detail ────────────────────────────────────────────────────────────
function ExerciseDetail({
  exercise, canEdit, onBack, onEdit, onDelete,
}: {
  exercise: Ejercicio; canEdit: boolean; onBack: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const gradientMap: Record<string, string> = {
    'Espalda': 'from-purple-600 to-purple-700',
    'Pectorales': 'from-blue-600 to-blue-700',
    'Hombros': 'from-yellow-600 to-yellow-700',
    'Biceps': 'from-red-600 to-red-700',
    'Triceps': 'from-pink-600 to-pink-700',
    'Cuadriceps': 'from-green-600 to-green-700',
    'Gluteos': 'from-indigo-600 to-indigo-700',
    'Femorales': 'from-teal-600 to-teal-700',
    'Abdominales': 'from-orange-600 to-orange-700',
    'Cardio': 'from-cyan-600 to-cyan-700',
  };

  function extractYoutubeId(url: string | null | undefined): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  const ytId = extractYoutubeId(exercise.youtube_url);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-lg mx-auto page-enter">
      <div className={`relative bg-gradient-to-br ${gradientMap[exercise.grupo_muscular] || 'from-gray-700 to-gray-800'} pt-4`}>
        <div className="px-4 pb-4 flex items-center justify-between">
          <button onClick={onBack}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-black/40 text-white hover:bg-black/60 transition-all">
            <ArrowLeft size={20} />
          </button>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button onClick={onEdit}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-black/40 text-white hover:bg-black/60 transition-all">
                <Edit3 size={16} />
              </button>
              <button onClick={onDelete}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/30 text-red-300 hover:bg-red-500/50 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
        {exercise.imagen_url ? (
          <div className="w-full h-56 overflow-hidden bg-slate-900">
            <ExerciseImg
              url={exercise.imagen_url}
              alt={exercise.nombre}
              className="w-full h-full object-contain"
              containerClassName="w-full h-56 bg-slate-900 flex items-center justify-center"
              fallbackSize={60}
            />
          </div>
        ) : (
          <div className="w-full h-56 flex items-center justify-center">
            <Dumbbell size={60} className="text-white/30" />
          </div>
        )}
      </div>

      <main className="flex-1 px-4 py-5 overflow-y-auto pb-8 space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-white font-rajdhani mb-2">{exercise.nombre}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`inline-flex text-xs font-bold px-3 py-1.5 rounded-full border ${muscleColorMap[exercise.grupo_muscular] || 'bg-gray-700 border-gray-600 text-gray-300'}`}>
              {exercise.grupo_muscular}
            </div>
            {exercise.tipo_ejercicio && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-700 text-gray-300 border border-gray-600">
                {exercise.tipo_ejercicio}
              </span>
            )}
          </div>
        </div>

        {exercise.descripcion && (
          <div className="card p-4 space-y-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Descripcion</p>
            <p className="text-gray-200 text-sm leading-relaxed">{exercise.descripcion}</p>
          </div>
        )}

        {exercise.como_ejecutar && (
          <div className="card p-4 space-y-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Como ejecutar</p>
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">{exercise.como_ejecutar}</p>
          </div>
        )}

        {ytId && (
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Youtube size={12} className="text-red-400" /> Video
            </p>
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {exercise.musculos_secundarios && (
          <div className="card p-4 space-y-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Musculos secundarios</p>
            <p className="text-gray-200 text-sm">{exercise.musculos_secundarios}</p>
          </div>
        )}

        {exercise.consejos && (
          <div className="card p-4 space-y-2 border-orange-500/30 bg-orange-500/5">
            <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wider">Consejos y errores comunes</p>
            <p className="text-gray-200 text-sm leading-relaxed">{exercise.consejos}</p>
          </div>
        )}
      </main>
    </div>
  );
}
